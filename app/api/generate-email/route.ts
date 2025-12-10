import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withAuth } from '@/lib/api-middleware'

export const POST = withAuth(async (request, { user }) => {
    try {
        const { jobDescription, cvContent, mode, companyName, positionTitle, tone, length, focus } = await request.json()

        if (!jobDescription || !mode) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const systemPrompt = `You are a professional career coach helper. 
        Your task is to write a highly tailored, direct, and professional application email body for a job.
        
        CONTEXT:
        - Mode: ${mode === 'freelancer' ? 'Freelance Proposal' : 'Full-time Employment Application'}
        - Company: ${companyName || 'the hiring company'}
        - Position: ${positionTitle || 'the open position'}
        - Desired Tone: ${tone || 'Professional'}
        - Desired Length: ${length || 'Standard'}
        - Key Focus Area: ${focus ? `EMPHASIZE THIS: "${focus}"` : 'Match skills to requirements automatically'}
        
        INSTRUCTIONS:
        1. Keep it concise even for "Detailed" length. No filler.
        2. Tone adjustments:
           - Professional: Formal, respectful, standard business English.
           - Enthusiastic: Higher energy, use words like "thrilled", "excited", "passion".
           - Confident: Assertive, authoritative (without arrogance).
           - Direct: Get straight to the point, minimal pleasantries.
        
        3. Length adjustments:
           - Short: ~50-80 words. Intro, one punchy value prop sentence, call to action.
           - Standard: ~100-150 words. Intro, 2-3 sentence value prop linking CV to JD, closing.
           - Detailed: ~200 words. Deeper dive into specific matching experience.
        
        4. Structure (Standard Template):
           - Greeting (Dear Hiring Team or Name if inferred)
           - Opening (Applying for X)
           - The "Hook": Why I am a fit (incorporate the "Key Focus" here if provided).
           - Skills Match: Briefly mention 2-3 top relevant skills from my CV that match the JD.
           - Call to Action ("Attached is my CV...", "Available for interview...")
           - Sign-off.
        
        ${mode === 'freelancer'
                ? 'For FREELANCER mode: Focus on availability, delivering fast results, and project ROI.'
                : 'For EMPLOYEE mode: Focus on long-term contribution, cultural fit, and relevant experience.'}
        
        Do not include placeholders like "[Your Name]" unless absolutely necessary. The user will sign it themselves.
        Return ONLY the email body text.
        `

        const userPrompt = `
        Job Description:
        ${jobDescription.slice(0, 1500)}... (truncated)

        ${cvContent ? `My CV Content Summary:\n${cvContent.slice(0, 1000)}...` : ''}
        `

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        })

        const emailBody = completion.choices[0]?.message?.content || ''

        return NextResponse.json({ emailBody })

    } catch (error) {
        console.error('Error generating email:', error)
        return NextResponse.json(
            { error: 'Failed to generate email' },
            { status: 500 }
        )
    }
})
