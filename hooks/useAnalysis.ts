import { useMutation, type UseMutationOptions } from '@/hooks/useFetch'
import type { ExtractedCVInfo } from '@/lib/api-client'

export interface AnalyzeCVResponse {
    status: 'valid' | 'invalid' | 'incomplete' | 'cached'
    message?: string
    analysis?: string
    questions?: string[]
    extractedInfo?: ExtractedCVInfo
}

export interface AnalyzeCVPayload {
    cvContent?: string
    extractedInfo?: ExtractedCVInfo
}

export function useAnalyzeCV(options?: UseMutationOptions<AnalyzeCVPayload, AnalyzeCVResponse>) {
    return useMutation<AnalyzeCVPayload, AnalyzeCVResponse>(
        '/api/analyze-cv',
        'POST',
        options
    )
}

export interface ExtractMetadataResponse {
    status: 'valid' | 'invalid' | 'incomplete' | 'cached'
    message?: string
    extractedInfo?: ExtractedCVInfo
    metadataId?: string
    questions?: string[]
}

export interface ExtractMetadataPayload {
    cvContent: string
}

export function useExtractMetadata(options?: UseMutationOptions<ExtractMetadataPayload, ExtractMetadataResponse>) {
    return useMutation<ExtractMetadataPayload, ExtractMetadataResponse>(
        '/api/extract-cv-metadata',
        'POST',
        options
    )
}

export interface RetrieveAnalysisResponse {
    cvContent: string
    analysis: string
    extractedInfo?: ExtractedCVInfo
}

import { useAsyncAction } from '@/hooks/useFetch'

export function useRetrieveAnalysis() {
    return useAsyncAction(async (hash: string) => {
        const res = await fetch(`/api/retrieve-analysis?hash=${hash}`)
        if (!res.ok) {
            throw new Error('Analysis content not found')
        }
        return res.json() as Promise<RetrieveAnalysisResponse>
    })
}
