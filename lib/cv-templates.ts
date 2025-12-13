/**
 * CV Template System with print-optimized layouts
 */
import type { ExtractedCVInfo } from './api-client'
import { PrintSettings, DEFAULT_PRINT_SETTINGS } from './cv-print-engine'

export interface CVTemplate {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'executive' | 'creative' | 'minimal' | 'academic'
  preview?: string // Base64 thumbnail
  printOptimized: boolean
  
  layout: {
    columns: 1 | 2
    headerStyle: 'center' | 'left' | 'split'
    contactStyle: 'inline' | 'stacked' | 'sidebar'
    sectionOrder: string[]
    spacing: 'compact' | 'normal' | 'spacious'
  }
  
  styles: PrintSettings
}

// Professional color palettes optimized for print
export const PRINT_COLOR_PALETTES = {
  classic: {
    primary: '#1a1a1a',
    accent: '#2563eb', 
    text: '#374151',
    muted: '#6b7280'
  },
  professional: {
    primary: '#0f172a',
    accent: '#1e40af',
    text: '#334155',
    muted: '#64748b'
  },
  executive: {
    primary: '#111827',
    accent: '#7c3aed',
    text: '#374151',
    muted: '#6b7280'
  },
  subtle: {
    primary: '#18181b',
    accent: '#059669',
    text: '#3f3f46',
    muted: '#71717a'
  },
  monochrome: {
    primary: '#000000',
    accent: '#404040',
    text: '#1f1f1f',
    muted: '#737373'
  }
} as const

// Template definitions
export const CV_TEMPLATES: Record<string, CVTemplate> = {
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean design with subtle accents',
    category: 'modern',
    printOptimized: true,
    layout: {
      columns: 1,
      headerStyle: 'center',
      contactStyle: 'inline',
      sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects'],
      spacing: 'normal'
    },
    styles: {
      ...DEFAULT_PRINT_SETTINGS,
      colors: PRINT_COLOR_PALETTES.professional,
      typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: 600,
        bodyWeight: 400
      }
    }
  },
  
  classic: {
    id: 'classic',
    name: 'Classic Traditional',
    description: 'Traditional layout, ATS-friendly',
    category: 'classic',
    printOptimized: true,
    layout: {
      columns: 1,
      headerStyle: 'center',
      contactStyle: 'stacked',
      sectionOrder: ['summary', 'experience', 'education', 'skills'],
      spacing: 'compact'
    },
    styles: {
      ...DEFAULT_PRINT_SETTINGS,
      colors: PRINT_COLOR_PALETTES.monochrome,
      fontSize: {
        base: 11,
        h1: 18,
        h2: 13,
        h3: 11.5
      },
      typography: {
        fontFamily: '"Times New Roman", Times, serif',
        headingWeight: 700,
        bodyWeight: 400
      }
    }
  },
  
  executive: {
    id: 'executive',
    name: 'Executive Leadership',
    description: 'Premium design for senior roles',
    category: 'executive',
    printOptimized: true,
    layout: {
      columns: 1,
      headerStyle: 'left',
      contactStyle: 'inline',
      sectionOrder: ['summary', 'experience', 'leadership', 'education', 'skills'],
      spacing: 'spacious'
    },
    styles: {
      ...DEFAULT_PRINT_SETTINGS,
      colors: PRINT_COLOR_PALETTES.executive,
      fontSize: {
        base: 11.5,
        h1: 22,
        h2: 15,
        h3: 12.5
      },
      spacing: {
        sectionGap: 22,
        paragraphGap: 10,
        listItemGap: 5
      }
    }
  },
  
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Ultra-clean, maximizes content space',
    category: 'minimal',
    printOptimized: true,
    layout: {
      columns: 1,
      headerStyle: 'left',
      contactStyle: 'inline',
      sectionOrder: ['experience', 'skills', 'education', 'projects'],
      spacing: 'compact'
    },
    styles: {
      ...DEFAULT_PRINT_SETTINGS,
      colors: PRINT_COLOR_PALETTES.subtle,
      fontSize: {
        base: 10.5,
        h1: 16,
        h2: 12,
        h3: 11
      },
      margins: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      },
      spacing: {
        sectionGap: 14,
        paragraphGap: 6,
        listItemGap: 3
      }
    }
  }
}

/**
 * Render CV using specific template
 */
export function renderCVWithTemplate(
  cvData: ExtractedCVInfo,
  templateId: string,
  customSettings?: Partial<PrintSettings>
): string {
  const template = CV_TEMPLATES[templateId] || CV_TEMPLATES.modern
  const settings = customSettings ? 
    { ...template.styles, ...customSettings } : 
    template.styles

  return generateCVHTML(cvData, template, settings)
}

/**
 * Generate structured HTML for CV
 */
function generateCVHTML(
  cvData: ExtractedCVInfo,
  template: CVTemplate,
  settings: PrintSettings
): string {
  const sections: string[] = []
  
  // Header section
  sections.push(generateHeader(cvData, template))
  
  // Summary section
  if (cvData.summary && template.layout.sectionOrder.includes('summary')) {
    sections.push(generateSummarySection(cvData.summary))
  }
  
  // Dynamic sections based on template order
  template.layout.sectionOrder.forEach(sectionId => {
    switch (sectionId) {
      case 'experience':
        if (cvData.experience?.length) {
          sections.push(generateExperienceSection(cvData.experience))
        }
        break
      case 'education':
        if (cvData.education?.length) {
          sections.push(generateEducationSection(cvData.education))
        }
        break
      case 'skills':
        if (cvData.skills?.length || cvData.inferredSkills?.length) {
          sections.push(generateSkillsSection(cvData.skills || [], cvData.inferredSkills || []))
        }
        break
      case 'projects':
        if (cvData.projects?.length) {
          sections.push(generateProjectsSection(cvData.projects))
        }
        break
      case 'leadership':
        if (cvData.leadership?.length) {
          sections.push(generateLeadershipSection(cvData.leadership))
        }
        break
    }
  })
  
  return `
<div class="cv-container">
  ${sections.join('\n')}
</div>`
}

function generateHeader(cvData: ExtractedCVInfo, template: CVTemplate): string {
  const contact = typeof cvData.contactInfo === 'object' ? cvData.contactInfo : 
                  { raw: cvData.contactInfo || '' }
  
  const contactParts = []
  if ('email' in contact && contact.email) contactParts.push(contact.email)
  if ('phone' in contact && contact.phone) contactParts.push(contact.phone)
  if ('location' in contact && contact.location) contactParts.push(contact.location)
  if ('linkedin' in contact && contact.linkedin) contactParts.push(contact.linkedin)
  if ('raw' in contact && contact.raw && contactParts.length === 0) {
    contactParts.push(contact.raw)
  }
  
  const contactHTML = template.layout.contactStyle === 'stacked' ?
    contactParts.map(part => `<div>${part}</div>`).join('') :
    contactParts.join(' • ')
  
  const alignClass = template.layout.headerStyle === 'center' ? 'text-center' : 
                    template.layout.headerStyle === 'split' ? 'text-right' : ''
  
  return `
<header class="cv-header ${alignClass}">
  <h1 class="cv-name">${cvData.name || 'Professional Name'}</h1>
  <div class="cv-contact cv-contact-group">${contactHTML}</div>
</header>`
}

function generateSummarySection(summary: string): string {
  return `
<section class="cv-section">
  <h2 class="cv-section-title">Professional Summary</h2>
  <p class="cv-summary">${summary}</p>
</section>`
}

function generateExperienceSection(experience: any[]): string {
  const items = experience.map(exp => {
    const title = exp.role || exp.title || 'Position'
    const company = exp.company || 'Company'
    const duration = exp.duration || exp.dates || ''
    const location = exp.location || ''
    
    const highlights = exp.highlights || exp.responsibilities || exp.bullets || []
    const highlightsList = highlights.length > 0 ? 
      `<ul class="cv-list">${highlights.map((h: string) => `<li class="cv-list-item">${h}</li>`).join('')}</ul>` : 
      ''
    
    const description = exp.description ? `<p class="cv-paragraph">${exp.description}</p>` : ''
    
    return `
<div class="cv-item">
  <div class="cv-item-header">
    <h3 class="cv-item-title">${title}</h3>
    <p class="cv-item-subtitle">${company}${location ? ` • ${location}` : ''}</p>
    ${duration ? `<p class="cv-item-meta">${duration}</p>` : ''}
  </div>
  ${description}
  ${highlightsList}
</div>`
  }).join('')

  return `
<section class="cv-section">
  <h2 class="cv-section-title">Professional Experience</h2>
  ${items}
</section>`
}

function generateEducationSection(education: any[]): string {
  const items = education.map(edu => {
    const degree = edu.degree || edu.qualification || 'Degree'
    const institution = edu.institution || edu.school || 'Institution'
    const year = edu.year || edu.graduationYear || ''
    const location = edu.location || ''
    
    return `
<div class="cv-item">
  <div class="cv-item-header">
    <h3 class="cv-item-title">${degree}</h3>
    <p class="cv-item-subtitle">${institution}${location ? ` • ${location}` : ''}</p>
    ${year ? `<p class="cv-item-meta">${year}</p>` : ''}
  </div>
</div>`
  }).join('')

  return `
<section class="cv-section">
  <h2 class="cv-section-title">Education</h2>
  ${items}
</section>`
}

function generateSkillsSection(skills: string[], inferredSkills: string[]): string {
  const allSkills = [...new Set([...skills, ...inferredSkills])]
  const skillTags = allSkills.map(skill => 
    `<span class="cv-skill-tag">${skill}</span>`
  ).join('')

  return `
<section class="cv-section">
  <h2 class="cv-section-title">Technical Skills</h2>
  <div class="cv-skills">${skillTags}</div>
</section>`
}

function generateProjectsSection(projects: any[]): string {
  const items = projects.map(project => {
    const name = project.name || project.title || 'Project'
    const description = project.description || ''
    const technologies = project.technologies || []
    const link = project.link || ''
    
    const techList = technologies.length > 0 ? 
      ` • Technologies: ${technologies.join(', ')}` : ''
    
    return `
<div class="cv-item">
  <div class="cv-item-header">
    <h3 class="cv-item-title">${name}${link ? ` (${link})` : ''}</h3>
    ${techList ? `<p class="cv-item-meta">${techList}</p>` : ''}
  </div>
  ${description ? `<p class="cv-paragraph">${description}</p>` : ''}
</div>`
  }).join('')

  return `
<section class="cv-section">
  <h2 class="cv-section-title">Projects</h2>
  ${items}
</section>`
}

function generateLeadershipSection(leadership: any[]): string {
  const items = leadership.map(item => {
    const role = item.role || 'Leadership Role'
    const organization = item.organization || item.description || ''
    const duration = item.duration || ''
    const highlights = item.highlights || []
    
    const highlightsList = highlights.length > 0 ? 
      `<ul class="cv-list">${highlights.map((h: string) => `<li class="cv-list-item">${h}</li>`).join('')}</ul>` : 
      ''
    
    return `
<div class="cv-item">
  <div class="cv-item-header">
    <h3 class="cv-item-title">${role}</h3>
    <p class="cv-item-subtitle">${organization}</p>
    ${duration ? `<p class="cv-item-meta">${duration}</p>` : ''}
  </div>
  ${highlightsList}
</div>`
  }).join('')

  return `
<section class="cv-section">
  <h2 class="cv-section-title">Leadership & Impact</h2>
  ${items}
</section>`
}