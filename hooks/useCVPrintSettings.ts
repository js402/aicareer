import { useState, useEffect } from 'react'
import {
    type CVPrintSettings,
    type ComputedStyles,
    type FontPreset,
    type MarginPreset,
    type SectionSpacing,
    TEMPLATES
} from '@/lib/cv-print-templates'

// Re-export types for consumers
export type { CVPrintSettings, ComputedStyles, FontPreset, MarginPreset, SectionSpacing }

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
    design: 'modern',
    fontPreset: 'compact',
    marginPreset: 'tight',
    lineHeight: 1.25,
    sectionSpacing: 'tight',
    accentColor: '#000000',
    paperSize: 'A4',
    headerAlign: 'center'
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
                // Ensure new fields exist in parsed settings (migration support)
                const merged = { ...DEFAULT_SETTINGS, ...parsed }
                setSettings(merged)
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
            liMarginBottom: spacing.liBottom,
            accentColor: settings.accentColor || '#000000',
            paperSize: settings.paperSize || 'A4',
            headerAlign: settings.headerAlign || 'center'
        }
    }

    const generateCSS = (selectorPrefix?: string): string => {
        const styles = computeStyles()
        const template = TEMPLATES[settings.design] || TEMPLATES.modern
        return template.generateCSS(styles, selectorPrefix)
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