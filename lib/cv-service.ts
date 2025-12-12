import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { getExtractionPromptFragment } from '@/lib/resume-guidelines'

export interface ValidationResult {
    status: 'valid' | 'incomplete' | 'invalid'
    missingInfoQuestions?: string[]
    rejectionReason?: string
    extractedInfo?: {
        name: string
        contactInfo: {
            email?: string
            phone?: string
            location?: string
            linkedin?: string
            github?: string
            website?: string
            raw?: string
        }
        summary: string
        experience: Array<{
            role: string
            company: string
            location?: string
            duration: string
            description?: string
            highlights?: string[]
        }>
        skills: string[]
        inferredSkills: string[]  // Skills inferred from context, not explicitly listed
        education: Array<{
            degree: string
            institution: string
            location?: string
            year: string
            gpa?: string
            coursework?: string[]
            activities?: string[]
        }>
        projects: Array<{ name: string, description: string, technologies: string[], link?: string, duration?: string }>
        certifications: Array<{ name: string, issuer: string, year: string }>
        languages: string[]
        leadership: Array<{
            role: string
            organization: string
            duration: string
            description?: string
            highlights?: string[]
        }>
        seniorityLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director' | 'executive'
        yearsOfExperience: number
        industries: string[]
        primaryFunctions: string[]
    }
    issues?: string[]
    formatType?: 'bullet' | 'paragraph' | 'mixed'
}

const INPUT_VALIDATION_PROMPT = `You are an expert CV/Resume parser and validator. Your job is to:
1. Determine if the input is a valid CV/Resume or professional profile.
2. If it is NOT a CV (e.g., random text, code, a poem, a recipe), mark it as INVALID.
3. If it IS a CV but has significant gaps, mark it as INCOMPLETE.
4. If it is a complete and valid CV, mark it as VALID and extract ALL information comprehensively.

IMPORTANT - FORMAT FLEXIBILITY:
- Accept BOTH bullet-point style AND paragraph-style resumes as valid
- Accept section headings like "Education", "Experience", "Relevant Experience", "Technical Skills & Projects", "Leadership", etc.
- Parse contact info from header lines like "City, ST ZIP • email • phone • url"
- Handle varied date formats: "Jan 2024 - May 2025", "June - August 2025", "2020-2022", "May 2026 (expected)"

${getExtractionPromptFragment()}

LANGUAGE NORMALIZATION:
- If the CV is not in English, translate all narrative and label content to clear, professional English.
- Preserve proper nouns and terms where translation is not appropriate (company names, product names, certifications, course titles, tool/library names).
- Normalize role titles to common English equivalents when safe (e.g., "Ingeniero de Software" -> "Software Engineer").
- Keep contact info values intact; do not translate email addresses or URLs.
- Ensure language names use English (e.g., "Deutsch" -> "German").

LIGHT UPLIFT EDITS (non-invasive):
- Correct spelling and grammar; fix minor formatting only.
- Prefer active voice; avoid personal pronouns (no "I" or "We").
- Be specific rather than general; articulate, not flowery.
- Do not fabricate facts or numbers; only quantify when present.
- Avoid slang, colloquialisms, and unexplained abbreviations.
- Make content easy to scan (concise bullets, clear labels) without restructuring sections.
- Preserve original structure and order; use reverse chronological ordering when obvious.
- Do not add personal details (photo, age, gender) or references.

CONSERVATIVE INFERENCE (fill missing categories when highly supported):
- It is acceptable to populate empty/omitted categories if there is strong evidence in the CV.
- Leadership:
  - If a project/role clearly implies leadership (e.g., "led", "owned", "managed", "mentored", "stakeholders", "cross-functional", "project lead", "team lead"), add a leadership entry.
  - Use the most directly supported details from the source text (role, organization, scope).
  - Set duration ONLY if it is explicitly stated or can be safely derived from an associated experience/project duration; otherwise do NOT create the entry.
  - Add 1-3 concise highlights only when supported; do not invent metrics.
- Industries / Primary Functions / Inferred Skills:
  - Prefer inferring these from repeated, concrete evidence (domain terms, responsibilities, tools), not from a single vague mention.
- Never fabricate facts, titles, company names, numbers, dates, or responsibilities. If unsure, leave the field empty rather than guessing.

Return a JSON object with:
{
  "status": "valid" | "incomplete" | "invalid",
  "formatType": "bullet" | "paragraph" | "mixed",
  "rejectionReason": string, // If invalid, explain why
  "extractedInfo": {
    "name": string,
    "contactInfo": {
      "email": string | null,
      "phone": string | null,
      "location": string | null,
      "linkedin": string | null,
      "github": string | null,
      "website": string | null,
      "raw": string // Original contact line for reference
    },
    "summary": string, // Professional summary/objective, or synthesize from overall profile
    "experience": [
      {
        "role": string,
        "company": string,
        "location": string | null,
        "duration": string,
        "description": string | null,
        "highlights": string[] // Key achievements/bullets
      }
    ],
    "skills": string[], // Explicitly listed skills
    "inferredSkills": string[], // Skills inferred from experience, projects, education (e.g., "Taught C, PHP" → C, PHP, Teaching)
    "education": [
      {
        "degree": string,
        "institution": string,
        "location": string | null,
        "year": string,
        "gpa": string | null,
        "coursework": string[], // Relevant coursework if listed
        "activities": string[] // Extracurriculars tied to education
      }
    ],
    "projects": [
      {
        "name": string,
        "description": string,
        "technologies": string[],
        "link": string | null,
        "duration": string | null
      }
    ],
    "certifications": [{"name": string, "issuer": string, "year": string}],
    "languages": string[], // Spoken languages
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
    "yearsOfExperience": number, // Estimated total professional experience
    "industries": string[], // Inferred industries (tech, finance, healthcare, etc.)
    "primaryFunctions": string[] // Primary job functions (Software Engineering, Product, Data, etc.)
  },
  "issues": string[] // Any issues found (missing dates, vague descriptions, etc.)
}

SKILL EXTRACTION IS CRITICAL:
1. Extract ALL explicitly listed skills (from Skills sections, Programming: lines, etc.)
2. INFER skills from:
   - Technologies mentioned in experience/projects ("using React and Node.js" → React, Node.js)
   - Responsibilities ("managed AWS" → AWS, Cloud)
   - Teaching/mentoring activities ("Taught C, PHP" → C, PHP, Teaching, Mentoring)
   - Education coursework ("Data Structures" → Algorithms, Data Structures)
3. Normalize skill names (React.js → React, K8s → Kubernetes)
4. Don't duplicate between skills and inferredSkills

Rules:
- Status "invalid": Use for completely irrelevant content (not a CV at all)
- Status "incomplete": Use if missing Name, all Contact Info, OR has no Experience AND no Education
- Status "valid": Has Name, some Contact Info, AND (Experience OR Education)`

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
