import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { validateInput, tailorCVSchema } from '@/lib/validation'
import { cleanMarkdown } from '@/lib/markdown'
import {
    getTailoringPromptFragment,
    SENIORITY_LEVELS,
    BULLET_FORMULA,
    DIRECTOR_LEVEL_GUIDANCE,
    ACTION_VERBS,
    RESUME_LANGUAGE_RULES
} from '@/lib/resume-guidelines'
import { formatCVMetadataForTailoring, ExtractedCVInfo } from '@/lib/cv-formatter'
import { errorResponse, handleOpenAIError, ValidationError } from '@/lib/api-errors'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// ============================================================
// STRUCTURED OUTPUT SCHEMA (matches ExtractedCVInfo)
// ============================================================

const TAILORED_CV_OUTPUT_SCHEMA = `{
  "name": string,
  "contactInfo": {
    "email": string | null,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "github": string | null,
    "website": string | null
  },
  "summary": string, // 2-3 sentence professional summary tailored to the target role
  "experience": [
    {
      "role": string, // Job title, potentially rephrased for ATS alignment
      "company": string,
      "location": string | null,
      "duration": string, // Original dates preserved exactly
      "highlights": string[] // 3-5 bullet points, each starting with action verb
    }
  ],
  "skills": string[], // Skills reorganized by relevance to target role (most relevant first)
  "inferredSkills": string[], // Keep original inferred skills
  "education": [
    {
      "degree": string,
      "institution": string,
      "location": string | null,
      "year": string,
      "gpa": string | null,
      "coursework": string[],
      "activities": string[]
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string, // Rewritten to emphasize relevance to target role
      "technologies": string[],
      "link": string | null,
      "duration": string | null
    }
  ],
  "certifications": [{"name": string, "issuer": string, "year": string}],
  "languages": string[],
  "leadership": [
    {
      "role": string,
      "organization": string,
      "duration": string,
      "description": string | null,
      "highlights": string[]
    }
  ],
  "seniorityLevel": "entry" | "junior" | "mid" | "senior" | "lead" | "principal" | "director" | "executive",
  "yearsOfExperience": number,
  "industries": string[],
  "primaryFunctions": string[]
}`

// ============================================================
// UNIFIED TAILORING PROMPT - Generate & Validate in One Pass
// ============================================================

const TAILORING_SYSTEM_PROMPT = `You are an elite CV tailoring specialist who creates professional, ATS-optimized resumes following best practices from Harvard MCS, Stanford Career Center, and top tech recruiters.

YOUR MISSION:
Transform the candidate's existing CV data to optimally position them for a specific job opportunity while maintaining 100% factual accuracy. You must both tailor AND quality-check in a single pass.

=========================
STEP 1: ANALYZE JOB DESCRIPTION
=========================
Before tailoring, identify:
1. TARGET ROLE: Exact title and level (Junior, Mid, Senior, Lead, Director, etc.)
2. REQUIRED SKILLS: Must-have technical and soft skills
3. PREFERRED SKILLS: Nice-to-have skills that differentiate candidates
4. KEY RESPONSIBILITIES: What the role actually does day-to-day
5. INDUSTRY/DOMAIN: Sector-specific terminology and expectations
6. SENIORITY SIGNALS: Team size, budget ownership, scope indicators

=========================
STEP 2: TAILOR CV SECTIONS
=========================

SUMMARY (2-3 sentences):
- Open with years of experience + primary expertise area
- Highlight 2-3 skills most relevant to the target role
- End with value proposition aligned to job requirements
- NO personal pronouns (I, my, we)

SKILLS REORDERING:
- Move skills matching job requirements to the front
- Group by category (Languages, Frameworks, Tools, Cloud, Soft Skills)
- Remove completely irrelevant skills only if list is very long (20+)
- NEVER add skills not present in original CV

EXPERIENCE BULLETS:
- Rewrite each bullet using: [Action Verb] + [What] + [Context/Tools] + [Quantified Result]
- Emphasize achievements relevant to target role
- Use job description keywords naturally where truthful
- Maintain all original facts (dates, companies, core responsibilities)
- 3-5 bullets per role, each 1-2 lines max
   
PROJECTS:
- Rewrite descriptions to highlight technologies matching job requirements
- Emphasize outcomes relevant to the target role
- Keep all original project facts intact

${RESUME_LANGUAGE_RULES}

=========================
BULLET POINT FORMULA
=========================
${BULLET_FORMULA}

STRONG ACTION VERBS:
- Leadership: ${ACTION_VERBS.leadership.slice(0, 12).join(', ')}
- Technical: ${ACTION_VERBS.technical.join(', ')}
- Communication: ${ACTION_VERBS.communication.slice(0, 10).join(', ')}
- Research: ${ACTION_VERBS.research.slice(0, 10).join(', ')}

=========================
SENIORITY-SPECIFIC GUIDANCE
=========================
ENTRY/JUNIOR: Emphasize education, projects, internships, learning velocity
MID-LEVEL: Focus on independent contributions, quantified impact, ownership
SENIOR/LEAD: Technical leadership, architecture decisions, mentorship, cross-team influence

FOR DIRECTOR/EXECUTIVE ROLES:
${DIRECTOR_LEVEL_GUIDANCE}

=========================
STEP 3: QUALITY CHECKS (Apply Before Output)
=========================
□ Every skill exists in original CV (skills, inferredSkills, or mentioned in experience)
□ Every company name matches original exactly
□ Every date/duration matches original exactly
□ No fabricated metrics, achievements, technologies, or tools
□ Education and certifications match original
□ Summary is 2-3 sentences with no pronouns
□ Every bullet starts with strong action verb (not "was responsible for")
□ No personal pronouns (I, my, we, our) anywhere
□ No passive voice
□ No placeholders like [Year], [Company], [Degree]
□ Skill names normalized (React.js → React, K8s → Kubernetes)
□ No duplicate skills

=========================
STRICT FACTUAL INTEGRITY
=========================
1. NEVER invent skills, technologies, tools, or frameworks
2. NEVER fabricate metrics, numbers, or achievements
3. NEVER add companies, roles, or dates not in original CV
4. NEVER create fake certifications or education
5. PRESERVE all original dates, company names, and core facts
6. You MAY rephrase, restructure, and emphasize existing facts
7. You MAY infer reasonable impact from stated responsibilities

=========================
OUTPUT FORMAT
=========================
Return a valid JSON object matching this exact schema:
${TAILORED_CV_OUTPUT_SCHEMA}

CRITICAL: Output ONLY valid JSON. No markdown, no explanations, no commentary.`

// ============================================================
// VALIDATION HELPER
// ============================================================

interface TailoredCVOutput {
    name: string
    contactInfo: {
        email?: string | null
        phone?: string | null
        location?: string | null
        linkedin?: string | null
        github?: string | null
        website?: string | null
    }
    summary: string
    experience: Array<{
        role: string
        company: string
        location?: string | null
        duration: string
        highlights: string[]
    }>
    skills: string[]
    inferredSkills: string[]
    education: Array<{
        degree: string
        institution: string
        location?: string | null
        year: string
        gpa?: string | null
        coursework?: string[]
        activities?: string[]
    }>
    projects: Array<{
        name: string
        description: string
        technologies: string[]
        link?: string | null
        duration?: string | null
    }>
    certifications: Array<{ name: string; issuer: string; year: string }>
    languages: string[]
    leadership: Array<{
        role: string
        organization: string
        duration: string
        description?: string | null
        highlights: string[]
    }>
    seniorityLevel: string
    yearsOfExperience: number
    industries: string[]
    primaryFunctions: string[]
}

function validateTailoredOutput(output: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!output.name) issues.push('Missing name')
    if (!output.summary) issues.push('Missing summary')
    if (!Array.isArray(output.skills)) issues.push('Skills must be an array')
    if (!Array.isArray(output.experience)) issues.push('Experience must be an array')
    if (!Array.isArray(output.education)) issues.push('Education must be an array')

    // Check experience structure
    if (Array.isArray(output.experience)) {
        output.experience.forEach((exp: any, i: number) => {
            if (!exp.role) issues.push(`Experience[${i}] missing role`)
            if (!exp.company) issues.push(`Experience[${i}] missing company`)
            if (!exp.duration) issues.push(`Experience[${i}] missing duration`)
            if (!Array.isArray(exp.highlights)) issues.push(`Experience[${i}] highlights must be array`)
        })
    }

    // Check for pronouns in summary
    if (output.summary && /\b(I|my|we|our)\b/i.test(output.summary)) {
        issues.push('Summary contains personal pronouns')
    }

    return {
        isValid: issues.length === 0,
        issues
    }
}

// ============================================================
// MAIN ROUTE HANDLER
// ============================================================

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

        // Get user's specific CV metadata - cvMetadataId is required
        const { data: cvMetadata, error: cvError } = await supabase
            .from('cv_metadata')
            .select('*')
            .eq('user_id', user.id)
            .eq('id', cvMetadataId)
            .single()

        if (cvError || !cvMetadata) {
            return NextResponse.json(
                { error: 'CV not found. The specified CV does not exist or does not belong to you.' },
                { status: 404 }
            )
        }

        // Get the structured CV data
        const originalCV: ExtractedCVInfo = cvMetadata.extracted_info

        // --------------------------------------------------------
        // Generate Tailored CV (Single API Call)
        // --------------------------------------------------------
        const tailoringMessages: ChatCompletionMessageParam[] = [
            { role: 'system', content: TAILORING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `ORIGINAL CV DATA (source of truth - do not add facts not present here):
${JSON.stringify(originalCV, null, 2)}

JOB DESCRIPTION:
${jobDescription}

MATCH ANALYSIS (use to prioritize relevant skills and experience):
${JSON.stringify(matchAnalysis, null, 2)}

Generate a tailored, quality-checked CV optimized for this job. Return valid JSON only.`
            }
        ]

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: tailoringMessages,
            response_format: { type: 'json_object' },
            temperature: 0.5,
        })

        const tailoredCV: TailoredCVOutput = JSON.parse(
            completion.choices[0]?.message?.content || '{}'
        )

        if (!tailoredCV || Object.keys(tailoredCV).length === 0) {
            throw new Error('OpenAI returned empty or invalid JSON')
        }

        // --------------------------------------------------------
        // Validate Output Structure
        // --------------------------------------------------------
        const outputValidation = validateTailoredOutput(tailoredCV)

        if (!outputValidation.isValid) {
            console.warn('Tailored CV validation issues:', outputValidation.issues)
        }

        // --------------------------------------------------------
        // Generate Markdown version for backward compatibility
        // --------------------------------------------------------
        const tailoredCVMarkdown = generateMarkdownFromStructured(tailoredCV)

        return NextResponse.json({
            // Structured output for CV editor
            tailoredCVData: tailoredCV,
            // Markdown for backward compatibility and preview
            tailoredCV: tailoredCVMarkdown,
            // Validation status
            validationStatus: outputValidation.isValid ? 'passed' : 'warning',
            validationIssues: outputValidation.issues
        })

    } catch (error) {
        console.error('Tailor CV error:', error)
        return NextResponse.json(
            {
                error: 'Failed to tailor CV',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
})

// ============================================================
// HELPER: Generate Markdown from Structured Data
// ============================================================

function generateMarkdownFromStructured(cv: TailoredCVOutput): string {
    const sections: string[] = []

    // Header
    if (cv.name) {
        sections.push(`# ${cv.name}`)
    }

    // Contact Info
    const contactParts: string[] = []
    if (cv.contactInfo?.email) contactParts.push(cv.contactInfo.email)
    if (cv.contactInfo?.phone) contactParts.push(cv.contactInfo.phone)
    if (cv.contactInfo?.location) contactParts.push(cv.contactInfo.location)
    if (cv.contactInfo?.linkedin) contactParts.push(cv.contactInfo.linkedin)
    if (cv.contactInfo?.github) contactParts.push(cv.contactInfo.github)
    if (cv.contactInfo?.website) contactParts.push(cv.contactInfo.website)

    if (contactParts.length > 0) {
        sections.push(contactParts.join(' | '))
    }

    // Summary
    if (cv.summary) {
        sections.push(`## Professional Summary\n\n${cv.summary}`)
    }

    // Skills
    if (cv.skills && cv.skills.length > 0) {
        sections.push(`## Skills\n\n${cv.skills.join(', ')}`)
    }

    // Experience
    if (cv.experience && cv.experience.length > 0) {
        const expLines = cv.experience.map(exp => {
            const header = `### ${exp.role} | ${exp.company}${exp.location ? ` | ${exp.location}` : ''}\n*${exp.duration}*`
            const bullets = exp.highlights?.map(h => `- ${h}`).join('\n') || ''
            return `${header}\n\n${bullets}`
        }).join('\n\n')
        sections.push(`## Experience\n\n${expLines}`)
    }

    // Projects
    if (cv.projects && cv.projects.length > 0) {
        const projLines = cv.projects.map(proj => {
            const techStr = proj.technologies?.length > 0 ? ` | *${proj.technologies.join(', ')}*` : ''
            return `### ${proj.name}${techStr}\n${proj.description}${proj.link ? `\n[Link](${proj.link})` : ''}`
        }).join('\n\n')
        sections.push(`## Projects\n\n${projLines}`)
    }

    // Leadership
    if (cv.leadership && cv.leadership.length > 0) {
        const leadLines = cv.leadership.map(lead => {
            const header = `### ${lead.role} | ${lead.organization}\n*${lead.duration}*`
            const desc = lead.description ? `\n${lead.description}` : ''
            const bullets = lead.highlights?.map(h => `- ${h}`).join('\n') || ''
            return `${header}${desc}\n\n${bullets}`
        }).join('\n\n')
        sections.push(`## Leadership\n\n${leadLines}`)
    }

    // Education
    if (cv.education && cv.education.length > 0) {
        const eduLines = cv.education.map(edu => {
            let line = `### ${edu.degree} | ${edu.institution}`
            if (edu.location) line += ` | ${edu.location}`
            line += `\n*${edu.year}*`
            if (edu.gpa) line += ` | GPA: ${edu.gpa}`
            if (edu.coursework && edu.coursework.length > 0) {
                line += `\n\n**Relevant Coursework:** ${edu.coursework.join(', ')}`
            }
            return line
        }).join('\n\n')
        sections.push(`## Education\n\n${eduLines}`)
    }

    // Certifications
    if (cv.certifications && cv.certifications.length > 0) {
        const certLines = cv.certifications.map(cert =>
            `- ${cert.name} | ${cert.issuer} (${cert.year})`
        ).join('\n')
        sections.push(`## Certifications\n\n${certLines}`)
    }

    // Languages
    if (cv.languages && cv.languages.length > 0) {
        sections.push(`## Languages\n\n${cv.languages.join(', ')}`)
    }

    return sections.join('\n\n---\n\n')
}
