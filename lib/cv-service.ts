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

// Helper to convert extractedInfo to a text format for analysis
// This is used when we only have the extracted metadata in the DB but need to "simulate" reading the CV for LLM prompts
export function formatExtractedInfoForAnalysis(info: Record<string, unknown>): string {
  const sections: string[] = []

  if (info.name) sections.push(`Name: ${info.name}`)

  if (info.contactInfo) {
    const contact = info.contactInfo as Record<string, unknown>
    const contactParts = []
    if (contact.email) contactParts.push(`Email: ${contact.email}`)
    if (contact.phone) contactParts.push(`Phone: ${contact.phone}`)
    if (contact.location) contactParts.push(`Location: ${contact.location}`)
    if (contact.linkedin) contactParts.push(`LinkedIn: ${contact.linkedin}`)
    if (contact.github) contactParts.push(`GitHub: ${contact.github}`)
    if (contactParts.length) sections.push(`Contact:\n${contactParts.join('\n')}`)
  }

  if (info.summary) sections.push(`Summary:\n${info.summary}`)

  if (info.seniorityLevel) sections.push(`Seniority Level: ${info.seniorityLevel}`)
  if (info.yearsOfExperience !== undefined) sections.push(`Years of Experience: ${info.yearsOfExperience}`)

  if (Array.isArray(info.skills) && info.skills.length) {
    sections.push(`Skills:\n${info.skills.join(', ')}`)
  }

  if (Array.isArray(info.experience) && info.experience.length) {
    const expText = info.experience.map((exp: any) => {
      const parts = [`${exp.role || exp.title} at ${exp.company}`]
      if (exp.duration) parts.push(`(${exp.duration})`)
      if (exp.description) parts.push(`\n  ${exp.description}`)
      if (Array.isArray(exp.highlights)) parts.push(`\n  - ${exp.highlights.join('\n  - ')}`)
      return parts.join(' ')
    }).join('\n\n')
    sections.push(`Experience:\n${expText}`)
  }

  if (Array.isArray(info.education) && info.education.length) {
    const eduText = info.education.map((edu: any) => {
      return `${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`
    }).join('\n')
    sections.push(`Education:\n${eduText}`)
  }

  if (Array.isArray(info.certifications) && info.certifications.length) {
    const certText = info.certifications.map((cert: any) => {
      return typeof cert === 'string' ? cert : `${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}`
    }).join('\n')
    sections.push(`Certifications:\n${certText}`)
  }

  if (Array.isArray(info.projects) && info.projects.length) {
    const projText = info.projects.map((proj: any) => {
      const parts = [proj.name || proj.title]
      if (proj.description) parts.push(`: ${proj.description}`)
      if (Array.isArray(proj.technologies)) parts.push(` [${proj.technologies.join(', ')}]`)
      return parts.join('')
    }).join('\n')
    sections.push(`Projects:\n${projText}`)
  }

  if (Array.isArray(info.leadership) && info.leadership.length) {
    const leadText = info.leadership.map((lead: any) => {
      const parts = [lead.role || lead.title]
      if (lead.scope) parts.push(`: ${lead.scope}`)
      if (lead.impact) parts.push(` - Impact: ${lead.impact}`)
      return parts.join('')
    }).join('\n')
    sections.push(`Leadership:\n${leadText}`)
  }

  return sections.join('\n\n')
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

=========================================
INTELLIGENT RECLASSIFICATION (CRITICAL)
=========================================
You must analyze the *content* of an entry, not just where the user placed it, and move it to the correct array if necessary.

1. EXPERIENCE -> PROJECTS (Fixing misclassified projects)
   - IF an entry in the 'Experience' section is actually a personal project, academic assignment, or hackathon submission:
     - Indicators: Company is "Personal Project", "Self", "University Name" (without a job title like TA/RA), or blank.
     - Indicators: Role is "Student", "Learner", or the name of an app (e.g., "Weather App").
   - ACTION: Move this entry to the 'projects' array.

2. PROJECTS -> LEADERSHIP (Fixing misclassified roles)
   - IF a 'Project' entry is actually a standing role of authority:
     - Indicators: "President", "Founder" (of a club), "Organizer", "Treasurer", "Secretary".
   - ACTION: Move this entry to the 'leadership' array.

3. PROJECTS -> EXPERIENCE MERGE (Internal Initiatives)
   - IF a 'Project' entry explicitly names a company found in the 'Experience' section (e.g., project lists "Direktiv" and candidate has a job at "Direktiv"):
   - AND the dates overlap with that employment:
     - ACTION: Do NOT create a new entry. Instead, merge this content into the existing 'Experience' entry.
     - HOW: Append the project description and outcomes as new highlights/bullets to the main role.
     - FORMAT: Preface these specific bullets with "Key Initiative: [Project Name] - ..." to distinguish them.

4. PROJECTS -> FREELANCE CONSOLIDATION (External Work)
   - IF found 'Projects' are actually paid freelance mandates, or if the CV lists multiple short-term contract roles:
   - PRINCIPLE: Freelancing is a continuous business. Gaps between mandates are active business periods.
   - CHECK: Does a general "Freelance" or "Self-Employed" role already exist covering this time range?
     - YES (Parent exists): Move the project/mandate into that role's 'highlights' array.
     - NO (No Parent): Create a NEW "Freelance Consultant" entry.
   - CHECK GAP: Look at the time between the end of the old freelance work and the start of the new freelance work.
   - DATE RE-CALCULATION (CRITICAL):
     - The duration of the consolidated entry MUST span from the EARLIEST Start Date of any merged mandate to the LATEST End Date (or "Present").
     - Example: If merging "Project A (2018)" and "Project B (2024)" into "Freelance Consultant (2025-Present)", you MUST update the parent dates to "2018 - Present".
    ! BUT IF GAP > 18 MONTHS (and covered by full-time employment): 
       - ACTION: Do NOT merge. Keep them as separate chapters (e.g., "Freelance IT Consultant (2013-2022)" and "AI Consultant (2025-Present)"). 
       - REASON: This respects the candidate's narrative of "pausing" freelance work to focus on a full-time role.

  - FORMATTING:
    - If a mandate has multiple bullet points, KEEP multiple bullet points.
    - Prefix *every* bullet belonging to that mandate with the client name: "Mandate [Client Name]: [Action/Detail]".

5. DUPLICATE TEXT REMOVAL
   - Check for copy-paste errors where the same paragraph appears twice in a row. Keep only one instance.

=========================================
DATA CAPTURE STRATEGY (BLUEPRINT MODE)
=========================================
This output will serve as the "Master Database" for this candidate.
1. ATOMICITY RULE: One input bullet = One output highlight. Do not merge distinct facts.
2. MAXIMAL RETENTION: Do not summarize away details. If the candidate lists 15 bullets for a role, keep all 15.
3. PRESERVE METRICS: Never round numbers or omit financial/performance metrics (e.g., keep "19k Impressions", "150k LOC", "Team of 6").
4. PRESERVE LISTS: Capture every tool, technology, and keyword listed.
5. FORMATTING vs CONTENT: You MAY fix grammar, improve phrasing (Active Voice), and split dense paragraphs into bullets. However, you MUST NOT delete the underlying facts/events.
=========================================

LIGHT UPLIFT EDITS (non-invasive):
- Correct spelling and grammar.
- Prefer active voice; avoid personal pronouns (no "I" or "We").
- Be specific rather than general.
- Do not fabricate facts or numbers; only quantify when present.
- Make content easy to scan (granular bullets, clear labels).
- Preserve original structure and order; use reverse chronological ordering when obvious.
- Do not add personal details (photo, age, gender) or references.

CONSERVATIVE INFERENCE (fill missing categories when highly supported):
- It is acceptable to populate empty/omitted categories if there is strong evidence in the CV.
- Leadership:
  - If a project/role clearly implies leadership (e.g., "led", "owned", "managed", "mentored", "stakeholders", "cross-functional"), ensure it is captured.
  - Use the most directly supported details from the source text (role, organization, scope).
- Industries / Primary Functions / Inferred Skills:
  - Prefer inferring these from repeated, concrete evidence (domain terms, responsibilities, tools), not from a single vague mention.
- Never fabricate facts, titles, company names, numbers, dates, or responsibilities. If unsure, leave the field empty rather than guessing.

Return a JSON object with:
{
  "status": "valid" | "incomplete" | "invalid",
  "formatType": "bullet" | "paragraph" | "mixed",
  "rejectionReason": string,
  "extractedInfo": {
    "name": string,
    "contactInfo": {
      "email": string | null,
      "phone": string | null,
      "location": string | null,
      "linkedin": string | null,
      "github": string | null,
      "website": string | null,
      "raw": string
    },
    "summary": string,
    "experience": [
      {
        "role": string,
        "company": string,
        "type": "full-time" | "contract" | "freelance" | "interim" | "internship",
        "location": string | null,
        "duration": string,
        "description": string | null,
        "highlights": string[]
      }
    ],
    "skills": string[],
    "inferredSkills": string[],
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
        "description": string,
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
  },
  "issues": string[]
}

SKILL EXTRACTION IS CRITICAL:
1. Extract ALL explicitly listed skills (from Skills sections, Programming: lines, etc.)
2. INFER skills from:
   - Technologies mentioned in experience/projects ("using React and Node.js" -> React, Node.js)
   - Responsibilities ("managed AWS" -> AWS, Cloud)
   - Teaching/mentoring activities ("Taught C, PHP" -> C, PHP, Teaching, Mentoring)
   - Education coursework ("Data Structures" -> Algorithms, Data Structures)
3. Normalize skill names (React.js -> React, K8s -> Kubernetes)
4. Don't duplicate between skills and inferredSkills

Rules:
- Status "invalid": Use for completely irrelevant content (not a CV at all)
- Status "incomplete": Use if missing Name, all Contact Info, OR has no Experience AND no Education
- Status "valid": Has Name, some Contact Info, AND (Experience OR Education)
`;

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
