
export type FontPreset = 'ultra-compact' | 'compact' | 'standard' | 'large'
export type MarginPreset = 'minimal' | 'tight' | 'normal' | 'comfortable'
export type SectionSpacing = 'minimal' | 'tight' | 'normal' | 'relaxed'
export type DesignTemplate = 'modern' | 'classic' | 'minimal'
export type PaperSize = 'A4' | 'Letter'
export type HeaderAlign = 'left' | 'center' | 'right'

export const PRINT_COLOR_PALETTE = [
    { name: 'Black', value: '#000000', class: 'bg-black' },
    { name: 'Navy', value: '#1e3a8a', class: 'bg-blue-900' },
    { name: 'Slate', value: '#475569', class: 'bg-slate-600' },
    { name: 'Teal', value: '#0f766e', class: 'bg-teal-700' },
    { name: 'Burgundy', value: '#7f1d1d', class: 'bg-red-900' },
]

export interface CVPrintSettings {
    design: DesignTemplate
    fontPreset: FontPreset
    marginPreset: MarginPreset
    lineHeight: number
    sectionSpacing: SectionSpacing
    accentColor: string
    paperSize: PaperSize
    headerAlign: HeaderAlign
}

export interface ComputedStyles {
    h1Size: string
    h2Size: string
    h3Size: string
    bodySize: string
    pageMargin: string
    contentPadding: string
    lineHeight: number
    h2MarginTop: string
    h3MarginTop: string
    pMarginBottom: string
    liMarginBottom: string
    // Pass through new settings for convenience
    accentColor: string
    paperSize: PaperSize
    headerAlign: HeaderAlign
}

export const TEMPLATES: Record<DesignTemplate, { name: string; description: string; generateCSS: (styles: ComputedStyles, selectorPrefix?: string) => string }> = {
    modern: {
        name: 'Modern',
        description: 'Clean, sans-serif design with strong hierarchy',
        generateCSS: (styles, selectorPrefix = '') => {
            const p = selectorPrefix ? `${selectorPrefix} ` : ''
            const root = selectorPrefix || 'body'

            return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            ${!selectorPrefix ? `
            @page {
                margin: ${styles.pageMargin};
                size: ${styles.paperSize};
            }
            ` : ''}
            
            ${root} { 
                font-family: 'Inter', Helvetica, Arial, sans-serif;
                line-height: ${styles.lineHeight}; 
                color: #1a1a1a;
                font-size: ${styles.bodySize};
                ${!selectorPrefix ? `
                max-width: ${styles.paperSize === 'A4' ? '210mm' : '216mm'};
                margin: 0 auto;
                background: white;
                ` : ''}
                padding: ${styles.contentPadding};
                -webkit-font-smoothing: antialiased;
            }

            ${p}h1 {
                font-size: ${styles.h1Size} !important;
                font-weight: 700;
                letter-spacing: -0.03em;
                color: ${styles.accentColor};
                margin-bottom: 0.2em !important;
                margin-top: 0 !important;
                line-height: 1.1;
                text-align: ${styles.headerAlign};
            }

            /* Contact info */
            ${p}h1 + p {
                text-align: ${styles.headerAlign};
                color: #555 !important;
                font-size: 0.9em !important;
                margin-bottom: 2em !important;
            }

            ${p}h2 {
                font-size: ${styles.h2Size} !important;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${styles.accentColor};
                border-bottom: 2px solid ${styles.accentColor};
                opacity: 0.9;
                padding-bottom: 0.2em;
                margin-top: ${styles.h2MarginTop} !important;
                margin-bottom: 0.5em !important;
            }

            ${p}h3 {
                font-size: ${styles.h3Size} !important;
                font-weight: 600;
                color: #000;
                margin-top: ${styles.h3MarginTop} !important;
                margin-bottom: 0.2em !important;
            }

            ${p}p {
                margin-bottom: ${styles.pMarginBottom} !important;
                margin-top: 0 !important;
                color: #333;
            }

            ${p}ul {
                list-style: none !important;
                padding: 0 !important;
                margin: 0.2em 0 0.5em 0 !important;
            }

            ${p}li {
                position: relative;
                padding-left: 1.2em !important;
                margin-bottom: ${styles.liMarginBottom} !important;
            }

            ${p}li::before {
                content: "•";
                position: absolute;
                left: 0;
                color: ${styles.accentColor};
            }

            ${p}strong { font-weight: 600; color: #000; }
            ${p}a { color: ${styles.accentColor}; text-decoration: underline; text-underline-offset: 2px; }

            /* Print Optimizations */
            @media print {
                ${p}h1, ${p}h2, ${p}h3 { page-break-after: avoid; break-after: avoid; }
                ${p}li { page-break-inside: avoid; break-inside: avoid; }
                ${p}p { orphans: 3; widows: 3; }
            }
        `},
    },
    classic: {
        name: 'Classic',
        description: 'Traditional serif typography, elegant and academic',
        generateCSS: (styles, selectorPrefix = '') => {
            const p = selectorPrefix ? `${selectorPrefix} ` : ''
            const root = selectorPrefix || 'body'

            return `
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&display=swap');

            ${!selectorPrefix ? `
            @page {
                margin: ${styles.pageMargin};
                size: ${styles.paperSize};
            }
            ` : ''}

            ${root} { 
                font-family: 'Merriweather', Georgia, serif;
                line-height: ${styles.lineHeight}; 
                color: #222;
                font-size: ${styles.bodySize};
                ${!selectorPrefix ? `
                max-width: ${styles.paperSize === 'A4' ? '210mm' : '216mm'};
                margin: 0 auto;
                background: white;
                ` : ''}
                padding: ${styles.contentPadding};
            }

            ${p}h1 {
                font-family: 'Merriweather', Georgia, serif;
                font-size: ${styles.h1Size} !important;
                font-weight: 700;
                color: ${styles.accentColor};
                text-align: ${styles.headerAlign};
                margin-bottom: 0.3em !important;
                margin-top: 0 !important;
            }

            ${p}h1 + p {
                text-align: ${styles.headerAlign};
                font-style: italic;
                color: #444 !important;
                margin-bottom: 2em !important;
                border-bottom: 1px solid #ddd;
                padding-bottom: 1em;
            }

            ${p}h2 {
                font-family: 'Merriweather', Georgia, serif;
                font-size: ${styles.h2Size} !important;
                font-weight: 700;
                color: ${styles.accentColor};
                margin-top: ${styles.h2MarginTop} !important;
                margin-bottom: 0.4em !important;
                border-bottom: 1px solid ${styles.accentColor};
                opacity: 0.9;
            }

            ${p}h3 {
                font-size: ${styles.h3Size} !important;
                font-weight: 700;
                color: #222;
                margin-top: ${styles.h3MarginTop} !important;
                margin-bottom: 0.2em !important;
            }

            ${p}p { 
                margin-bottom: ${styles.pMarginBottom} !important; 
                margin-top: 0 !important;
            }

            ${p}ul {
                padding-left: 1.5em !important;
                margin: 0.2em 0 0.5em 0 !important;
            }

            ${p}li {
                margin-bottom: ${styles.liMarginBottom} !important;
                list-style-type: disc !important;
            }
            
            ${p}li::marker {
                color: ${styles.accentColor};
            }

            ${p}a { color: ${styles.accentColor}; text-decoration: none; }
            ${p}a:hover { text-decoration: underline; }

            /* Print Optimizations */
            @media print {
                ${p}h1, ${p}h2, ${p}h3 { page-break-after: avoid; break-after: avoid; }
                ${p}li { page-break-inside: avoid; break-inside: avoid; }
                ${p}p { orphans: 3; widows: 3; }
            }
        `},
    },
    minimal: {
        name: 'Minimal',
        description: 'High whitespace, mono-spaced details, very clean',
        generateCSS: (styles, selectorPrefix = '') => {
            const p = selectorPrefix ? `${selectorPrefix} ` : ''
            const root = selectorPrefix || 'body'

            return `
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap');

            ${!selectorPrefix ? `
            @page {
                margin: ${styles.pageMargin};
                size: ${styles.paperSize};
            }
            ` : ''}

            ${root} { 
                font-family: 'Roboto', sans-serif;
                line-height: 1.6; 
                color: #333;
                font-size: ${styles.bodySize};
                ${!selectorPrefix ? `
                max-width: ${styles.paperSize === 'A4' ? '210mm' : '216mm'};
                margin: 0 auto;
                background: white;
                ` : ''}
                padding: ${styles.contentPadding};
            }

            ${p}h1 {
                font-family: 'Roboto Mono', monospace;
                font-size: ${styles.h1Size} !important;
                font-weight: 400;
                letter-spacing: -0.05em;
                margin-bottom: 0.1em !important;
                margin-top: 0 !important;
                color: ${styles.accentColor};
                text-align: ${styles.headerAlign};
            }

            ${p}h1 + p {
                font-family: 'Roboto Mono', monospace;
                font-size: 0.85em !important;
                color: #666 !important;
                margin-bottom: 3em !important;
                border-bottom: 1px dotted #ccc;
                padding-bottom: 2em;
                text-align: ${styles.headerAlign};
            }

            ${p}h2 {
                font-family: 'Roboto Mono', monospace;
                font-size: 0.9em !important;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #888;
                margin-top: ${styles.h2MarginTop} !important;
                margin-bottom: 1em !important;
                border-bottom: 1px solid #eee;
                padding-bottom: 0.5em;
            }

            ${p}h3 {
                font-size: ${styles.h3Size} !important;
                font-weight: 500;
                margin-top: ${styles.h3MarginTop} !important;
                margin-bottom: 0.2em !important;
                color: #000;
            }

            ${p}p { 
                margin-bottom: ${styles.pMarginBottom} !important; 
                font-weight: 300; 
                margin-top: 0 !important;
            }

            ${p}ul { list-style: none !important; padding: 0 !important; margin: 0.5em 0 !important; }
            
            ${p}li {
                margin-bottom: ${styles.liMarginBottom} !important;
                padding-left: 0 !important;
            }
            
            ${p}li::before { display: none; }

            ${p}strong { font-weight: 500; color: #000; }
            ${p}a { color: ${styles.accentColor}; text-decoration: none; border-bottom: 1px dotted #999; }

            /* Print Optimizations */
            @media print {
                ${p}h1, ${p}h2, ${p}h3 { page-break-after: avoid; break-after: avoid; }
                ${p}li { page-break-inside: avoid; break-inside: avoid; }
                ${p}p { orphans: 3; widows: 3; }
            }
        `},
    }
}
