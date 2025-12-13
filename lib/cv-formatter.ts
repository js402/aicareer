/**
 * Utilities for formatting CV metadata for different purposes
 * Consolidates the formatting logic used across multiple API routes
 */
import type { ExtractedCVInfo as ApiExtractedCVInfo, CertificationEntry, ContactInfo, ExperienceEntry, EducationEntry, ProjectEntry } from './api-client'

export type ExtractedCVInfo = ApiExtractedCVInfo

/**
 * Helper to normalize contact info to an object with string values
 */
function normalizeContactInfo(contactInfo: string | ContactInfo | undefined): Record<string, string> {
  if (!contactInfo) return {}
  if (typeof contactInfo === 'string') {
    return { raw: contactInfo }
  }
  // Cast to Record<string, string | undefined> and filter undefined values
  const result: Record<string, string> = {}
  if (contactInfo.email) result.email = contactInfo.email
  if (contactInfo.phone) result.phone = contactInfo.phone
  if (contactInfo.location) result.location = contactInfo.location
  if (contactInfo.linkedin) result.linkedin = contactInfo.linkedin
  if (contactInfo.github) result.github = contactInfo.github
  if (contactInfo.website) result.website = contactInfo.website
  if (contactInfo.raw) result.raw = contactInfo.raw
  return result
}

/**
 * Helper to get experience entry fields with fallbacks
 */
function getExpFields(exp: ExperienceEntry) {
  const expAny = exp as any
  return {
    title: expAny.title || exp.role || 'Position',
    company: exp.company || 'Company',
    duration: exp.duration || expAny.dates || '',
    location: exp.location || '',
    description: exp.description || '',
    highlights: exp.highlights || expAny.bullets || expAny.responsibilities || []
  }
}

/**
 * Helper to get education entry fields with fallbacks
 */
function getEduFields(edu: EducationEntry) {
  const eduAny = edu as any
  return {
    degree: edu.degree || eduAny.qualification || 'Degree',
    institution: edu.institution || eduAny.school || 'Institution',
    year: edu.year || eduAny.graduationYear || '',
    location: edu.location || ''
  }
}

/**
 * Helper to get project entry fields with fallbacks
 */
function getProjFields(proj: ProjectEntry) {
  const projAny = proj as any
  return {
    name: proj.name || projAny.title || 'Project',
    description: proj.description || '',
    technologies: proj.technologies || [],
    link: proj.link || ''
  }
}

export function renderExtractedInfoToMarkdown(info: ExtractedCVInfo): string {
  const lines: string[] = []

  if (info.name) {
    lines.push(`# ${info.name.trim()}`)
  }

  const contact = normalizeContactInfo(info.contactInfo)
  const contactParts: string[] = []
  if (contact.raw) contactParts.push(contact.raw.trim())
  if (contact.email) contactParts.push(contact.email)
  if (contact.phone) contactParts.push(contact.phone)
  if (contact.location) contactParts.push(contact.location)
  if (contact.linkedin) contactParts.push(contact.linkedin)
  if (contact.website) contactParts.push(contact.website)
  if (contactParts.length) {
    lines.push(contactParts.join(' • '))
  }

  if (info.summary) {
    lines.push('## Summary', info.summary.trim())
  }

  const skills = [
    ...(info.skills || []),
    ...(info.inferredSkills || [])
  ]
  if (skills.length) {
    lines.push('## Skills', skills.join(' • '))
  }

  if (info.experience?.length) {
    lines.push('## Experience')
    info.experience.forEach((exp) => {
      const role = (exp as any).title || exp.role || 'Role'
      const company = exp.company || 'Company'
      const duration = (exp as any).dates || exp.duration || ''
      const location = (exp as any).location || ''
      const header = `**${role}** — ${company}${location ? `, ${location}` : ''}${duration ? ` (${duration})` : ''}`
      lines.push(header)

      const bullets = (
        (exp as any).highlights ||
        (exp as any).responsibilities ||
        (exp as any).bullets ||
        []
      ) as string[]

      if ((exp as any).description) {
        lines.push((exp as any).description)
      }

      bullets
        .filter(Boolean)
        .forEach((b) => lines.push(`- ${b}`))
    })
  }

  if (info.education?.length) {
    lines.push('## Education')
    info.education.forEach((edu) => {
      const degree = (edu as any).qualification || edu.degree || 'Degree'
      const school = (edu as any).institution || (edu as any).school || 'Institution'
      const year = edu.year || (edu as any).graduationYear || ''
      lines.push(`**${degree}** — ${school}${year ? ` (${year})` : ''}`)
    })
  }

  if (info.projects?.length) {
    lines.push('## Projects')
    info.projects.forEach((proj) => {
      const title = proj.name || (proj as any).title || 'Project'
      const summary = proj.description || ''
      const tech = (proj as any).technologies as string[] | undefined
      lines.push(`**${title}**${tech?.length ? ` — ${tech.join(', ')}` : ''}`)
      if (summary) lines.push(`- ${summary}`)
    })
  }

  if (info.leadership?.length) {
    lines.push('## Leadership & Impact')
    info.leadership.forEach((item) => {
      lines.push(`**${item.role}** — ${item.organization || item.description || ''}`)
      if ((item as any).description) {
        lines.push(`- ${(item as any).description}`)
      }
      if (item.highlights?.length) {
        item.highlights.filter(Boolean).forEach((h) => lines.push(`- ${h}`))
      }
    })
  }

  if (info.certifications?.length) {
    const certLabels = (info.certifications as any[]).map((cert) => {
      if (typeof cert === 'string') return cert
      const c = cert as CertificationEntry
      if (c.name && c.issuer) return `${c.name} (${c.issuer})`
      return c.name || c.issuer || ''
    }).filter(Boolean)
    if (certLabels.length) {
      lines.push('## Certifications', certLabels.join(' • '))
    }
  }

  if (info.languages?.length) {
    lines.push('## Languages', info.languages.join(' • '))
  }

  if (info.primaryFunctions?.length) {
    lines.push('## Focus Areas', info.primaryFunctions.join(' • '))
  }

  if (info.industries?.length) {
    lines.push('## Industries', info.industries.join(' • '))
  }

  if (info.yearsOfExperience !== undefined) {
    lines.push('## Experience Summary', `${info.yearsOfExperience} years of experience`)
  }

  return lines.join('\n').trim()
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
  const contact = normalizeContactInfo(extractedInfo.contactInfo)
  const contactParts: string[] = []
  if (contact.email) contactParts.push(`Email: ${contact.email}`)
  if (contact.phone) contactParts.push(`Phone: ${contact.phone}`)
  if (contact.location) contactParts.push(`Location: ${contact.location}`)
  if (contact.linkedin) contactParts.push(`LinkedIn: ${contact.linkedin}`)
  if (contact.website) contactParts.push(`Website: ${contact.website}`)
  if (contact.raw && contactParts.length === 0) contactParts.push(contact.raw)

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
        const fields = getExpFields(exp)
        return (
          `${fields.title} at ${fields.company} (${fields.duration})` +
          (fields.highlights.length > 0 ? `\n  • ${fields.highlights.join('\n  • ')}` : '')
        )
      })
      .join('\n\n')
    sections.push(`Professional Experience:\n${experienceText}`)
  }

  // Education
  if (extractedInfo.education && extractedInfo.education.length > 0) {
    const educationText = extractedInfo.education
      .map((edu) => {
        const fields = getEduFields(edu)
        return `${fields.degree} from ${fields.institution}${fields.year ? ` (${fields.year})` : ''}`
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
  const contact = normalizeContactInfo(extractedInfo.contactInfo)
  const contactParts: string[] = []
  if (contact.email) contactParts.push(`Email: ${contact.email}`)
  if (contact.phone) contactParts.push(`Phone: ${contact.phone}`)
  if (contact.location) contactParts.push(`Location: ${contact.location}`)
  if (contact.linkedin) contactParts.push(`LinkedIn: ${contact.linkedin}`)
  if (contact.website) contactParts.push(`Website: ${contact.website}`)
  if (contact.raw && contactParts.length === 0) contactParts.push(contact.raw)

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
        const fields = getExpFields(exp)
        return (
          `${fields.title} at ${fields.company} (${fields.duration})` +
          (fields.highlights.length > 0 ? `\n  • ${fields.highlights.join('\n  • ')}` : '')
        )
      })
      .join('\n\n')
    sections.push(`Professional Experience:\n${experienceText}`)
  }

  // Education
  if (extractedInfo.education && extractedInfo.education.length > 0) {
    const educationText = extractedInfo.education
      .map((edu) => {
        const fields = getEduFields(edu)
        return `${fields.degree} from ${fields.institution}${fields.year ? ` (${fields.year})` : ''}`
      })
      .join('\n')
    sections.push(`Education:\n${educationText}`)
  }

  // Leadership (if present)
  if (extractedInfo.leadership && extractedInfo.leadership.length > 0) {
    const leadershipText = extractedInfo.leadership
      .map((item) => `${item.role}: ${item.description || item.organization || ''}`)
      .join('\n')
    sections.push(`Leadership & Impact:\n${leadershipText}`)
  }

  // Projects (if present)
  if (extractedInfo.projects && extractedInfo.projects.length > 0) {
    const projectsText = extractedInfo.projects
      .map((proj) => {
        const fields = getProjFields(proj)
        return `${fields.name}: ${fields.description}`
      })
      .join('\n')
    sections.push(`Projects:\n${projectsText}`)
  }

  // Certifications (if present)
  if (extractedInfo.certifications && extractedInfo.certifications.length > 0) {
    const certNames = extractedInfo.certifications.map((cert) => {
      if (typeof cert === 'string') return cert
      return cert.name || ''
    }).filter(Boolean)
    if (certNames.length > 0) {
      sections.push(`Certifications: ${certNames.join(', ')}`)
    }
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
