/**
 * Utilities for formatting CV metadata for different purposes
 * Consolidates the formatting logic used across multiple API routes
 */

interface ContactInfo {
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
  portfolio?: string
}

interface Experience {
  title?: string
  role?: string
  company?: string
  duration?: string
  dates?: string
  bullets?: string[]
  responsibilities?: string[]
}

interface Education {
  degree?: string
  qualification?: string
  institution?: string
  school?: string
  year?: string
  graduationYear?: string
}

interface Leadership {
  role?: string
  description?: string
}

interface Project {
  name?: string
  title?: string
  description?: string
}

export interface ExtractedCVInfo {
  name?: string
  summary?: string
  contactInfo?: ContactInfo
  skills?: string[]
  inferredSkills?: string[]
  experience?: Experience[]
  education?: Education[]
  leadership?: Leadership[]
  projects?: Project[]
  certifications?: string[]
  seniorityLevel?: string
  yearsOfExperience?: number
}

/**
 * Format CV metadata for analysis purposes (job matching, career guidance)
 */
export function formatCVMetadataForAnalysis(extractedInfo: ExtractedCVInfo): string {
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
  if (contact.website || contact.portfolio) {
    contactParts.push(`Website: ${contact.website || contact.portfolio}`)
  }

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
      .map((exp) => {
        const title = exp.title || exp.role || 'Position'
        const company = exp.company || 'Company'
        const duration = exp.duration || exp.dates || ''
        const bullets = exp.bullets || exp.responsibilities || []
        return (
          `${title} at ${company} (${duration})` +
          (bullets.length > 0 ? `\n  • ${bullets.join('\n  • ')}` : '')
        )
      })
      .join('\n\n')
    sections.push(`Professional Experience:\n${experienceText}`)
  }

  // Education
  if (extractedInfo.education && extractedInfo.education.length > 0) {
    const educationText = extractedInfo.education
      .map((edu) => {
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
      .map((item) => `${item.role}: ${item.description}`)
      .join('\n')
    sections.push(`Leadership & Impact:\n${leadershipText}`)
  }

  // Seniority info
  if (extractedInfo.seniorityLevel) {
    sections.push(`Seniority Level: ${extractedInfo.seniorityLevel}`)
  }
  if (extractedInfo.yearsOfExperience !== undefined) {
    sections.push(`Years of Experience: ${extractedInfo.yearsOfExperience}`)
  }

  return sections.join('\n\n')
}

/**
 * Format CV metadata for tailoring purposes (includes more details like projects)
 */
export function formatCVMetadataForTailoring(extractedInfo: ExtractedCVInfo): string {
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
  if (contact.website || contact.portfolio) {
    contactParts.push(`Website: ${contact.website || contact.portfolio}`)
  }

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
      .map((exp) => {
        const title = exp.title || exp.role || 'Position'
        const company = exp.company || 'Company'
        const duration = exp.duration || exp.dates || ''
        const bullets = exp.bullets || exp.responsibilities || []
        return (
          `${title} at ${company} (${duration})` +
          (bullets.length > 0 ? `\n  • ${bullets.join('\n  • ')}` : '')
        )
      })
      .join('\n\n')
    sections.push(`Professional Experience:\n${experienceText}`)
  }

  // Education
  if (extractedInfo.education && extractedInfo.education.length > 0) {
    const educationText = extractedInfo.education
      .map((edu) => {
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
      .map((item) => `${item.role}: ${item.description}`)
      .join('\n')
    sections.push(`Leadership & Impact:\n${leadershipText}`)
  }

  // Projects (if present)
  if (extractedInfo.projects && extractedInfo.projects.length > 0) {
    const projectsText = extractedInfo.projects
      .map((proj) => `${proj.name || proj.title}: ${proj.description || ''}`)
      .join('\n')
    sections.push(`Projects:\n${projectsText}`)
  }

  // Certifications (if present)
  if (extractedInfo.certifications && extractedInfo.certifications.length > 0) {
    sections.push(`Certifications: ${extractedInfo.certifications.join(', ')}`)
  }

  return sections.join('\n\n')
}

/**
 * Format contact info object to readable string
 */
export function formatContactInfo(contactInfo: string | ContactInfo): string {
  if (typeof contactInfo === 'string') {
    return contactInfo
  }

  const parts: string[] = []
  if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`)
  if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`)
  if (contactInfo.location) parts.push(`Location: ${contactInfo.location}`)
  if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`)
  if (contactInfo.website) parts.push(`Website: ${contactInfo.website}`)

  return parts.join('\n')
}
