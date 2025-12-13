/**
 * Utilities for formatting CV metadata for different purposes
 * Consolidates the formatting logic used across multiple API routes
 */
import type { ExtractedCVInfo as ApiExtractedCVInfo, CertificationEntry } from './api-client'

export type ExtractedCVInfo = ApiExtractedCVInfo

export function renderExtractedInfoToMarkdown(info: ExtractedCVInfo): string {
  const lines: string[] = []

  if (info.name) {
    lines.push(`# ${info.name.trim()}`)
  }

  const contact = typeof info.contactInfo === 'string' ? { raw: info.contactInfo } : (info.contactInfo || {})
  const contactParts: string[] = []
  if ('raw' in contact && contact.raw) contactParts.push(contact.raw.trim())
  if ('email' in contact && contact.email) contactParts.push(contact.email)
  if ('phone' in contact && contact.phone) contactParts.push(contact.phone)
  if ('location' in contact && contact.location) contactParts.push(contact.location)
  if ('linkedin' in contact && contact.linkedin) contactParts.push(contact.linkedin)
  if ('website' in contact && contact.website) contactParts.push(contact.website)
  if ('portfolio' in contact && contact.portfolio) contactParts.push(contact.portfolio)
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
