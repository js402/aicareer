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
    metadataId: string | null
    setCV: (content: string, filename: string) => void
    setAnalysis: (analysis: string) => void
    setGuidance: (guidance: Record<string, unknown>) => void
    setJobDescription: (jobDescription: string) => void
    setExtractedInfo: (extractedInfo: ExtractedCVInfo, metadataId?: string) => void
    updateExtractedInfo: (extractedInfo: ExtractedCVInfo) => void
    setSyncedCV: (metadataId: string) => void
    appendSupplementalInfo: (questions: string[], answers: string[]) => void
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
            metadataId: null,
            setCV: (content, filename) => set({ content, filename, analysis: '', guidance: null, extractedInfo: null, metadataId: null }),
            setAnalysis: (analysis) => set({ analysis }),
            setGuidance: (guidance) => set({ guidance }),
            setJobDescription: (jobDescription) => set({ jobDescription }),
            setExtractedInfo: (extractedInfo, metadataId) => set({ extractedInfo, ...(metadataId && { metadataId }) }),
            setSyncedCV: (metadataId) => set((state) => ({
                metadataId,
                content: '', // Clear raw content as it's now in DB
                analysis: '', // Clear old analysis
            })),
            updateExtractedInfo: (extractedInfo) => set((state) => ({
                extractedInfo,
                // Clear analysis when CV data changes significantly
                analysis: ''
            })),
            appendSupplementalInfo: (questions, answers) => set((state) => {
                const additionalContext = `\n\nADDITIONAL USER CONTEXT:\n${answers.map((a, i) => `Q: ${questions[i]}\nA: ${a}`).join('\n')}`
                return {
                    content: state.content + additionalContext,
                    // Clear analysis since CV content has changed
                    analysis: ''
                }
            }),
            clear: () => set({ content: '', filename: '', analysis: '', guidance: null, jobDescription: '', extractedInfo: null, metadataId: null }),
        }),
        {
            name: 'cv-storage',
            partialize: (state) => {
                // If we have a metadataId (synced to DB), don't persist heavy content
                if (state.metadataId) {
                    return {
                        filename: state.filename,
                        metadataId: state.metadataId,
                        // Keep other small UI state if needed, but drop content/analysis
                    } as any
                }
                return state
            }
        }
    )
)
