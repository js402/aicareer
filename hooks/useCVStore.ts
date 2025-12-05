import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExtractedCVInfo } from '@/lib/api-client'

interface CVStore {
    content: string
    filename: string
    analysis: string
    guidance: Record<string, unknown> | null
    jobDescription: string
    extractedInfo: ExtractedCVInfo | null
    setCV: (content: string, filename: string) => void
    setAnalysis: (analysis: string) => void
    setGuidance: (guidance: Record<string, unknown>) => void
    setJobDescription: (jobDescription: string) => void
    setExtractedInfo: (extractedInfo: ExtractedCVInfo) => void
    clear: () => void
}

export const useCVStore = create<CVStore>()(
    persist(
        (set) => ({
            content: '',
            filename: '',
            analysis: '',
            guidance: null,
            jobDescription: '',
            extractedInfo: null,
            setCV: (content, filename) => set({ content, filename, analysis: '', guidance: null, extractedInfo: null }),
            setAnalysis: (analysis) => set({ analysis }),
            setGuidance: (guidance) => set({ guidance }),
            setJobDescription: (jobDescription) => set({ jobDescription }),
            setExtractedInfo: (extractedInfo) => set({ extractedInfo }),
            clear: () => set({ content: '', filename: '', analysis: '', guidance: null, jobDescription: '', extractedInfo: null }),
        }),
        {
            name: 'cv-storage',
        }
    )
)
