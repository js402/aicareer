import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL, CV_ANALYSIS_SYSTEM_PROMPT } from '@/lib/openai'
import { hashCV, getCachedAnalysis, storeAnalysis } from '@/lib/cv-cache'

export async function POST(request: NextRequest) {
    try {
        const { cvContent, prompt, userId } = await request.json()

        if (!cvContent) {
            return NextResponse.json(
                { error: 'CV content is required' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 401 }
            )
        }

        // Generate hash of CV content
        const cvHash = await hashCV(cvContent)

        // Check for cached analysis
        const cachedResult = await getCachedAnalysis(userId, cvHash)

        if (cachedResult) {
            // Cache hit - return cached analysis
            return NextResponse.json({
                analysis: cachedResult.analysis,
                fromCache: true,
                cachedAt: cachedResult.created_at,
                filename: cachedResult.filename,
            })
        }

        // Cache miss - perform new analysis
        // Use custom prompt or default CV analysis prompt
        const userPrompt = prompt || `Please analyze the following CV and provide detailed career guidance:\n\n${cvContent}`

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: CV_ANALYSIS_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        })

        const analysis = completion.choices[0]?.message?.content

        if (!analysis) {
            return NextResponse.json(
                { error: 'No analysis generated' },
                { status: 500 }
            )
        }

        // Store analysis in cache (non-blocking)
        try {
            const filename = `CV-${new Date().toISOString().split('T')[0]}`
            await storeAnalysis(userId, cvHash, cvContent, filename, analysis)
        } catch (cacheError) {
            console.warn('Failed to cache analysis:', cacheError)
            // Continue without caching - don't fail the request
        }

        return NextResponse.json({
            analysis,
            fromCache: false,
            usage: completion.usage,
            model: completion.model,
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
}
