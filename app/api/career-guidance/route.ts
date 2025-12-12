import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { rateLimit } from '@/middleware/rateLimit'
import { validateInput, careerGuidanceSchema } from '@/lib/validation'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { hashCV } from '@/lib/cv-cache'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})


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

// Step 3: Validate Output Structure (without LLM)
function validateGuidanceStructure(guidance: any): { isValid: boolean; missingFields: string[]; structureIssues: string[] } {
    const missingFields: string[] = []
    const structureIssues: string[] = []

    // Check strategicPath
    if (!guidance.strategicPath) {
        missingFields.push('strategicPath')
    } else {
        if (!guidance.strategicPath.currentPosition) missingFields.push('strategicPath.currentPosition')
        if (!Array.isArray(guidance.strategicPath.shortTerm)) missingFields.push('strategicPath.shortTerm')
        if (!Array.isArray(guidance.strategicPath.midTerm)) missingFields.push('strategicPath.midTerm')
        if (!Array.isArray(guidance.strategicPath.longTerm)) missingFields.push('strategicPath.longTerm')
    }

    // Check marketValue
    if (!guidance.marketValue) {
        missingFields.push('marketValue')
    } else {
        if (!guidance.marketValue.salaryRange) {
            missingFields.push('marketValue.salaryRange')
        } else {
            if (typeof guidance.marketValue.salaryRange.min !== 'number') missingFields.push('marketValue.salaryRange.min')
            if (typeof guidance.marketValue.salaryRange.max !== 'number') missingFields.push('marketValue.salaryRange.max')
            if (!guidance.marketValue.salaryRange.currency) missingFields.push('marketValue.salaryRange.currency')
        }
        if (!guidance.marketValue.marketDemand) missingFields.push('marketValue.marketDemand')
        if (!Array.isArray(guidance.marketValue.competitiveAdvantages)) missingFields.push('marketValue.competitiveAdvantages')
        if (!Array.isArray(guidance.marketValue.negotiationTips)) missingFields.push('marketValue.negotiationTips')
    }

    // Check skillGap
    if (!guidance.skillGap) {
        missingFields.push('skillGap')
    } else {
        if (!Array.isArray(guidance.skillGap.critical)) {
            missingFields.push('skillGap.critical')
        } else {
            guidance.skillGap.critical.forEach((item: any, i: number) => {
                if (!item.skill) structureIssues.push(`skillGap.critical[${i}] missing skill`)
                if (!item.priority) structureIssues.push(`skillGap.critical[${i}] missing priority`)
            })
        }
        if (!Array.isArray(guidance.skillGap.recommended)) {
            missingFields.push('skillGap.recommended')
        }
    }

    return {
        isValid: missingFields.length === 0 && structureIssues.length === 0,
        missingFields,
        structureIssues
    }
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        if (!(await rateLimit(ip, 5, 60 * 1000))) { // 5 requests per minute
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

        const body = await req.json()

        // Validate input using Zod schema
        const inputValidation = validateInput(careerGuidanceSchema, body)
        if (!inputValidation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: inputValidation.error },
                { status: 400 }
            )
        }

        const { cvContent } = inputValidation.data

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

        // STEP 1: Extract career information
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

        const careerInfo = JSON.parse(extractionCompletion.choices[0].message.content || '{}')

        if (!careerInfo || Object.keys(careerInfo).length === 0) {
            throw new Error('Failed to extract career information')
        }

        // STEP 2: Generate structured guidance
        const guidanceMessages: ChatCompletionMessageParam[] = [
            { role: 'system', content: CAREER_GUIDANCE_PROMPT },
            {
                role: 'user',
                content: `Generate career guidance for:
${JSON.stringify(careerInfo, null, 2)}`
            }
        ]

        const guidanceCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: guidanceMessages,
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const guidance = JSON.parse(guidanceCompletion.choices[0].message.content || '{}')

        if (!guidance || Object.keys(guidance).length === 0) {
            throw new Error('Failed to generate career guidance')
        }

        // STEP 3: Validate output structure (no LLM call needed)
        const validation = validateGuidanceStructure(guidance)

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


