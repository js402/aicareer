/**
 * CV Print Engine - Optimized for professional CV printing/PDF export
 * Handles page breaks, widows/orphans, and proper typographic flow
 */

export interface PrintSettings {
  template: string
  paperSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fontSize: {
    base: number
    h1: number
    h2: number
    h3: number
  }
  lineHeight: {
    body: number
    headings: number
  }
  spacing: {
    sectionGap: number
    paragraphGap: number
    listItemGap: number
  }
  colors: {
    primary: string
    accent: string
    text: string
    muted: string
  }
  typography: {
    fontFamily: string
    headingWeight: number
    bodyWeight: number
  }
  // Optional extended settings for layout editor
  atsMode?: boolean
  twoColumn?: boolean
  accentOpacity?: number
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  template: 'modern',
  paperSize: 'A4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  fontSize: {
    base: 11,
    h1: 20,
    h2: 14,
    h3: 12
  },
  lineHeight: {
    body: 1.4,
    headings: 1.2
  },
  spacing: {
    sectionGap: 18,
    paragraphGap: 8,
    listItemGap: 4
  },
  colors: {
    primary: '#1a1a1a',
    accent: '#2563eb',
    text: '#374151',
    muted: '#6b7280'
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    headingWeight: 600,
    bodyWeight: 400
  }
}

/**
 * Generate print-optimized CSS for CV rendering
 */
export function generatePrintCSS(settings: PrintSettings): string {
  const { margins, fontSize, lineHeight, spacing, colors, typography } = settings

  return `
/* === PRINT OPTIMIZATION === */
@page {
  size: ${settings.paperSize};
  margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
  
  /* Prevent page breaks in headers/footers */
  @top-center { content: ""; }
  @bottom-center { content: ""; }
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Hide non-printable elements */
  .no-print { display: none !important; }
  
  /* Optimize page breaks */
  body { 
    font-size: ${fontSize.base}pt !important;
    line-height: ${lineHeight.body} !important;
    color: ${colors.text} !important;
  }
}

/* === TYPOGRAPHY & LAYOUT === */
.cv-container {
  font-family: ${typography.fontFamily};
  font-size: ${fontSize.base}pt;
  line-height: ${lineHeight.body};
  color: ${colors.text};
  max-width: 210mm; /* A4 width minus margins */
  margin: 0 auto;
  background: white;
  
  /* Prevent awkward page breaks */
  orphans: 3;
  widows: 3;
}

/* === HEADERS === */
.cv-header {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: ${spacing.sectionGap}pt;
  text-align: center;
}

.cv-name {
  font-size: ${fontSize.h1}pt;
  font-weight: ${typography.headingWeight};
  line-height: ${lineHeight.headings};
  color: ${colors.primary};
  margin: 0 0 6pt 0;
  page-break-after: avoid;
}

.cv-contact {
  font-size: ${fontSize.base - 1}pt;
  color: ${colors.muted};
  margin: 0;
  line-height: 1.3;
}

/* === SECTIONS === */
.cv-section {
  margin-bottom: ${spacing.sectionGap}pt;
  /* Allow sections to break across pages */
  page-break-inside: auto;
  break-inside: auto;
}

.cv-section-title {
  font-size: ${fontSize.h2}pt;
  font-weight: ${typography.headingWeight};
  line-height: ${lineHeight.headings};
  color: ${colors.primary};
  margin: 0 0 8pt 0;
  padding-bottom: 2pt;
  border-bottom: 1pt solid ${colors.accent};
  
  /* Keep section titles with content */
  page-break-after: avoid;
  break-after: avoid-page;
}

.cv-subsection-title {
  font-size: ${fontSize.h3}pt;
  font-weight: ${typography.headingWeight};
  line-height: ${lineHeight.headings};
  color: ${colors.primary};
  margin: 12pt 0 4pt 0;
  
  /* Keep subsection titles with content */
  page-break-after: avoid;
  break-after: avoid-page;
}

/* === CONTENT BLOCKS === */
.cv-item {
  margin-bottom: 12pt;
  page-break-inside: avoid; /* Keep job entries together */
  break-inside: avoid-page;
}

.cv-item-header {
  margin-bottom: 4pt;
  page-break-after: avoid;
}

.cv-item-title {
  font-weight: ${typography.headingWeight};
  color: ${colors.primary};
  margin: 0;
}

.cv-item-subtitle {
  color: ${colors.muted};
  font-size: ${fontSize.base - 0.5}pt;
  margin: 0;
  font-style: italic;
}

.cv-item-meta {
  color: ${colors.muted};
  font-size: ${fontSize.base - 1}pt;
  margin: 2pt 0 0 0;
}

/* === LISTS === */
.cv-list {
  margin: 6pt 0;
  padding-left: 12pt;
  list-style: none;
}

.cv-list-item {
  margin-bottom: ${spacing.listItemGap}pt;
  position: relative;
  
  /* Prevent orphaned bullets */
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.cv-list-item::before {
  content: "•";
  position: absolute;
  left: -12pt;
  color: ${colors.accent};
  font-weight: bold;
}

/* === PARAGRAPHS === */
.cv-paragraph {
  margin-bottom: ${spacing.paragraphGap}pt;
  text-align: justify;
  
  /* Avoid single lines at page breaks */
  orphans: 2;
  widows: 2;
}

/* === SKILLS & COMPACT CONTENT === */
.cv-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6pt;
  margin: 6pt 0;
}

.cv-skill-tag {
  background: ${colors.accent}15;
  color: ${colors.accent};
  padding: 2pt 6pt;
  border-radius: 3pt;
  font-size: ${fontSize.base - 1}pt;
  font-weight: 500;
  
  /* Prevent skills from breaking awkwardly */
  page-break-inside: avoid;
  break-inside: avoid;
}

/* === SPECIAL HANDLING === */
.cv-summary {
  text-align: justify;
  margin-bottom: ${spacing.sectionGap}pt;
  font-size: ${fontSize.base}pt;
  line-height: ${lineHeight.body + 0.1};
}

/* Keep contact info together */
.cv-contact-group {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Ensure proper spacing between major sections */
.cv-section + .cv-section {
  margin-top: ${spacing.sectionGap + 4}pt;
}

/* === RESPONSIVE PRINT ADJUSTMENTS === */
@media print and (max-width: 210mm) {
  .cv-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
  
  .cv-skills {
    flex-direction: row;
    justify-content: flex-start;
  }
}

/* === ATS-FRIENDLY FALLBACKS === */
.cv-ats-friendly {
  font-family: "Arial", sans-serif !important;
  font-size: 11pt !important;
  line-height: 1.2 !important;
  color: #000000 !important;
}

.cv-ats-friendly .cv-skill-tag {
  background: none !important;
  color: inherit !important;
  padding: 0 !important;
  border: none !important;
}

.cv-ats-friendly .cv-section-title {
  border-bottom: none !important;
  text-transform: uppercase;
  font-weight: bold !important;
}
`
}

/**
 * Optimize content for page breaks
 */
export function optimizeForPrint(htmlContent: string): string {
  // Add strategic page-break hints
  return htmlContent
    // Keep job titles with companies
    .replace(/<h3([^>]*)>(.*?)<\/h3>\s*<p([^>]*)>(.*?)<\/p>/g,
      '<div class="cv-item-header"><h3$1>$2</h3><p$3>$4</p></div>')

    // Wrap experience entries to avoid orphans
    .replace(/(<h3[^>]*>.*?<\/h3>[\s\S]*?(?=<h3|<h2|$))/g,
      '<div class="cv-item">$1</div>')

    // Add classes for print optimization
    .replace(/<h1([^>]*)>/g, '<h1$1 class="cv-name">')
    .replace(/<h2([^>]*)>/g, '<h2$1 class="cv-section-title">')
    .replace(/<h3([^>]*)>/g, '<h3$1 class="cv-subsection-title">')
    .replace(/<ul([^>]*)>/g, '<ul$1 class="cv-list">')
    .replace(/<li([^>]*)>/g, '<li$1 class="cv-list-item">')
    .replace(/<p([^>]*)>/g, '<p$1 class="cv-paragraph">')
}

/**
 * Paper size configurations
 */
export const PAPER_SIZES = {
  A4: {
    width: '210mm',
    height: '297mm',
    name: 'A4 (210 × 297 mm)'
  },
  Letter: {
    width: '8.5in',
    height: '11in',
    name: 'US Letter (8.5 × 11 in)'
  }
} as const

/**
 * Generate complete print stylesheet
 */
export function generateFullPrintStylesheet(settings: PrintSettings): string {
  const css = generatePrintCSS(settings)
  const paperSize = PAPER_SIZES[settings.paperSize]

  return `
<!-- Print Optimized CV Stylesheet -->
<style type="text/css" media="all">
${css}

/* Page container for preview */
.cv-print-preview {
  width: ${paperSize.width};
  min-height: ${paperSize.height};
  margin: 20px auto;
  padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  position: relative;
}

@media screen {
  .cv-print-preview::after {
    content: "${paperSize.name}";
    position: absolute;
    top: -30px;
    left: 0;
    font-size: 12px;
    color: #666;
    font-family: system-ui;
  }
}
</style>
`
}