import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { validateInput, tailorCVSchema } from '@/lib/validation'
import { cleanMarkdown } from '@/lib/markdown'
import { getTailoringPromptFragment, SENIORITY_LEVELS } from '@/lib/resume-guidelines'
import { formatCVMetadataForTailoring } from '@/lib/cv-formatter'
import { errorResponse, handleOpenAIError, ValidationError } from '@/lib/api-errors'

export const POST = withProAccess(async (request: NextRequest, { supabase, user }) => {
    try {
        const body = await request.json()

        // Validate input using Zod schema
        const validation = validateInput(tailorCVSchema, body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error },
                { status: 400 }
            )
        }

        const { jobDescription, matchAnalysis, cvMetadataId } = validation.data

        // Get user's CV metadata - either specific one or most recent
        let cvMetadataQuery = supabase
            .from('cv_metadata')
            .select('*')
            .eq('user_id', user.id)

        if (cvMetadataId) {
            cvMetadataQuery = cvMetadataQuery.eq('id', cvMetadataId)
        } else {
            cvMetadataQuery = cvMetadataQuery.order('created_at', { ascending: false }).limit(1)
        }

        const { data: cvMetadataList } = await cvMetadataQuery

        const cvMetadata = cvMetadataList?.[0]

        if (!cvMetadata) {
            return NextResponse.json(
                { error: 'No CV found. Please upload a CV first.' },
                { status: 400 }
            )
        }

        // Format CV metadata for tailoring
        const extractedInfo = cvMetadata.extracted_info
        const cvContent = formatCVMetadataForTailoring(extractedInfo)

        // --------------------------------------------------------
        // STEP 1 — Tailored CV Generation
        // --------------------------------------------------------
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are an elite CV writer who creates professional, ATS-optimized resumes that follow best practices from top career centers.

Your job is to:
1. Identify the target role, required skills, seniority level, and key themes FROM the provided jobDescription.
2. Rewrite the CV so it aligns with that role — truthfully and without fabricating details.
3. Use matchAnalysis to understand:
   - Matching skills to highlight
   - Missing skills to address through truthful adjacent experience
   - Recommendations to incorporate if factually allowed

${getTailoringPromptFragment()}

=========================
STRICT FACTUAL RULES
=========================
1. DO NOT invent skills, tech stacks, tools, roles, or accomplishments.
2. DO NOT invent programming languages or software engineering experience if not present.
3. DO NOT add placeholders like [Year], [University], [Degree].
4. You MAY rephrase, restructure, and emphasize existing factual experience.
5. You MUST ground everything in the cvContent.

=========================
FORMAT REQUIREMENTS
=========================
1. Use BULLET POINTS for experience and achievements (not paragraphs)
2. Each bullet MUST start with a strong ACTION VERB (Led, Developed, Implemented, etc.)
3. NEVER use personal pronouns (I, We, My, Our)
4. Follow the formula: [Action Verb] + [What] + [How/With What] + [Quantified Result]
5. Keep bullets concise: 1-2 lines maximum
6. Order sections by relevance to the target role

=========================
WHAT YOU MUST PRODUCE
=========================
1. A tailored **Professional Summary** (2-3 sentences) that directly positions the candidate for the target role
2. **Skills** section with skills grouped logically (Technical, Tools, Languages, etc.)
3. **Experience** section with:
   - Company, Title, Location, Dates
   - 3-5 bullet points per role, each with action verb + context + metric where possible
4. **Education** section
5. **Projects** or **Leadership** sections if relevant to the role

For DIRECTOR/EXECUTIVE level roles, emphasize:
- Scope (team sizes, budgets, geographic reach)
- Strategic impact and business outcomes
- Cross-functional leadership
- Executive stakeholder management

Your output is ONLY the rewritten CV in Markdown — no commentary, no explanations.
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

        const initialTailoredCV = completion.choices[0].message.content

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
You are a strict CV Quality Assurance Editor following Harvard MCS resume guidelines.

Your job:
1. Ensure the rewritten CV is 100% factual according to cvContent.
2. Remove ANY placeholders (e.g., [Year], [Company], [Degree]).
3. Ensure no invented languages, frameworks, or tech appear.
4. Ensure the Professional Summary exists and aligns with the target role.
5. Ensure the tone is concise, professional, and targeted.

QUALITY CHECKS:
- Every bullet point MUST start with a strong action verb (Led, Developed, Built, etc.)
- NO personal pronouns (I, We, My, Our) anywhere
- Bullets follow: Action + Context + Result/Metric pattern
- No passive voice ("was responsible for" → "Managed")
- Consistent formatting (dates, capitalization, punctuation)
- Skills are properly grouped and relevant to target role

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
