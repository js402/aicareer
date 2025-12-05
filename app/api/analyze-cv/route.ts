import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { hashCV, getCachedAnalysis, storeAnalysis } from '@/lib/cv-cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Retry helper function
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 1,
    stepName: string = 'operation'
): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error as Error
            if (attempt < maxRetries) {
                console.log(`${stepName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`)
                // Wait a bit before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
            }
        }
    }

    throw lastError || new Error(`${stepName} failed after ${maxRetries + 1} attempts`)
}


// Step 1: Input Validation Prompt
const INPUT_VALIDATION_PROMPT = `You are a CV structure validator. Extract and validate the following information from the CV:

Return a JSON object with:
{
  "isValid": boolean,
  "extractedInfo": {
    "name": string,
    "contactInfo": string,
    "experience": Array<{role: string, company: string, duration: string}>,
    "skills": string[],
    "education": Array<{degree: string, institution: string, year: string}>
  },
  "issues": string[] // List any missing or problematic sections
}

If critical information is missing (name, experience, or skills), set isValid to false.`

// Step 2: Analysis Generation Prompt
const ANALYSIS_GENERATION_PROMPT = `You are an expert career advisor and CV analyst. Based on the validated CV structure, provide a comprehensive analysis in markdown format.

Your analysis MUST include these sections:

# Executive Summary
A brief 2-3 sentence overview of the candidate's profile and key strengths.

# Strengths
- List 4-6 key strengths with specific examples from their experience
- Focus on both technical and soft skills

# Areas for Improvement
- List 3-5 areas where the CV could be enhanced
- Provide actionable suggestions for each

# Career Trajectory Analysis
- Analyze the progression and coherence of their career path
- Identify patterns and strategic moves

# Market Positioning
- How competitive is this profile in the current market?
- What roles/industries are they best suited for?

# Recommendations
- 3-5 specific, actionable recommendations to strengthen their profile

Use proper markdown formatting with headers (##), bullet points (-), and **bold** for emphasis.`

// Step 3: Output Validation Prompt
const OUTPUT_VALIDATION_PROMPT = `You are a quality assurance validator. Check if the analysis meets these requirements:

1. Contains all required sections (Executive Summary, Strengths, Areas for Improvement, Career Trajectory Analysis, Market Positioning, Recommendations)
2. Uses proper markdown formatting
3. Is actionable and specific (not generic)
4. Is between 500-1500 words

Return JSON:
{
  "isValid": boolean,
  "missingSections": string[],
  "qualityIssues": string[]
}`

interface ValidationResult {
    isValid: boolean
    extractedInfo?: Record<string, unknown>
    issues?: string[]
}

export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { cvContent } = await request.json()

        if (!cvContent) {
            return NextResponse.json(
                { error: 'CV content is required' },
                { status: 400 }
            )
        }

        const cvHash = await hashCV(cvContent)
        const cachedResult = await getCachedAnalysis(supabase, user.id, cvHash)

        if (cachedResult) {
            return NextResponse.json({
                analysis: cachedResult.analysis,
                fromCache: true,
                cachedAt: cachedResult.created_at,
                filename: cachedResult.filename,
            })
        }

        // STEP 1: Validate and extract CV structure (with smart retry)
        let validation: ValidationResult | undefined
        let validationAttempt = 0
        const maxValidationAttempts = 2

        while (validationAttempt < maxValidationAttempts) {
            try {
                const messages: ChatCompletionMessageParam[] = [
                    { role: 'system', content: INPUT_VALIDATION_PROMPT },
                    { role: 'user', content: `Validate this CV:\n\n${cvContent}` }
                ]

                // If this is a retry, add the previous error as context
                if (validationAttempt > 0 && validation) {
                    messages.push({
                        role: 'assistant',
                        content: JSON.stringify(validation)
                    })
                    messages.push({
                        role: 'user',
                        content: `The previous validation had issues: ${validation.issues?.join(', ') || 'Invalid structure'}. Please try again and fix these issues.`
                    })
                }

                const validationCompletion = await openai.chat.completions.create({
                    model: DEFAULT_MODEL,
                    messages,
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                })

                validation = JSON.parse(validationCompletion.choices[0]?.message?.content || '{}') as ValidationResult

                if (validation?.isValid) {
                    break // Success!
                }

                validationAttempt++
                if (validationAttempt < maxValidationAttempts) {
                    console.log(`CV validation failed (attempt ${validationAttempt}/${maxValidationAttempts}), retrying with error feedback...`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (error) {
                validationAttempt++
                if (validationAttempt >= maxValidationAttempts) {
                    throw error
                }
                console.log(`CV validation error (attempt ${validationAttempt}/${maxValidationAttempts}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        if (!validation?.isValid) {
            return NextResponse.json(
                {
                    error: 'CV validation failed',
                    issues: validation?.issues || ['Unable to extract required information from CV']
                },
                { status: 400 }
            )
        }

        // STEP 2: Generate analysis based on validated structure (with smart retry)
        let analysis: string = ''
        let analysisAttempt = 0
        const maxAnalysisAttempts = 2

        while (analysisAttempt < maxAnalysisAttempts) {
            try {
                const messages: ChatCompletionMessageParam[] = [
                    { role: 'system', content: ANALYSIS_GENERATION_PROMPT },
                    {
                        role: 'user',
                        content: `Analyze this CV based on the extracted information:\n\n${JSON.stringify(validation.extractedInfo, null, 2)}\n\nOriginal CV:\n${cvContent}`
                    }
                ]

                const analysisCompletion = await openai.chat.completions.create({
                    model: DEFAULT_MODEL,
                    messages,
                    temperature: 0.7,
                    max_tokens: 2500,
                })

                const content = analysisCompletion.choices[0]?.message?.content
                if (content) {
                    analysis = content
                    break // Success!
                }

                analysisAttempt++
                if (analysisAttempt < maxAnalysisAttempts) {
                    console.log(`Analysis generation failed (attempt ${analysisAttempt}/${maxAnalysisAttempts}), retrying...`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (error) {
                analysisAttempt++
                if (analysisAttempt >= maxAnalysisAttempts) {
                    throw error
                }
                console.log(`Analysis generation error (attempt ${analysisAttempt}/${maxAnalysisAttempts}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        if (!analysis) {
            return NextResponse.json(
                { error: 'No analysis generated after retries' },
                { status: 500 }
            )
        }

        // STEP 3: Validate output quality (with retry)
        const qualityCheck = await retryWithBackoff(async () => {
            const outputValidation = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: OUTPUT_VALIDATION_PROMPT },
                    { role: 'user', content: `Validate this analysis:\n\n${analysis}` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            })
            return JSON.parse(outputValidation.choices[0]?.message?.content || '{}')
        }, 1, 'Output Validation')

        // If quality issues found, log them but still return the analysis
        if (!qualityCheck.isValid) {
            console.warn('Analysis quality issues:', qualityCheck.qualityIssues)
        }

        // Store analysis in cache
        try {
            const filename = `CV-${new Date().toISOString().split('T')[0]}`
            await storeAnalysis(supabase, user.id, cvHash, cvContent, filename, analysis)
        } catch (cacheError) {
            console.warn('Failed to cache analysis:', cacheError)
        }

        return NextResponse.json({
            analysis,
            fromCache: false,
            validation: validation.extractedInfo,
            qualityCheck: qualityCheck.isValid ? 'passed' : 'warning',
        })
    } catch (error) {
        console.error('Error analyzing CV:', error)

        return NextResponse.json(
            {
                error: 'Failed to analyze CV',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
})
