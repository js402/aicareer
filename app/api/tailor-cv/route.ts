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
import crypto from 'crypto'

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
Transform the candidate's existing CV data to optimally position them for a specific job opportunity.
IMPORTANT: This is a BLUEPRINT generation task.
1. DO NOT aggressively cut content to fit a page limit.
2. DO prioritize RE-ORDERING relevant facts to the top over deleting less relevant ones.
3. Maintain 100% factual accuracy.
4. Prefer bullet points over complex paragraphs.

=========================
STEP 1: ANALYZE JOB DESCRIPTION
=========================
Before tailoring, identify:
1. TARGET ROLE: Exact title and level (Junior, Mid, Senior, Lead, Director, etc.)
2. REQUIRED SKILLS: Must-have technical and soft skills
3. PREFERRED SKILLS: Nice-to-have skills that differentiate candidates
4. KEY RESPONSIBILITIES: What the role actually does day-to-day
5. INDUSTRY/DOMAIN: Sector-specific terminology and expectations

=========================
STEP 2: TAILOR CV SECTIONS
=========================

SUMMARY (Comprehensive Narrative):
- Create a strong professional narrative (3-5 sentences)
- Highlight primary expertise + key skills relevant to the target role
- End with value proposition aligned to job requirements
- NO personal pronouns (I, my, we)

SKILLS REORDERING:
- Move skills matching job requirements to the front
- Group by category (Languages, Frameworks, Tools, Cloud, Soft Skills)
- Remove completely irrelevant skills only if list is very long (20+)
- NEVER add skills not present in original CV

EXPERIENCE BULLETS (Blueprint Mode):
- FOCUS: Improve the *quality* and *impact* of the bullets.
- RE-RANKING: Place the most relevant bullets at the top of the list.
- INTERNAL INITIATIVES: If you see bullets labeled "Key Initiative:" (internal projects), highlight them if they match the target stack/goals.
- FORMULA: Rewrite using [Action Verb] + [What] + [Context/Tools] + [Quantified Result]
- QUANTITY: Keep all bullets that provide value or context. Only remove trivial/fluff items. Do not limit to 3-5.

INTERIM, FREELANCE & CONTRACT WORK:
- RESPECT STRUCTURE: The input likely groups freelance work under a single role (e.g., "Freelance Consultant"). Keep this structure.
- MANDATE SORTING: Inside the freelance role, re-order the specific client mandates. Put the clients/projects most relevant to the [Target Role] at the top.
- FORMATTING: Ensure bullets follow: "Client/Project: [Context] -> [Action] -> [Outcome] if possible".

PROJECTS (External/Side):
- Rewrite descriptions to highlight technologies matching job requirements
- Focus on Task, Scope, Solution, Result
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
□ Summary is 3-5 sentences with no pronouns
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
4. PRESERVE all original dates, company names, and core facts
5. PRESERVE SCOPE: Do not condense distinct achievements into a single vague bullet. Keep specific details, metrics, and outcomes intact.
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

        const { jobDescription, matchAnalysis, cvMetadataId, jobPositionId, companyName, positionTitle } = validation.data

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
        // Generate Markdown version
        // --------------------------------------------------------
        const tailoredCVMarkdown = generateMarkdownFromStructured(tailoredCV)

        // --------------------------------------------------------
        // Save tailored CV as new cv_metadata entry
        // --------------------------------------------------------
        // Generate a unique hash for this tailored CV
        const tailoredCVHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(tailoredCV) + Date.now())
            .digest('hex')

        // Create display name based on company/position info
        const dateStr = new Date().toISOString().slice(0, 10)
        const targetInfo = companyName || positionTitle || 'Tailored'
        const displayName = `${tailoredCV.name || 'CV'} - ${targetInfo} - ${dateStr}`

        // Save to cv_metadata table
        const { data: savedMetadata, error: saveError } = await supabase
            .from('cv_metadata')
            .insert({
                user_id: user.id,
                cv_hash: tailoredCVHash,
                extracted_info: tailoredCV,
                extraction_status: 'completed',
                confidence_score: 1.0,
                display_name: displayName,
                cv_content: tailoredCVMarkdown,
                source_type: 'tailored',
                source_cv_id: cvMetadataId,
                job_position_id: jobPositionId || null
            })
            .select()
            .single()

        if (saveError) {
            console.error('Error saving tailored CV to cv_metadata:', saveError)
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            // Structured output for CV editor
            tailoredCVData: tailoredCV,
            // Markdown for preview
            tailoredCV: tailoredCVMarkdown,
            // The new cv_metadata entry
            cvMetadata: savedMetadata,
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
    const lines: string[] = []

    // Header - Name centered
    if (cv.name) {
        lines.push(`# ${cv.name}`)
    }

    // Contact Info - single line, pipe separated
    const contactParts: string[] = []
    if (cv.contactInfo?.email) contactParts.push(cv.contactInfo.email)
    if (cv.contactInfo?.phone) contactParts.push(cv.contactInfo.phone)
    if (cv.contactInfo?.location) contactParts.push(cv.contactInfo.location)
    if (cv.contactInfo?.linkedin) contactParts.push(`[LinkedIn](${cv.contactInfo.linkedin})`)
    if (cv.contactInfo?.github) contactParts.push(`[GitHub](${cv.contactInfo.github})`)
    if (cv.contactInfo?.website) contactParts.push(`[Portfolio](${cv.contactInfo.website})`)

    if (contactParts.length > 0) {
        lines.push(contactParts.join(' • '))
    }

    // Summary - compact, no extra line breaks
    if (cv.summary) {
        lines.push(`## Summary`)
        lines.push(cv.summary)
    }

    // Skills - inline, comma separated
    if (cv.skills && cv.skills.length > 0) {
        lines.push(`## Technical Skills`)
        lines.push(`**${cv.skills.join(' • ')}**`)
    }

    // Experience - most important section
    if (cv.experience && cv.experience.length > 0) {
        lines.push(`## Experience`)
        cv.experience.forEach(exp => {
            // Role and company on same line, duration inline
            const locationPart = exp.location ? `, ${exp.location}` : ''
            lines.push(`**${exp.role}** — ${exp.company}${locationPart} *(${exp.duration})*`)
            // Bullets with no extra spacing
            if (exp.highlights && exp.highlights.length > 0) {
                exp.highlights.forEach(h => {
                    lines.push(`- ${h}`)
                })
            }
        })
    }

    // Projects - if present and not too many
    if (cv.projects && cv.projects.length > 0) {
        lines.push(`## Projects`)
        cv.projects.forEach(proj => {
            const techStr = proj.technologies?.length > 0 ? ` *(${proj.technologies.join(', ')})*` : ''
            lines.push(`**${proj.name}**${techStr}`)
            lines.push(proj.description)
        })
    }

    // Leadership - if present
    if (cv.leadership && cv.leadership.length > 0) {
        lines.push(`## Leadership`)
        cv.leadership.forEach(lead => {
            lines.push(`**${lead.role}** — ${lead.organization} *(${lead.duration})*`)
            if (lead.description) {
                lines.push(lead.description)
            }
            if (lead.highlights && lead.highlights.length > 0) {
                lead.highlights.forEach(h => {
                    lines.push(`- ${h}`)
                })
            }
        })
    }

    // Education - compact
    if (cv.education && cv.education.length > 0) {
        lines.push(`## Education`)
        cv.education.forEach(edu => {
            const locationPart = edu.location ? `, ${edu.location}` : ''
            const gpaPart = edu.gpa ? ` — GPA: ${edu.gpa}` : ''
            lines.push(`**${edu.degree}** — ${edu.institution}${locationPart} *(${edu.year})*${gpaPart}`)
            if (edu.coursework && edu.coursework.length > 0) {
                lines.push(`Coursework: ${edu.coursework.join(', ')}`)
            }
        })
    }

    // Certifications - single line each
    if (cv.certifications && cv.certifications.length > 0) {
        lines.push(`## Certifications`)
        cv.certifications.forEach(cert => {
            lines.push(`**${cert.name}** — ${cert.issuer} *(${cert.year})*`)
        })
    }

    // Languages - inline if short
    if (cv.languages && cv.languages.length > 0) {
        lines.push(`## Languages`)
        lines.push(cv.languages.join(' • '))
    }

    // Join with single newlines - CSS handles spacing
    return lines.join('\n')
}
