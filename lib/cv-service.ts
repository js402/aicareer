import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface ValidationResult {
    status: 'valid' | 'incomplete' | 'invalid'
    missingInfoQuestions?: string[]
    rejectionReason?: string
    extractedInfo?: {
        name: string
        contactInfo: string
        summary: string
        experience: Array<{ role: string, company: string, duration: string }>
        skills: string[]
        education: Array<{ degree: string, institution: string, year: string }>
        projects: Array<{ name: string, description: string, technologies: string[], link?: string }>
        certifications: Array<{ name: string, issuer: string, year: string }>
        languages: string[]
    }
    issues?: string[]
}

const INPUT_VALIDATION_PROMPT = `You are a CV structure validator. Your job is to:
1. Determine if the input is a valid CV/Resume or professional profile.
2. If it is NOT a CV (e.g., random text, code, a poem, a recipe), mark it as INVALID.
3. If it IS a CV but has significant gaps (missing name, missing contact info, very sparse experience, missing dates), mark it as INCOMPLETE and generate specific questions to ask the user.
4. If it is a complete and valid CV, mark it as VALID and extract the information.

Return a JSON object with:
{
  "status": "valid" | "incomplete" | "invalid",
  "missingInfoQuestions": string[], // If incomplete, list 3-5 specific questions to gather missing info
  "rejectionReason": string, // If invalid, explain why (e.g., "This appears to be a python script, not a CV")
  "extractedInfo": {
    "name": string,
    "contactInfo": string,
    "summary": string, // Professional summary or objective
    "experience": Array<{role: string, company: string, duration: string}>,
    "skills": string[],
    "education": Array<{degree: string, institution: string, year: string}>,
    "projects": Array<{name: string, description: string, technologies: string[], link?: string}>,
    "certifications": Array<{name: string, issuer: string, year: string}>,
    "languages": string[]
  }
}

Rules:
- Status "invalid": Use this for completely irrelevant content.
- Status "incomplete": Use this if it looks like a CV but is missing core fields like Name, Contact Info, or has no Experience/Education listed.
- Status "valid": Use this if it has at least Name, Contact Info, and some Experience or Education.
`

/**
 * Validates and extracts metadata from CV content using AI.
 * This is a shared service function used by multiple API endpoints.
 */
export async function extractCVMetadataWithAI(cvContent: string): Promise<ValidationResult> {
    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: INPUT_VALIDATION_PROMPT },
        { role: 'user', content: `Validate this CV:\n\n${cvContent}` }
    ]

    const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
    })

    return JSON.parse(completion.choices[0]?.message?.content || '{}') as ValidationResult
}
