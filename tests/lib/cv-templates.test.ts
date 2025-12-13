import { describe, it, expect } from 'vitest'
import { CV_TEMPLATES, renderCVWithTemplate, PRINT_COLOR_PALETTES } from '@/lib/cv-templates'

const sampleData = {
  name: 'Jane Doe',
  contactInfo: { email: 'jane@example.com', phone: null, location: null, linkedin: null, github: null, website: null },
  summary: 'Experienced engineer.',
  experience: [
    { role: 'Engineer', company: 'Example Inc', location: null, duration: '2019-2024', highlights: ['Delivered features'] }
  ],
  skills: ['TypeScript', 'React'],
  inferredSkills: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  leadership: [],
  seniorityLevel: 'mid',
  yearsOfExperience: 6,
  industries: [],
  primaryFunctions: []
}

describe('cv-templates', () => {
  it('has templates and color palettes defined', () => {
    expect(Object.keys(CV_TEMPLATES).length).toBeGreaterThanOrEqual(4)
    expect(Object.keys(PRINT_COLOR_PALETTES).length).toBeGreaterThanOrEqual(5)
  })

  it('renders HTML containing key sections for modern template', () => {
    const html = renderCVWithTemplate(sampleData as any, 'modern', { colors: { primary: '#000', accent: '#3b82f6', text: '#111', muted: '#666' } } as any)
    expect(html).toContain('Jane Doe')
    expect(html).toMatch(/Experience|Skills|Summary/)
  })

  it('renders HTML for classic template', () => {
    const html = renderCVWithTemplate(sampleData as any, 'classic', { colors: { primary: '#000', accent: '#10b981', text: '#111', muted: '#666' } } as any)
    expect(html).toContain('Jane Doe')
  })
})
