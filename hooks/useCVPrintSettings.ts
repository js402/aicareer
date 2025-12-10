import { useState, useEffect } from 'react'

export type FontPreset = 'compact' | 'standard' | 'large'
export type MarginPreset = 'tight' | 'normal' | 'comfortable'
export type SectionSpacing = 'tight' | 'normal' | 'relaxed'

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
    compact: { h1: '18pt', h2: '12pt', h3: '10pt', body: '9pt' },
    standard: { h1: '20pt', h2: '14pt', h3: '11pt', body: '10pt' },
    large: { h1: '24pt', h2: '16pt', h3: '13pt', body: '11pt' }
}

const MARGIN_PRESETS: Record<MarginPreset, { page: string; content: string }> = {
    tight: { page: '1cm', content: '10mm' },
    normal: { page: '1.5cm', content: '15mm' },
    comfortable: { page: '2cm', content: '20mm' }
}

const SECTION_SPACING: Record<SectionSpacing, { h2Top: string; h3Top: string; pBottom: string; liBottom: string }> = {
    tight: { h2Top: '1em', h3Top: '0.8em', pBottom: '0.5em', liBottom: '0.2em' },
    normal: { h2Top: '1.5em', h3Top: '1.2em', pBottom: '0.8em', liBottom: '0.4em' },
    relaxed: { h2Top: '2em', h3Top: '1.5em', pBottom: '1em', liBottom: '0.5em' }
}

const DEFAULT_SETTINGS: CVPrintSettings = {
    fontPreset: 'compact',
    marginPreset: 'tight',
    lineHeight: 1.4,
    sectionSpacing: 'normal'
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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                line-height: ${styles.lineHeight}; 
                color: #1a1a1a;
                font-size: ${styles.bodySize};
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                padding: ${styles.contentPadding};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
            }
            
            * { 
                box-sizing: border-box; 
                margin: 0;
                padding: 0;
            }
            
            /* Modern Header Styling */
            h1 { 
                font-size: ${styles.h1Size}; 
                font-weight: 700; 
                margin-bottom: 0.4em;
                margin-top: 0;
                color: #0f172a;
                letter-spacing: -0.02em;
                line-height: 1.2;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 0.4em;
                page-break-after: avoid;
            }
            
            h2 { 
                font-size: ${styles.h2Size}; 
                font-weight: 700; 
                margin-top: ${styles.h2MarginTop}; 
                margin-bottom: 0.5em; 
                color: #1e293b;
                letter-spacing: -0.01em;
                line-height: 1.3;
                text-transform: uppercase;
                border-left: 4px solid #3b82f6;
                padding-left: 0.6em;
                background: linear-gradient(to right, #f8fafc 0%, transparent 100%);
                padding-top: 0.3em;
                padding-bottom: 0.3em;
                page-break-after: avoid;
            }
            
            h3 { 
                font-size: ${styles.h3Size}; 
                font-weight: 600; 
                margin-top: ${styles.h3MarginTop}; 
                margin-bottom: 0.3em; 
                color: #334155;
                letter-spacing: -0.01em;
                line-height: 1.4;
                page-break-after: avoid;
            }
            
            h4 {
                font-size: calc(${styles.bodySize} * 1.1);
                font-weight: 600;
                margin-top: 0.8em;
                margin-bottom: 0.3em;
                color: #475569;
                page-break-after: avoid;
            }
            
            /* Paragraph and Text */
            p { 
                margin-bottom: ${styles.pMarginBottom}; 
                text-align: justify;
                text-justify: inter-word;
                color: #334155;
                orphans: 3;
                widows: 3;
                hyphens: auto;
            }
            
            /* Lists */
            ul { 
                list-style-type: none;
                padding-left: 0;
                margin-bottom: 0.8em; 
            }
            
            li { 
                margin-bottom: ${styles.liMarginBottom}; 
                padding-left: 1.5em;
                position: relative;
                color: #334155;
            }
            
            li::before {
                content: "▸";
                position: absolute;
                left: 0;
                color: #3b82f6;
                font-weight: bold;
                font-size: 0.9em;
            }
            
            /* Nested lists */
            ul ul {
                margin-top: 0.3em;
                margin-left: 1em;
            }
            
            ul ul li::before {
                content: "•";
                color: #64748b;
            }
            
            /* Emphasis */
            strong, b {
                font-weight: 600;
                color: #0f172a;
            }
            
            em, i {
                font-style: italic;
                color: #475569;
            }
            
            /* Links */
            a {
                color: #3b82f6;
                text-decoration: none;
                border-bottom: 1px solid #93c5fd;
                transition: border-color 0.2s;
                padding-bottom: 0.1em;
            }
            
            a:hover {
                border-bottom-color: #3b82f6;
            }
            
            /* Tables */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1em;
                font-size: 0.95em;
                page-break-inside: avoid;
            }
            
            th, td {
                border: 1px solid #e2e8f0;
                padding: 0.5em 0.75em;
                text-align: left;
                vertical-align: top;
            }
            
            th {
                background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
                font-weight: 600;
                color: #1e293b;
                border-bottom: 2px solid #cbd5e1;
            }
            
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            
            /* Blockquotes */
            blockquote {
                border-left: 4px solid #3b82f6;
                margin: 0 0 1em 0;
                padding: 0.75em 1em;
                background-color: #f8fafc;
                color: #475569;
                font-style: italic;
                border-radius: 0 4px 4px 0;
                page-break-inside: avoid;
            }
            
            /* Code blocks */
            pre {
                background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
                padding: 1em;
                border-radius: 6px;
                overflow-x: auto;
                margin-bottom: 1em;
                border: 1px solid #e2e8f0;
                font-size: 0.85em;
                page-break-inside: avoid;
            }
            
            code {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;
                background-color: #f1f5f9;
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-size: 0.9em;
                color: #0f172a;
                border: 1px solid #e2e8f0;
            }
            
            pre code {
                background-color: transparent;
                padding: 0;
                border: none;
            }
            
            /* Horizontal rules */
            hr {
                border: none;
                border-top: 2px solid #e2e8f0;
                margin: 1.5em 0;
            }
            
            /* Contact info styling (often at top of CV) */
            h1 + p {
                color: #64748b;
                font-size: 0.95em;
                margin-top: -0.2em;
                margin-bottom: 1em;
            }
            
            /* Date ranges and metadata */
            h3 + p em,
            h3 + em {
                color: #64748b;
                font-size: 0.9em;
                font-style: normal;
                display: block;
                margin-top: -0.3em;
            }
            
            /* Section containers for better page breaks */
            .section-container {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            /* Print-specific styles */
            @media print {
                body { 
                    padding: 0; 
                    margin: 0;
                    width: 100%;
                    color: #000;
                    background: white !important;
                }
                
                @page {
                    margin: ${styles.pageMargin};
                }
                
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                    break-after: avoid;
                }
                
                p, li, blockquote, pre, table {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                
                ul, ol {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                
                a {
                    color: #1e293b;
                    border-bottom: none;
                    text-decoration: underline;
                }
                
                /* Ensure colors print */
                * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    color-adjust: exact;
                }
                
                /* Remove shadows and backgrounds that don't print well */
                .no-print {
                    display: none !important;
                }
                
                /* Force background colors to print */
                th, tr:nth-child(even), blockquote, pre {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
            
            /* Screen-only styles */
            @media screen {
                body {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    border-radius: 8px;
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