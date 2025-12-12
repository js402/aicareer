import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { validateInput, tailorCVSchema } from '@/lib/validation'
import { cleanMarkdown } from '@/lib/markdown'
import { getTailoringPromptFragment, SENIORITY_LEVELS } from '@/lib/resume-guidelines'

/**
 * Format CV metadata into readable CV format for tailoring
 */
function formatCVMetadataForTailoring(extractedInfo: any): string {
    const sections: string[] = []

    // Name
    if (extractedInfo.name) {
        sections.push(`Name: ${extractedInfo.name}`)
    }

    // Summary
    if (extractedInfo.summary) {
        sections.push(`Professional Summary: ${extractedInfo.summary}`)
    }

    // Contact Info
    const contact = extractedInfo.contactInfo || {}
    const contactParts: string[] = []
    if (contact.email) contactParts.push(`Email: ${contact.email}`)
    if (contact.phone) contactParts.push(`Phone: ${contact.phone}`)
    if (contact.location) contactParts.push(`Location: ${contact.location}`)
    if (contact.linkedin) contactParts.push(`LinkedIn: ${contact.linkedin}`)
    if (contact.website || contact.portfolio) contactParts.push(`Website: ${contact.website || contact.portfolio}`)

    if (contactParts.length > 0) {
        sections.push(`Contact Information:\n${contactParts.join('\n')}`)
    }

    // Skills
    const allSkills = [
        ...(extractedInfo.skills || []),
        ...(extractedInfo.inferredSkills || [])
    ]
    if (allSkills.length > 0) {
        sections.push(`Skills: ${allSkills.join(', ')}`)
    }

    // Experience
    if (extractedInfo.experience && extractedInfo.experience.length > 0) {
        const experienceText = extractedInfo.experience
            .map((exp: any) => {
                const title = exp.title || exp.role || 'Position'
                const company = exp.company || 'Company'
                const duration = exp.duration || exp.dates || ''
                const bullets = exp.bullets || exp.responsibilities || []
                return `${title} at ${company} (${duration})` +
                    (bullets.length > 0 ? `\n  • ${bullets.join('\n  • ')}` : '')
            })
            .join('\n\n')
        sections.push(`Professional Experience:\n${experienceText}`)
    }

    // Education
    if (extractedInfo.education && extractedInfo.education.length > 0) {
        const educationText = extractedInfo.education
            .map((edu: any) => {
                const degree = edu.degree || edu.qualification || 'Degree'
                const institution = edu.institution || edu.school || 'Institution'
                const year = edu.year || edu.graduationYear || ''
                return `${degree} from ${institution}${year ? ` (${year})` : ''}`
            })
            .join('\n')
        sections.push(`Education:\n${educationText}`)
    }

    // Leadership (if present)
    if (extractedInfo.leadership && extractedInfo.leadership.length > 0) {
        const leadershipText = extractedInfo.leadership
            .map((item: any) => `${item.role}: ${item.description}`)
            .join('\n')
        sections.push(`Leadership & Impact:\n${leadershipText}`)
    }

    // Projects (if present)
    if (extractedInfo.projects && extractedInfo.projects.length > 0) {
        const projectsText = extractedInfo.projects
            .map((proj: any) => `${proj.name || proj.title}: ${proj.description || ''}`)
            .join('\n')
        sections.push(`Projects:\n${projectsText}`)
    }

    // Certifications (if present)
    if (extractedInfo.certifications && extractedInfo.certifications.length > 0) {
        sections.push(`Certifications: ${extractedInfo.certifications.join(', ')}`)
    }

    return sections.join('\n\n')
}

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
