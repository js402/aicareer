import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withAuth } from '@/lib/api-middleware'

export const POST = withAuth(async (request, { user }) => {
    try {
        const { jobDescription, cvContent, mode, companyName, positionTitle } = await request.json()

        if (!jobDescription || !mode) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const systemPrompt = `You are a professional career coach helper. 
        Your task is to write a brief, direct, and professional application email body for a job.
        
        CONTEXT:
        - Mode: ${mode === 'freelancer' ? 'Freelance Proposal' : 'Full-time Employment Application'}
        - Company: ${companyName || 'the hiring company'}
        - Position: ${positionTitle || 'the open position'}
        
        INSTRUCTIONS:
        1. Keep it BRIEF. Max 2-3 short paragraphs. No fluff.
        2. Tone: Professional, confident, but respectful.
        3. Structure:
           - Greeting (Dear Hiring Manager or similar)
           - Opening: Clearly state purpose (Applying for...)
           - Value Prop: 1-2 sentences on why I'm a fit (referencing skills from context if possible).
           - Call to Action: "Attached is my CV/Proposal. I'd love to discuss..."
           - Sign-off.
        
        ${mode === 'freelancer'
                ? 'For FREELANCER mode: Focus on availability, delivering value/results immediately, and potentially mention specific technical strengths.'
                : 'For EMPLOYEE mode: Focus on long-term interest, cultural fit, and relevant experience.'}
        
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
