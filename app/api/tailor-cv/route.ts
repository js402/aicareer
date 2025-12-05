import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { cleanMarkdown } from '@/lib/markdown'

export const POST = withProAccess(async (request: NextRequest) => {
    try {
        const { cvContent, jobDescription, matchAnalysis } = await request.json()

        if (!cvContent || !jobDescription) {
            return NextResponse.json(
                { error: 'Missing CV content or job description' },
                { status: 400 }
            )
        }

        // --------------------------------------------------------
        // STEP 1 — Tailored CV Generation
        // --------------------------------------------------------
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are an elite CV writer who tailors CVs to match ANY job description provided in the input.

Your job is to:
1. Identify the target role, required skills, seniority level, and key themes FROM the provided jobDescription.
2. Rewrite the CV so it aligns with that role — truthfully and without fabricating details.
3. Use matchAnalysis to understand:
   - Matching skills to highlight
   - Missing skills to address through truthful adjacent experience
   - Recommendations to incorporate if factually allowed

=========================
STRICT FACTUAL RULES
=========================
1. DO NOT invent skills, tech stacks, tools, roles, or accomplishments.
2. DO NOT invent programming languages or software engineering experience if not present.
3. DO NOT add placeholders like [Year], [University], [Degree].
4. You MAY rephrase, restructure, and emphasize existing factual experience.
5. You MUST ground everything in the cvContent.

=========================
WHAT YOU MUST PRODUCE
=========================
1. A tailored **Professional Summary** that directly positions the candidate as relevant to the target role — using ONLY what is real.
2. Rewritten Experience, Skills, and Education sections.
3. Emphasis on transferable technical skills that relate to the target role.
4. Clean Markdown output ONLY — no commentary, no explanations.

Your output is ONLY the rewritten CV in Markdown.
`
                },
                {
                    role: "user",
                    content: `
CV Content:
${cvContent}

Job Description:
${jobDescription}

Match Analysis:
${JSON.stringify(matchAnalysis, null, 2)}
`
                }
            ],
            temperature: 0.7,
        })

        let initialTailoredCV = completion.choices[0].message.content

        if (!initialTailoredCV) {
            throw new Error('OpenAI returned empty content')
        }

        // --------------------------------------------------------
        // STEP 2 — QA Final Polish
        // --------------------------------------------------------
        const finalPolish = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are a strict CV Quality Assurance Editor.

Your job:
1. Ensure the rewritten CV is 100% factual according to cvContent.
2. Remove ANY placeholders (e.g., [Year], [Company], [Degree]).
3. Ensure no invented languages, frameworks, or tech appear.
4. Ensure the Professional Summary exists and aligns with the target role.
5. Ensure the tone is concise, professional, and targeted.
6. Output **only** the final clean Markdown CV — no explanation.

You must use:
- Original CV for fact-checking
- Draft tailored CV for rewriting
- Job description only for context (NOT for adding new facts)
`
                },
                {
                    role: "user",
                    content: `
Original CV:
${cvContent}

Job Description:
${jobDescription}

Draft Tailored CV:
${initialTailoredCV}
`
                }
            ],
            temperature: 0.3,
        })

        let tailoredCV = finalPolish.choices[0].message.content

        if (!tailoredCV) {
            throw new Error('OpenAI QA returned empty content')
        }

        tailoredCV = cleanMarkdown(tailoredCV)

        return NextResponse.json({ tailoredCV })

    } catch (error) {
        console.error('Tailor CV error:', error)
        return NextResponse.json(
            { error: 'Failed to tailor CV' },
            { status: 500 }
        )
    }
})
