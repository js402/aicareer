import { useState, useEffect } from 'react'

export type FontPreset = 'ultra-compact' | 'compact' | 'standard' | 'large'
export type MarginPreset = 'minimal' | 'tight' | 'normal' | 'comfortable'
export type SectionSpacing = 'minimal' | 'tight' | 'normal' | 'relaxed'

export interface CVPrintSettings {
    fontPreset: FontPreset
    marginPreset: MarginPreset
    lineHeight: number
    sectionSpacing: SectionSpacing
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
}

const FONT_PRESETS: Record<FontPreset, { h1: string; h2: string; h3: string; body: string }> = {
    'ultra-compact': { h1: '14pt', h2: '10pt', h3: '9pt', body: '8pt' },
    compact: { h1: '16pt', h2: '11pt', h3: '9.5pt', body: '9pt' },
    standard: { h1: '18pt', h2: '12pt', h3: '10pt', body: '10pt' },
    large: { h1: '20pt', h2: '14pt', h3: '11pt', body: '11pt' }
}

const MARGIN_PRESETS: Record<MarginPreset, { page: string; content: string }> = {
    minimal: { page: '0.5cm', content: '6mm' },
    tight: { page: '0.75cm', content: '8mm' },
    normal: { page: '1cm', content: '12mm' },
    comfortable: { page: '1.5cm', content: '16mm' }
}

const SECTION_SPACING: Record<SectionSpacing, { h2Top: string; h3Top: string; pBottom: string; liBottom: string }> = {
    minimal: { h2Top: '0.5em', h3Top: '0.3em', pBottom: '0.2em', liBottom: '0.1em' },
    tight: { h2Top: '0.7em', h3Top: '0.4em', pBottom: '0.3em', liBottom: '0.15em' },
    normal: { h2Top: '1em', h3Top: '0.6em', pBottom: '0.5em', liBottom: '0.25em' },
    relaxed: { h2Top: '1.3em', h3Top: '0.8em', pBottom: '0.7em', liBottom: '0.35em' }
}

const DEFAULT_SETTINGS: CVPrintSettings = {
    fontPreset: 'compact',
    marginPreset: 'tight',
    lineHeight: 1.25,
    sectionSpacing: 'tight'
}

const STORAGE_KEY = 'cv-print-settings'

export function useCVPrintSettings() {
    const [settings, setSettings] = useState<CVPrintSettings>(DEFAULT_SETTINGS)
    const [isInitialized, setIsInitialized] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                setSettings({ ...DEFAULT_SETTINGS, ...parsed })
            }
        } catch (error) {
            console.error('Failed to load CV print settings:', error)
        } finally {
            setIsInitialized(true)
        }
    }, [])

    // Save settings to localStorage whenever they change
    const updateSettings = (newSettings: Partial<CVPrintSettings>) => {
        const updated = { ...settings, ...newSettings }
        setSettings(updated)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Failed to save CV print settings:', error)
        }
    }

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS)
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
            console.error('Failed to reset CV print settings:', error)
        }
    }

    const computeStyles = (): ComputedStyles => {
        const fonts = FONT_PRESETS[settings.fontPreset]
        const margins = MARGIN_PRESETS[settings.marginPreset]
        const spacing = SECTION_SPACING[settings.sectionSpacing]

        return {
            h1Size: fonts.h1,
            h2Size: fonts.h2,
            h3Size: fonts.h3,
            bodySize: fonts.body,
            pageMargin: margins.page,
            contentPadding: margins.content,
            lineHeight: settings.lineHeight,
            h2MarginTop: spacing.h2Top,
            h3MarginTop: spacing.h3Top,
            pMarginBottom: spacing.pBottom,
            liMarginBottom: spacing.liBottom
        }
    }

    const generateCSS = (): string => {
        const styles = computeStyles()

        return `
            @page {
                margin: ${styles.pageMargin};
                size: A4;
            }
            
            body { 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: ${styles.lineHeight}; 
                color: #1a1a1a;
                font-size: ${styles.bodySize};
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                padding: ${styles.contentPadding};
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
            }
            
            * { 
                box-sizing: border-box; 
                margin: 0;
                padding: 0;
            }
            
            /* Centered Header */
            h1 { 
                font-size: ${styles.h1Size}; 
                font-weight: 700; 
                margin-bottom: 0.2em;
                margin-top: 0;
                color: #111;
                text-align: center;
                letter-spacing: -0.02em;
                line-height: 1.1;
            }
            
            /* Contact info - centered right after name */
            h1 + p {
                text-align: center;
                color: #444;
                font-size: calc(${styles.bodySize} * 0.95);
                margin-bottom: 0.6em;
                line-height: 1.3;
            }
            
            /* Section headers */
            h2 { 
                font-size: ${styles.h2Size}; 
                font-weight: 700; 
                margin-top: ${styles.h2MarginTop}; 
                margin-bottom: 0.3em; 
                color: #111;
                letter-spacing: 0.03em;
                line-height: 1.2;
                text-transform: uppercase;
                border-bottom: 1.5px solid #333;
                padding-bottom: 0.15em;
            }
            
            /* Sub-headers (job titles, degrees) */
            h3 { 
                font-size: ${styles.h3Size}; 
                font-weight: 600; 
                margin-top: ${styles.h3MarginTop}; 
                margin-bottom: 0.15em; 
                color: #222;
                line-height: 1.25;
            }
            
            /* Body paragraphs */
            p { 
                margin-bottom: ${styles.pMarginBottom}; 
                text-align: left;
                color: #333;
                orphans: 2;
                widows: 2;
            }
            
            /* Bullet lists */
            ul { 
                list-style-type: none;
                padding-left: 0;
                margin: 0.2em 0 0.4em 0;
            }
            
            li { 
                margin-bottom: ${styles.liMarginBottom}; 
                padding-left: 1em;
                position: relative;
                color: #333;
                text-indent: -0.6em;
            }
            
            li::before {
                content: "•";
                position: absolute;
                left: 0;
                color: #555;
                font-size: 0.9em;
            }
            
            /* Strong text for job titles inline */
            strong, b {
                font-weight: 600;
                color: #111;
            }
            
            /* Italic for dates/duration */
            em, i {
                font-style: italic;
                color: #555;
            }
            
            /* Links */
            a {
                color: #0066cc;
                text-decoration: none;
            }
            
            a:hover {
                text-decoration: underline;
            }
            
            /* Horizontal rules - subtle */
            hr {
                display: none;
            }
            
            /* Skills section - inline */
            h2 + p strong {
                font-weight: 500;
            }
            
            /* Code/technical terms */
            code {
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 0.9em;
                background: #f5f5f5;
                padding: 0.1em 0.3em;
                border-radius: 2px;
            }
            
            /* Tables if present */
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.4em 0;
                font-size: 0.95em;
            }
            
            th, td {
                border: 1px solid #ddd;
                padding: 0.3em 0.5em;
                text-align: left;
            }
            
            th {
                background: #f5f5f5;
                font-weight: 600;
            }
            
            /* Print optimizations */
            @media print {
                body { 
                    padding: 0; 
                    margin: 0;
                    width: 100%;
                    background: white !important;
                }
                
                h1, h2, h3 {
                    page-break-after: avoid;
                }
                
                li, p {
                    page-break-inside: avoid;
                }
                
                a {
                    color: #111;
                }
                
                * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    }

    return {
        settings,
        updateSettings,
        resetSettings,
        computeStyles,
        generateCSS,
        isInitialized
    }
}