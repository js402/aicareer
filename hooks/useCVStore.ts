import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CVStore {
    content: string
    filename: string
    analysis: string
    guidance: Record<string, unknown> | null
    jobDescription: string
    setCV: (content: string, filename: string) => void
    setAnalysis: (analysis: string) => void
    setGuidance: (guidance: Record<string, unknown>) => void
    setJobDescription: (jobDescription: string) => void
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
            setCV: (content, filename) => set({ content, filename, analysis: '', guidance: null }),
            setAnalysis: (analysis) => set({ analysis }),
            setGuidance: (guidance) => set({ guidance }),
            setJobDescription: (jobDescription) => set({ jobDescription }),
            clear: () => set({ content: '', filename: '', analysis: '', guidance: null, jobDescription: '' }),
        }),
        {
            name: 'cv-storage',
        }
    )
)
