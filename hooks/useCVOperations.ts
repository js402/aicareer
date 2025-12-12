import { useCallback } from 'react'
import { useCVStore } from './useCVStore'
import { useLoadingState } from './useLoadingState'
import { useAnalyzeCV, useExtractMetadata, useRetrieveAnalysis } from './useAnalysis'
import type { ExtractedCVInfo } from '@/lib/api-client'

export interface AnalyzeCVResponse {
  status: 'valid' | 'invalid' | 'incomplete' | 'cached'
  message?: string
  analysis?: string
  questions?: string[]
  extractedInfo?: ExtractedCVInfo
}

export interface ExtractMetadataResponse {
  status: 'valid' | 'invalid' | 'incomplete' | 'cached'
  message?: string
  extractedInfo?: ExtractedCVInfo
  metadataId?: string
  questions?: string[]
}

/**
 * Hook for CV-related operations (upload, extract, analyze)
 * Provides centralized business logic for CV processing
 */
export function useCVOperations() {
  const { setCV, setExtractedInfo, setAnalysis, appendSupplementalInfo, clear } = useCVStore()
  const loadingState = useLoadingState()

  // New hooks
  const { mutate: extractMutate } = useExtractMetadata()
  const { mutate: analyzeMutate } = useAnalyzeCV()
  const { mutate: retrieveMutate } = useRetrieveAnalysis()

  // Extract CV metadata
  const extractMetadata = useCallback(
    async (cvContent: string) => {
      // Use existing loadingState wrapper for consistent error messages/loading flags
      return loadingState.execute<ExtractMetadataResponse>(
        async () => {
          const result = await extractMutate({ cvContent })

          if (result.extractedInfo) {
            setExtractedInfo(result.extractedInfo, result.metadataId)
          }

          return result
        },
        { errorMessage: 'Failed to process your CV' }
      )
    },
    [setExtractedInfo, loadingState, extractMutate]
  )

  // Analyze CV - accepts either raw content or extracted info
  const analyzeCV = useCallback(
    async (cvContent?: string, extractedInfo?: ExtractedCVInfo) => {
      return loadingState.execute<AnalyzeCVResponse>(
        async () => {
          const result = await analyzeMutate({ cvContent, extractedInfo })

          if (result.analysis) {
            setAnalysis(result.analysis)
          }

          return result
        },
        {
          successMessage: 'CV analyzed successfully!',
          errorMessage: 'Failed to analyze CV'
        }
      )
    },
    [setAnalysis, loadingState, analyzeMutate]
  )

  // Load analysis from stored metadata
  const loadAnalysisFromMetadata = useCallback(
    async (cvHash: string, filename?: string) => {
      return loadingState.execute(
        async () => {
          const data = await retrieveMutate(cvHash)

          // Populate store
          clear()
          setCV(data.cvContent, filename || 'Stored CV')
          if (data.analysis) {
            setAnalysis(data.analysis)
          }

          return data
        },
        {
          successMessage: 'Analysis loaded successfully!',
          errorMessage: 'Failed to load analysis'
        }
      )
    },
    [clear, setCV, setAnalysis, loadingState, retrieveMutate]
  )

  // Submit supplemental information
  const submitSupplementalInfo = useCallback(
    async (questions: string[], answers: string[], cvContent: string) => {
      return loadingState.execute(
        async () => {
          // Append to CV store
          appendSupplementalInfo(questions, answers)

          // Re-extract with updated content
          // The updated content is in the store, but we need to pass the *merged* content.
          // The appendSupplementalInfo updater modifies the store, but effectively we need to construct the new string here or
          // rely on the store being updated. Since state updates are sync in react event loop usually but here via zustand...
          // Zustand set is sync.
          // BUT, we are passing `cvContent` argument which is the OLD content.
          // We need to construct the new content manually to pass to extractMetadata.

          const additionalContext = `\n\nADDITIONAL USER CONTEXT:\n${answers.map((a, i) => `Q: ${questions[i]}\nA: ${a}`).join('\n')}`
          const newContent = cvContent + additionalContext

          return extractMetadata(newContent)
        },
        {
          successMessage: 'Supplemental information processed!',
          errorMessage: 'Failed to process supplemental information'
        }
      )
    },
    [appendSupplementalInfo, extractMetadata, loadingState]
  )

  return {
    extractMetadata,
    analyzeCV,
    loadAnalysisFromMetadata,
    submitSupplementalInfo,
    ...loadingState
  }
}
