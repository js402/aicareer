import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has pro access
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

        // Generate career guidance using OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert career advisor for tech professionals. Analyze the provided CV and generate comprehensive career guidance in JSON format with three sections:

1. strategicPath: A 3-5 year career roadmap with specific role progressions, industry insights, and strategic recommendations
2. marketValue: Salary range estimation, market positioning analysis, and negotiation tips
3. skillGap: Prioritized list of skills to develop, with learning resources and timeline

Be specific, actionable, and data-driven. Format your response as valid JSON.`
                },
                {
                    role: 'user',
                    content: `Analyze this CV and provide career guidance:\n\n${cvContent}`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const guidance = JSON.parse(completion.choices[0].message.content || '{}')

        // Store in database for caching
        await supabase
            .from('career_guidance')
            .upsert({
                user_id: user.id,
                cv_hash: hashCV(cvContent),
                guidance,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,cv_hash'
            })

        return NextResponse.json({ guidance })
    } catch (error) {
        console.error('Error generating career guidance:', error)
        return NextResponse.json(
            { error: 'Failed to generate career guidance' },
            { status: 500 }
        )
    }
}

// Simple hash function for CV content
function hashCV(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(36)
}
