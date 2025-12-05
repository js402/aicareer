import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

/**
 * Format blueprint data into readable CV format for analysis
 */
function formatBlueprintForAnalysis(blueprintData: any): string {
    const sections: string[] = []

    // Personal Info
    if (blueprintData.personal?.name) {
        sections.push(`Name: ${blueprintData.personal.name}`)
    }

    if (blueprintData.personal?.summary) {
        sections.push(`Professional Summary: ${blueprintData.personal.summary}`)
    }

    // Contact Info
    const contactParts: string[] = []
    if (blueprintData.contact?.email) contactParts.push(`Email: ${blueprintData.contact.email}`)
    if (blueprintData.contact?.phone) contactParts.push(`Phone: ${blueprintData.contact.phone}`)
    if (blueprintData.contact?.location) contactParts.push(`Location: ${blueprintData.contact.location}`)
    if (blueprintData.contact?.linkedin) contactParts.push(`LinkedIn: ${blueprintData.contact.linkedin}`)
    if (blueprintData.contact?.website) contactParts.push(`Website: ${blueprintData.contact.website}`)

    if (contactParts.length > 0) {
        sections.push(`Contact Information:\n${contactParts.join('\n')}`)
    }

    // Skills
    if (blueprintData.skills && blueprintData.skills.length > 0) {
        const skillsText = blueprintData.skills
            .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))
            .map((skill: any) => skill.name)
            .join(', ')
        sections.push(`Skills: ${skillsText}`)
    }

    // Experience
    if (blueprintData.experience && blueprintData.experience.length > 0) {
        const experienceText = blueprintData.experience
            .map((exp: any) =>
                `${exp.role} at ${exp.company} (${exp.duration})` +
                (exp.description ? `\n  ${exp.description}` : '')
            )
            .join('\n\n')
        sections.push(`Professional Experience:\n${experienceText}`)
    }

    // Education
    if (blueprintData.education && blueprintData.education.length > 0) {
        const educationText = blueprintData.education
            .map((edu: any) => `${edu.degree} from ${edu.institution} (${edu.year})`)
            .join('\n')
        sections.push(`Education:\n${educationText}`)
    }

    return sections.join('\n\n')
}

const JOB_MATCH_PROMPT = `
You are an expert career advisor, HR analyst, and technical recruiter.  
Your task is to evaluate how well a candidate's CV matches a specific Job Description (JD), with strong emphasis on:
- Required skills  
- Years of experience (if the cantidate has formal education but the job descriptions does not require formal education, you should add 1 year of experience) 
- Seniority level  
- Technical depth  
- Industry/domain match  
- Responsibilities  
- Tools, frameworks, and methodologies  
- Certifications or education level  

Using the CV and Job Description provided by the user, produce a JSON object with the following structure:

{
  "matchScore": number, // 0–100 weighted score based on skills, seniority, experience, responsibilities, and domain relevance
  "matchingSkills": string[], // Skills explicitly required in the JD that the CV clearly demonstrates
  "missingSkills": string[], // Skills the JD requires but the CV lacks or mentions weakly
  "experienceAlignment": {
    "seniorityMatch": "Underqualified" | "Good Fit" | "Overqualified",
    "yearsExperienceRequired": number | null,
    "yearsExperienceCandidate": number | null,
    "comment": string // Brief explanation of seniority/experience fit
  },
  "responsibilityAlignment": {
    "matchingResponsibilities": string[], // Responsibilities the CV has done before
    "missingResponsibilities": string[] // Responsibilities required but not shown in CV
  },
  "recommendations": string[], // 3–5 highly specific recommendations for improving the CV for this job
  "metadata": {
    "company_name": string,
    "position_title": string,
    "location": string,
    "salary_range": string,
    "employment_type": string | null, // Full-time, Contract, Internship, etc.
    "seniority_level": string | null // e.g., Junior, Mid, Senior, Lead, Principal, Director, C-level
  }
}

Scoring rules:
- Use strict but fair evaluation.
- Missing **core** technical skills should heavily reduce the matchScore.
- Seniority mismatch (e.g., JD asks for 8+ years but candidate has 2) should significantly impact rating.
- Soft skills should only influence the score minimally.
- If the JD is vague, infer reasonable expectations and state assumptions.

Extraction rules:
- Extract metadata **even if implied**.
- If something is not found, return a reasonable fallback like "Unknown" or null.

Your output MUST be valid JSON with no explanations outside the JSON block.
`

export const POST = withProAccess(async (request: NextRequest, { supabase, user }) => {
    try {
        const { jobDescription } = await request.json()

        if (!jobDescription) {
            return NextResponse.json(
                { error: 'Job Description is required' },
                { status: 400 }
            )
        }

        // Get user's blueprint
        const { data: blueprint } = await supabase
            .from('cv_blueprints')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!blueprint) {
            return NextResponse.json(
                { error: 'No CV blueprint found. Please upload a CV first.' },
                { status: 400 }
            )
        }

        // Create hashes for caching (blueprint version + job)
        const cvHash = createHash('sha256').update(JSON.stringify(blueprint.profile_data)).digest('hex')
        const jobHash = createHash('sha256').update(jobDescription).digest('hex')

        // Check cache
        const { data: cachedAnalysis } = await supabase
            .from('job_match_analyses')
            .select('*')
            .eq('user_id', user.id)
            .eq('cv_hash', cvHash)
            .eq('job_hash', jobHash)
            .single()

        if (cachedAnalysis) {
            return NextResponse.json({
                ...cachedAnalysis.analysis_result,
                fromCache: true,
                cachedAt: cachedAnalysis.created_at
            })
        }

        // Format blueprint data for analysis
        const blueprintData = blueprint.profile_data
        const cvSummary = formatBlueprintForAnalysis(blueprintData)

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: JOB_MATCH_PROMPT },
            {
                role: 'user',
                content: `Candidate Profile (from accumulated CV data):\n${cvSummary}\n\nJob Description:\n${jobDescription}`
            }
        ]

        const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.5,
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

        // Cache the result
        await supabase.from('job_match_analyses').insert({
            user_id: user.id,
            cv_hash: cvHash,
            job_hash: jobHash,
            match_score: result.matchScore,
            analysis_result: result
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error evaluating job match:', error)
        return NextResponse.json(
            {
                error: 'Failed to evaluate job match',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
})
