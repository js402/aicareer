'use client'

import { useCallback } from 'react'
import { useCVStore } from './useCVStore'
import { useLoadingState } from './useLoadingState'
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
  questions?: string[]
}

/**
 * Hook for CV-related operations (upload, extract, analyze)
 * Provides centralized business logic for CV processing
 */
export function useCVOperations() {
  const { setCV, setExtractedInfo, setAnalysis, appendSupplementalInfo, clear } = useCVStore()
  const loadingState = useLoadingState()

  // Extract CV metadata
  const extractMetadata = useCallback(
    async (cvContent: string) => {
      return loadingState.execute<ExtractMetadataResponse>(
        async () => {
          const response = await fetch('/api/extract-cv-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to extract metadata')
          }

          const result: ExtractMetadataResponse = await response.json()

          if (result.extractedInfo) {
            setExtractedInfo(result.extractedInfo)
          }

          return result
        },
        {
          errorMessage: 'Failed to process your CV'
        }
      )
    },
    [setExtractedInfo, loadingState]
  )

  // Analyze CV
  const analyzeCV = useCallback(
    async (cvContent: string) => {
      return loadingState.execute<AnalyzeCVResponse>(
        async () => {
          const response = await fetch('/api/analyze-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvContent })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to analyze CV')
          }

          const result: AnalyzeCVResponse = await response.json()

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
    [setAnalysis, loadingState]
  )

  // Load analysis from stored metadata
  const loadAnalysisFromMetadata = useCallback(
    async (cvHash: string, filename?: string) => {
      return loadingState.execute(
        async () => {
          const response = await fetch(`/api/retrieve-analysis?hash=${cvHash}`)

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Analysis content not found')
            }
            throw new Error('Failed to retrieve analysis')
          }

          const data = await response.json()

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
    [clear, setCV, setAnalysis, loadingState]
  )

  // Submit supplemental information
  const submitSupplementalInfo = useCallback(
    async (questions: string[], answers: string[], cvContent: string) => {
      return loadingState.execute(
        async () => {
          // Append to CV store
          appendSupplementalInfo(questions, answers)

          // Re-extract with updated content
          return extractMetadata(cvContent)
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
