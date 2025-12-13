import { describe, it, expect } from 'vitest'
import { generatePrintCSS, PAPER_SIZES, optimizeForPrint, DEFAULT_PRINT_SETTINGS } from '@/lib/cv-print-engine'

const baseSettings = {
  ...DEFAULT_PRINT_SETTINGS,
  paperSize: 'A4' as keyof typeof PAPER_SIZES,
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
}

describe('cv-print-engine', () => {
  it('generates @page with correct margins for A4', () => {
    const css = generatePrintCSS(baseSettings)
    expect(css).toContain('@page')
    expect(css).toContain('size: A4')
    expect(css).toContain('margin: 20mm 20mm 20mm 20mm')
  })

  it('enforces orphan/widow controls and break-inside avoidance', () => {
    const css = generatePrintCSS(baseSettings)
    expect(css).toMatch(/orphans:\s*3/)
    expect(css).toMatch(/widows:\s*3/)
    expect(css).toMatch(/page-break-inside:\s*avoid/)
  })

  // Note: Two-column rendering is handled at template-level; CSS may not include explicit columns rule here.

  it('optimizeForPrint adds print classes to content', () => {
    const html = '<div><section><h2>Header</h2><p>Paragraph</p></section></div>'
    const optimized = optimizeForPrint(html)
    expect(optimized).toContain('<section>')
    expect(optimized).toContain('class="cv-section-title"')
    expect(optimized).toContain('class="cv-paragraph"')
  })
})
