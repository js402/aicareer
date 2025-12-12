import { NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { hashCV, getCachedAnalysis, storeAnalysis } from '@/lib/cv-cache'
import { withAuth } from '@/lib/api-middleware'
import { validateInput, analyzeCVSchema } from '@/lib/validation'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { getAnalysisPromptFragment, getExtractionPromptFragment } from '@/lib/resume-guidelines'

// Helper to convert extractedInfo to a text format for analysis
import { formatExtractedInfoForAnalysis } from '@/lib/cv-service'



// Combined Validation and Analysis Prompt
const CV_ANALYSIS_PROMPT = `You are an expert CV/Resume parser and career advisor. Your job is to:
1. Validate if the input is a valid CV/Resume (not random text, code, poetry, etc.)
2. Check for completeness (must have name, contact info, and experience OR education)
3. Extract key information
4. Provide a comprehensive analysis

${getExtractionPromptFragment()}
${getAnalysisPromptFragment()}

Language & Output:
- If the CV is not in English, translate extracted info and the analysis to clear, professional English.
- Preserve proper nouns and terms where translation is not appropriate (company names, product names, certifications, course titles, tool/library names).
- Normalize role titles to common English equivalents when safe.
- Do not translate email addresses, URLs, or raw contact lines.

Light Uplift (non-invasive):
- Use active voice and specific language in extracted text (summary, experience descriptions, highlights) while keeping facts intact.
- Correct minor spelling/grammar; avoid slang and personal pronouns.
- Make content easy to scan; do not heavily rewrite or restructure.

Conservative Inference (when highly supported):
- If the CV strongly implies leadership scope (leading initiatives, stakeholders, mentoring, owning delivery), reflect that in the analysis.
- Do not fabricate facts, metrics, titles, or dates.
- If you infer something, ensure it is backed by explicit evidence in the CV text.

Return a JSON object with:
{
  "status": "valid" | "incomplete" | "invalid",
  "rejectionReason": string,
  "extractedInfo": {
    "name": string,
    "contactInfo": string,
    "summary": string,
    "experience": Array<{role: string, company: string, duration: string, description?: string}>,
    "skills": string[],
    "inferredSkills": string[],
    "education": Array<{degree: string, institution: string, year: string}>,
    "seniorityLevel": "entry" | "junior" | "mid" | "senior" | "lead" | "principal" | "director" | "executive",
    "yearsOfExperience": number
  },
  "analysis": "markdown formatted analysis including: Executive Summary, Strengths (4-6 with examples), Format & Structure Assessment, Language & Impact Analysis (with 3-5 bullet rewrites), Areas for Improvement, Career Trajectory Analysis, Market Positioning, and Recommendations. Use proper markdown with ##headers, bullets, **bold**, and >quotes. 500-1500 words."
}

Validation Rules:
- Status "invalid": Completely irrelevant content
- Status "incomplete": Missing Name, Contact Info, or has neither Experience nor Education
- Status "valid": Has Name, some Contact Info, and (Experience OR Education)

Analysis Requirements (only for valid CVs):
- Be specific with examples from their CV
- Include 3-5 BEFORE/AFTER bullet point examples
- For senior+ roles, assess strategic impact and leadership scope
- Provide actionable, prioritized recommendations`

interface ValidationResult {
    status: 'valid' | 'incomplete' | 'invalid'
    missingInfoQuestions?: string[]
    rejectionReason?: string
    extractedInfo?: Record<string, unknown>
    analysis?: string
    issues?: string[]
}

export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const body = await request.json()

        // Validate input using Zod schema
        const inputValidation = validateInput(analyzeCVSchema, body)
        if (!inputValidation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: inputValidation.error },
                { status: 400 }
            )
        }

        const { cvContent, extractedInfo } = inputValidation.data

        // Determine content for analysis - prefer cvContent, fall back to extractedInfo
        const hasRawContent = cvContent && !cvContent.match(/^\[CV content for .+\]$/)

        let contentForAnalysis: string
        let cvHash: string

        if (hasRawContent) {
            contentForAnalysis = cvContent!
            cvHash = await hashCV(cvContent!)
        } else if (extractedInfo) {
            // Convert extractedInfo to a structured text format for analysis
            contentForAnalysis = formatExtractedInfoForAnalysis(extractedInfo)
            cvHash = await hashCV(contentForAnalysis)
        } else {
            return NextResponse.json(
                { error: 'No CV content or extracted info provided' },
                { status: 400 }
            )
        }

        const cachedResult = await getCachedAnalysis(supabase, user.id, cvHash)

        if (cachedResult) {
            return NextResponse.json({
                analysis: cachedResult.analysis,
                fromCache: true,
                cachedAt: cachedResult.created_at,
                filename: cachedResult.filename,
                status: 'valid'
            })
        }

        // STEP 1: Validate, extract, and generate analysis in a single call
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: CV_ANALYSIS_PROMPT },
            { role: 'user', content: `Validate and analyze this CV:\n\n${contentForAnalysis}` }
        ]

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.5,
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}') as ValidationResult & { analysis?: string }

        // Handle Invalid or Incomplete CVs
        if (result?.status === 'invalid') {
            return NextResponse.json(
                {
                    error: 'Invalid CV format',
                    message: result.rejectionReason || 'The uploaded file does not appear to be a valid CV.',
                    status: 'invalid'
                },
                { status: 400 }
            )
        }

        if (result?.status === 'incomplete') {
            return NextResponse.json(
                {
                    message: 'CV is incomplete',
                    status: 'incomplete'
                },
                { status: 200 }
            )
        }

        if (!result?.extractedInfo || !result?.analysis) {
            return NextResponse.json(
                {
                    error: 'Failed to extract information or generate analysis',
                    status: 'error'
                },
                { status: 500 }
            )
        }

        // Store analysis in cache
        try {
            const filename = `CV-${new Date().toISOString().split('T')[0]}`
            await storeAnalysis(supabase, user.id, cvHash, contentForAnalysis, filename, result.analysis)
        } catch (cacheError) {
            console.warn('Failed to cache analysis:', cacheError)
        }

        return NextResponse.json({
            analysis: result.analysis,
            fromCache: false,
            extractedInfo: result.extractedInfo,
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
