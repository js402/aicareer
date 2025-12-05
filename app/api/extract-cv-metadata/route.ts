import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { storeCVMetadata, getCachedCVMetadata } from '@/lib/cv-metadata'
import { hashCV } from '@/lib/cv-cache'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface ValidationResult {
    status: 'valid' | 'incomplete' | 'invalid'
    missingInfoQuestions?: string[]
    rejectionReason?: string
    extractedInfo?: {
        name: string
        contactInfo: string
        experience: Array<{role: string, company: string, duration: string}>
        skills: string[]
        education: Array<{degree: string, institution: string, year: string}>
    }
    issues?: string[]
}

// Input Validation Prompt (same as analyze-cv)
const INPUT_VALIDATION_PROMPT = `You are a CV structure validator. Your job is to:
1. Determine if the input is a valid CV/Resume or professional profile.
2. If it is NOT a CV (e.g., random text, code, a poem, a recipe), mark it as INVALID.
3. If it IS a CV but has significant gaps (missing name, missing contact info, very sparse experience, missing dates), mark it as INCOMPLETE and generate specific questions to ask the user.
4. If it is a complete and valid CV, mark it as VALID and extract the information.

Return a JSON object with:
{
  "status": "valid" | "incomplete" | "invalid",
  "missingInfoQuestions": string[], // If incomplete, list 3-5 specific questions to gather missing info
  "rejectionReason": string, // If invalid, explain why (e.g., "This appears to be a python script, not a CV")
  "extractedInfo": {
    "name": string,
    "contactInfo": string,
    "experience": Array<{role: string, company: string, duration: string}>,
    "skills": string[],
    "education": Array<{degree: string, institution: string, year: string}>
  }
}

Rules:
- Status "invalid": Use this for completely irrelevant content.
- Status "incomplete": Use this if it looks like a CV but is missing core fields like Name, Contact Info, or has no Experience/Education listed.
- Status "valid": Use this if it has at least Name, Contact Info, and some Experience or Education.
`

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

        // Check for cached metadata first
        const cachedMetadata = await getCachedCVMetadata(supabase, user.id, cvHash)
        if (cachedMetadata) {
            return NextResponse.json({
                extractedInfo: cachedMetadata.extracted_info,
                status: 'cached',
                cachedAt: cachedMetadata.created_at,
                extractionStatus: cachedMetadata.extraction_status,
                confidenceScore: cachedMetadata.confidence_score
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
                        content: `The previous validation had issues. Please try again.`
                    })
                }

                const validationCompletion = await openai.chat.completions.create({
                    model: DEFAULT_MODEL,
                    messages,
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                })

                validation = JSON.parse(validationCompletion.choices[0]?.message?.content || '{}') as ValidationResult

                if (validation?.status) {
                    break // Success!
                }

                validationAttempt++
            } catch (error) {
                validationAttempt++
                if (validationAttempt >= maxValidationAttempts) {
                    throw error
                }
                console.log(`CV validation error (attempt ${validationAttempt}/${maxValidationAttempts}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // Handle Invalid CVs
        if (validation?.status === 'invalid') {
            return NextResponse.json(
                {
                    error: 'Invalid CV format',
                    message: validation.rejectionReason || 'The uploaded file does not appear to be a valid CV.',
                    status: 'invalid'
                },
                { status: 400 }
            )
        }

        // For incomplete CVs, still return the extracted info if available
        if (validation?.status === 'incomplete') {
            // Store partial metadata in database if we have any extracted info
            if (validation.extractedInfo) {
                try {
                    await storeCVMetadata(
                        supabase,
                        user.id,
                        cvHash,
                        validation.extractedInfo,
                        'partial',
                        0.5 // Lower confidence for incomplete data
                    )
                } catch (cacheError) {
                    console.warn('Failed to cache partial metadata:', cacheError)
                }
            }

            return NextResponse.json(
                {
                    message: 'CV is incomplete',
                    questions: validation.missingInfoQuestions || ['Please provide more details about your experience.'],
                    extractedInfo: validation.extractedInfo,
                    status: 'incomplete'
                },
                { status: 200 } // Return 200 so frontend can handle it gracefully
            )
        }

        if (!validation?.extractedInfo) {
            return NextResponse.json(
                {
                    error: 'Failed to extract information',
                    status: 'error'
                },
                { status: 500 }
            )
        }

        // Store metadata in database
        try {
            const extractionStatus = validation.status === 'valid' ? 'completed' : 'partial'
            await storeCVMetadata(
                supabase,
                user.id,
                cvHash,
                validation.extractedInfo,
                extractionStatus,
                0.8 // Default confidence score, could be improved with ML model
            )
        } catch (cacheError) {
            console.warn('Failed to cache metadata:', cacheError)
            // Don't fail the request if caching fails
        }

        // Return successfully extracted metadata
        return NextResponse.json({
            extractedInfo: validation.extractedInfo,
            status: validation.status,
            extractionStatus: validation.status === 'valid' ? 'completed' : 'partial'
        })

    } catch (error) {
        console.error('Error extracting CV metadata:', error)

        return NextResponse.json(
            {
                error: 'Failed to extract CV metadata',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
})
