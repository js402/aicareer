import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { rateLimit } from '@/middleware/rateLimit'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { hashCV } from '@/lib/cv-cache'
import type { ExtractedCVInfo } from '@/lib/api-client'
import { CAREER_GUIDANCE_PROMPT } from '../../../lib/career-prompts'
import { z } from 'zod'

// Inline schema to avoid import-resolution issues
const careerGuidanceSchema = z.object({
    cvContent: z.string().min(10).max(50000).optional(),
    extractedInfo: z.record(z.string(), z.unknown()).optional()
}).refine(
    (data) => data.cvContent || data.extractedInfo,
    { message: 'Either cvContent or extractedInfo must be provided' }
)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const GUIDANCE_MODEL = 'gpt-4o' 

function validateGuidanceStructure(guidance: any): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = []
    if (!guidance.strategicPath) missingFields.push('strategicPath')
    if (!guidance.marketValue) missingFields.push('marketValue')
    if (!guidance.skillGap) missingFields.push('skillGap')
    return { isValid: missingFields.length === 0, missingFields }
}

const coerceExtractedInfo = (value: unknown): ExtractedCVInfo | undefined => {
    if (!value || typeof value !== 'object') return undefined
    return value as ExtractedCVInfo
}

export async function POST(req: NextRequest) {
    try {
        // ... (Standard Auth & Rate Limit checks) ...
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        if (!(await rateLimit(ip, 5, 60 * 1000))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const hasPro = await hasProAccess(supabase, user.id)
        if (!hasPro) return NextResponse.json({ error: 'Pro required' }, { status: 403 })

        const body = await req.json()
        const parsed = careerGuidanceSchema.safeParse(body)
        if (!parsed.success) {
            const msg = parsed.error.issues.map(i => `${i.path.join('.') || 'root'}: ${i.message}`).join(', ')
            console.warn('Career guidance validation failed:', msg, 'payload keys:', Object.keys(body || {}))
            return NextResponse.json(
                { error: 'Validation failed', details: msg },
                { status: 400 }
            )
        }

        const { cvContent, extractedInfo: rawExtracted } = parsed.data
        const extractedInfo = coerceExtractedInfo(rawExtracted)

        // --- THE FIX PART 2: Preparing the FULL Context ---
        let contextData: any
        let cvHash: string

        if (extractedInfo) {
            // WE USE THIS. The full, rich JSON object with all bullets/metrics.
            contextData = extractedInfo 
            cvHash = await hashCV(JSON.stringify(extractedInfo))
        } else if (cvContent) {
            contextData = cvContent
            cvHash = await hashCV(cvContent)
        } else {
            return NextResponse.json({ error: 'No CV data provided' }, { status: 400 })
        }

        // ... (Cache check) ...
        const { data: cachedGuidance } = await supabase
            .from('career_guidance')
            .select('*')
            .eq('user_id', user.id)
            .eq('cv_hash', cvHash)
            .single()

        if (cachedGuidance) return NextResponse.json({ guidance: cachedGuidance.guidance, fromCache: true })

        // --- THE FIX PART 3: Injecting the FULL Context into the Prompt ---
        const guidanceMessages: ChatCompletionMessageParam[] = [
            { role: 'system', content: CAREER_GUIDANCE_PROMPT },
            {
                role: 'user',
                // HERE IS THE FIX. We inject 'contextData' (the massive JSON), 
                // NOT the tiny 'careerInfo' summary we deleted.
                content: `ANALYZE THIS CANDIDATE PROFILE AND PROVIDE STRATEGIC GUIDANCE:

${typeof contextData === 'string' ? contextData : JSON.stringify(contextData, null, 2)}`
            }
        ]

        const guidanceCompletion = await openai.chat.completions.create({
            model: GUIDANCE_MODEL,
            messages: guidanceMessages,
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const guidance = JSON.parse(guidanceCompletion.choices[0].message.content || '{}')

        if (!guidance || Object.keys(guidance).length === 0) throw new Error('Failed to generate guidance')

        // Save to DB
        await supabase.from('career_guidance').insert({ user_id: user.id, cv_hash: cvHash, guidance })

        return NextResponse.json({
            guidance,
            // We construct a UI summary from the FULL data, not a partial extraction
            profileSummary: {
                currentRole: extractedInfo?.experience?.[0]?.role || "Unknown",
                yearsOfExperience: extractedInfo?.yearsOfExperience || 0,
                skillCount: extractedInfo?.skills?.length || 0
            },
            validationStatus: 'passed'
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}