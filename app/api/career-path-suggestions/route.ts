import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { rateLimit } from '@/middleware/rateLimit'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SUGGESTIONS_PROMPT = `You are an expert career strategist. Analyze the user's CV and suggest 3 distinct career paths/roles they should look out for.

The 3 paths should be categorized as:
1. "Comfort Zone": A role that perfectly matches their current skills and seniority. Low risk, high stability. Ideally a lateral move or slight optimization.
2. "Growth": The logical next step in their career. Moderate challenge, focuses on professional development and seniority increase.
3. "Challenging": A stretch goal or high-growth opportunity. Could be a pivot to a new domain, a significant jump in seniority, or a role in a very demanding environment.

For EACH path, provide:
- Role Title
- Vertical/Industry (e.g. Fintech, HealthTech, Enterprise SaaS)
- Ideal Company Size (e.g. Early-stage Startup, Scale-up, Enterprise)
- Ideal Team Size
- Brief Description (Why this is a good fit and what to expect)

Return a valid JSON object with this exact structure:
{
  "comfort": {
    "role": string,
    "vertical": string,
    "companySize": string,
    "teamSize": string,
    "description": string
  },
  "growth": {
    "role": string,
    "vertical": string,
    "companySize": string,
    "teamSize": string,
    "description": string
  },
  "challenging": {
    "role": string,
    "vertical": string,
    "companySize": string,
    "teamSize": string,
    "description": string
  }
}
`

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        if (!(await rateLimit(ip, 5, 60 * 1000))) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            )
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const hasPro = await hasProAccess(supabase, user.id)
        if (!hasPro) {
            return NextResponse.json(
                { error: 'Pro subscription required' },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { cvContent } = body

        if (!cvContent) {
            return NextResponse.json({ error: 'CV content is required' }, { status: 400 })
        }

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: SUGGESTIONS_PROMPT },
            {
                role: 'user',
                content: `Based on this CV, provide the career path suggestions:\n\n${cvContent.substring(0, 15000)}` // Truncate to avoid token limits if CV is huge
            }
        ]

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
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
        return NextResponse.json(
            { error: 'Failed to generate suggestions' },
            { status: 500 }
        )
    }
}
