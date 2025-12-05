import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { withProAccess } from '@/lib/api-middleware'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

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
        const { cvContent, jobDescription } = await request.json()

        if (!cvContent || !jobDescription) {
            return NextResponse.json(
                { error: 'Both CV content and Job Description are required' },
                { status: 400 }
            )
        }

        // Create hashes for caching
        const cvHash = createHash('sha256').update(cvContent).digest('hex')
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

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: JOB_MATCH_PROMPT },
            {
                role: 'user',
                content: `CV Content:\n${cvContent}\n\nJob Description:\n${jobDescription}`
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
