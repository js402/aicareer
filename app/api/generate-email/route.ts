import { NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withAuth } from '@/lib/api-middleware'
import type { ExtractedCVInfo } from '@/lib/api-client'

export const POST = withAuth(async (request, { user, supabase }) => {
    try {
        const { jobDescription, cvMetadataId, mode, companyName, positionTitle, tone, length, focus } = await request.json()

        if (!jobDescription || !mode || !cvMetadataId) {
            return NextResponse.json(
                { error: 'Missing required fields: jobDescription, mode, and cvMetadataId are required' },
                { status: 400 }
            )
        }

        // Fetch CV metadata from database
        const { data: cvMetadata, error: cvError } = await supabase
            .from('cv_metadata')
            .select('extracted_info')
            .eq('id', cvMetadataId)
            .eq('user_id', user.id)
            .single()

        if (cvError || !cvMetadata) {
            return NextResponse.json(
                { error: 'CV not found. The specified CV does not exist or does not belong to you.' },
                { status: 404 }
            )
        }

        const extractedInfo: ExtractedCVInfo = cvMetadata.extracted_info

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

        // Build a concise CV summary from extracted info
        const cvSummary = [
            extractedInfo.name ? `Name: ${extractedInfo.name}` : '',
            extractedInfo.summary ? `Summary: ${extractedInfo.summary}` : '',
            extractedInfo.skills?.length ? `Key Skills: ${extractedInfo.skills.slice(0, 10).join(', ')}` : '',
            extractedInfo.experience?.length ? `Recent Experience: ${extractedInfo.experience.slice(0, 2).map(e => `${e.role} at ${e.company}`).join('; ')}` : '',
            extractedInfo.yearsOfExperience ? `Years of Experience: ${extractedInfo.yearsOfExperience}` : '',
            extractedInfo.seniorityLevel ? `Seniority Level: ${extractedInfo.seniorityLevel}` : '',
        ].filter(Boolean).join('\n')

        const userPrompt = `
        Job Description:
        ${jobDescription.slice(0, 1500)}

        My CV Summary:
        ${cvSummary}
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
