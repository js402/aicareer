import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { rateLimit } from '@/middleware/rateLimit'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { hashCV } from '@/lib/cv-cache'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

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
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
            }
        }
    }

    throw lastError || new Error(`${stepName} failed after ${maxRetries + 1} attempts`)
}

// Step 1: Extract Career Information
const CAREER_EXTRACTION_PROMPT = `You are a career information extractor. Analyze the CV and extract key career information.

Return JSON:
{
  "currentRole": string,
  "yearsOfExperience": number,
  "primarySkills": string[],
  "industries": string[],
  "careerGoals": string, // Infer from CV progression
  "educationLevel": string
}`

// Step 2: Generate Structured Career Guidance
const CAREER_GUIDANCE_PROMPT = `You are an expert career advisor. Based on the extracted career information, provide comprehensive career guidance.

Return JSON with this EXACT structure:
{
  "strategicPath": {
    "currentPosition": string, // Assessment of current position
    "shortTerm": string[], // 3-5 specific goals for 1-2 years
    "midTerm": string[], // 3-5 specific goals for 3-5 years
    "longTerm": string[] // 3-5 specific goals for 5+ years
  },
  "marketValue": {
    "salaryRange": {
      "min": number,
      "max": number,
      "currency": "USD" | "EUR" | "GBP"
    },
    "marketDemand": string, // Current market demand analysis
    "competitiveAdvantages": string[], // 3-5 key advantages
    "negotiationTips": string[] // 3-5 specific tips
  },
  "skillGap": {
    "critical": [
      {
        "skill": string,
        "priority": "high" | "medium" | "low",
        "timeframe": string, // e.g., "3-6 months"
        "resources": string[] // 2-3 specific learning resources
      }
    ],
    "recommended": [
      {
        "skill": string,
        "priority": "high" | "medium" | "low",
        "timeframe": string,
        "resources": string[]
      }
    ]
  }
}

Be specific with numbers, timelines, and resources. Provide actionable, data-driven guidance.`

// Step 3: Validate Output Structure
const OUTPUT_VALIDATION_PROMPT = `Validate that the career guidance JSON has all required fields and proper structure.

Return JSON:
{
  "isValid": boolean,
  "missingFields": string[],
  "structureIssues": string[]
}`

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip, 5, 60 * 1000)) { // 5 requests per minute
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            )
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const hasPro = await hasProAccess(supabase, user.id)
        if (!hasPro) {
            return NextResponse.json(
                { error: 'Pro subscription required for career guidance' },
                { status: 403 }
            )
        }

        const { cvContent } = await req.json()

        if (!cvContent) {
            return NextResponse.json(
                { error: 'CV content is required' },
                { status: 400 }
            )
        }

        // Check cache first
        const cvHash = await hashCV(cvContent)
        const { data: cachedGuidance } = await supabase
            .from('career_guidance')
            .select('*')
            .eq('user_id', user.id)
            .eq('cv_hash', cvHash)
            .single()

        if (cachedGuidance) {
            return NextResponse.json({
                guidance: cachedGuidance.guidance,
                fromCache: true,
                cachedAt: cachedGuidance.created_at
            })
        }

        // STEP 1: Extract career information (with smart retry)
        let careerInfo: Record<string, unknown> | undefined
        let extractionAttempt = 0
        const maxExtractionAttempts = 2

        while (extractionAttempt < maxExtractionAttempts) {
            try {
                const messages: ChatCompletionMessageParam[] = [
                    { role: 'system', content: CAREER_EXTRACTION_PROMPT },
                    {
                        role: 'user', content: `Extract career information from this CV:

${cvContent}`
                    }
                ]

                const extractionCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages,
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                })

                careerInfo = JSON.parse(extractionCompletion.choices[0].message.content || '{}')
                if (careerInfo && Object.keys(careerInfo).length > 0) {
                    break // Success!
                }

                extractionAttempt++
                if (extractionAttempt < maxExtractionAttempts) {
                    console.log(`Career extraction failed (attempt ${extractionAttempt}/${maxExtractionAttempts}), retrying...`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (error) {
                extractionAttempt++
                if (extractionAttempt >= maxExtractionAttempts) {
                    throw error
                }
                console.log(`Career extraction error (attempt ${extractionAttempt}/${maxExtractionAttempts}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // STEP 2: Generate structured guidance (with smart retry)
        let guidance: Record<string, unknown> | undefined
        let guidanceAttempt = 0
        const maxGuidanceAttempts = 2

        while (guidanceAttempt < maxGuidanceAttempts) {
            try {
                const messages: ChatCompletionMessageParam[] = [
                    { role: 'system', content: CAREER_GUIDANCE_PROMPT },
                    {
                        role: 'user',
                        content: `Generate career guidance for:
${JSON.stringify(careerInfo, null, 2)}`
                    }
                ]

                const guidanceCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages,
                    response_format: { type: 'json_object' },
                    temperature: 0.7,
                })

                guidance = JSON.parse(guidanceCompletion.choices[0].message.content || '{}')
                if (guidance && Object.keys(guidance).length > 0) {
                    break // Success!
                }

                guidanceAttempt++
                if (guidanceAttempt < maxGuidanceAttempts) {
                    console.log(`Guidance generation failed (attempt ${guidanceAttempt}/${maxGuidanceAttempts}), retrying...`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (error) {
                guidanceAttempt++
                if (guidanceAttempt >= maxGuidanceAttempts) {
                    throw error
                }
                console.log(`Guidance generation error (attempt ${guidanceAttempt}/${maxGuidanceAttempts}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // STEP 3: Validate output structure (with retry)
        const validation = await retryWithBackoff(async () => {
            const validationCompletion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: OUTPUT_VALIDATION_PROMPT },
                    {
                        role: 'user', content: `Validate this guidance:
${JSON.stringify(guidance, null, 2)}`
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            })
            return JSON.parse(validationCompletion.choices[0].message.content || '{}')
        }, 1, 'Guidance Validation')

        if (!validation.isValid) {
            console.warn('Guidance validation issues:', validation)
            // Still return the guidance but log the issues
        }

        // Store in database for caching
        await supabase
            .from('career_guidance')
            .insert({
                user_id: user.id,
                cv_hash: cvHash,
                guidance,
            })

        return NextResponse.json({
            guidance,
            careerInfo,
            validationStatus: validation.isValid ? 'passed' : 'warning'
        })
    } catch (error) {
        console.error('Error generating career guidance:', error)
        return NextResponse.json(
            { error: 'Failed to generate career guidance' },
            { status: 500 }
        )
    }
}


