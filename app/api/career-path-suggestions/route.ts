import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { rateLimit } from '@/middleware/rateLimit'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SUGGESTIONS_MODEL = 'gpt-4o-mini'

const SUGGESTIONS_PROMPT = `You are an expert career strategist for elite tech talent. 
INPUT DATA: You will receive the candidate's FULL structured profile (JSON).

YOUR MISSION: Suggest 3 distinct career paths based on their specific "Power Signals" (e.g., Founder experience, Niche Compliance skills, High-Scale metrics).

CATEGORIES:
1. "Comfort Zone": A role that perfectly matches their current tech stack and seniority. Low risk, high stability.
2. "Growth": The logical next step (e.g., Senior -> Staff, or Dev -> Architect). Focuses on increasing scope/influence.
3. "Challenging" (The Pivot): A high-reward stretch goal. Look for "Hidden Gems" in their history (e.g., "Founder" experience implies they could be a "Product Manager" or "Head of Engineering").

For EACH path, provide:
- Role Title
- Vertical/Industry (e.g. Fintech, HealthTech, Enterprise SaaS)
- Ideal Company Size
- Ideal Team Size
- Brief Description (Connect specific CV details to why this fits)

Return a valid JSON object with this exact structure:
{
  "comfort": { "role": string, "vertical": string, "companySize": string, "teamSize": string, "description": string },
  "growth": { "role": string, "vertical": string, "companySize": string, "teamSize": string, "description": string },
  "challenging": { "role": string, "vertical": string, "companySize": string, "teamSize": string, "description": string }
}
`

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        if (!(await rateLimit(ip, 5, 60 * 1000))) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const hasPro = await hasProAccess(supabase, user.id)
        if (!hasPro) return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })

        const body = await req.json()
        const { extractedInfo } = body // STRICT: Only accept extractedInfo

        // --- STRICT DATA CHECK ---
        // We reject raw text. Strategies MUST be built on the "Mega CV" Blueprint.
        if (!extractedInfo) {
            return NextResponse.json(
                { error: 'Structured CV data (extractedInfo) is required. Please parse the CV first.' }, 
                { status: 400 }
            )
        }

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: SUGGESTIONS_PROMPT },
            {
                role: 'user',
                // Direct Injection of the Blueprint JSON
                content: `Based on this CV, provide 3 strategic career path suggestions:

${JSON.stringify(extractedInfo, null, 2)}` 
            }
        ]

        const completion = await openai.chat.completions.create({
            model: SUGGESTIONS_MODEL,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const suggestions = JSON.parse(completion.choices[0].message.content || '{}')

        if (!suggestions || !suggestions.comfort || !suggestions.growth) {
            throw new Error('Invalid response format from AI')
        }

        return NextResponse.json({ suggestions })

    } catch (error) {
        console.error('Error generating career suggestions:', error)
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }
}