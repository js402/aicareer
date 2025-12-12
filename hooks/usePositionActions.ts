'use client'

import { useCallback } from 'react'
import { useMutation } from './useFetch'
import { useLoadingState } from './useLoadingState'

export interface Position {
  id: string
  company_name: string
  position_title: string
  job_description: string
  job_url?: string
  location?: string
  salary_range?: string
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  recommendations: string[]
  experience_alignment?: any
  responsibility_alignment?: any
  employment_type?: string
  seniority_level?: string
  status: string
  notes?: string
  created_at: string
  cv_metadata_id?: string
}

export interface CreatePositionData {
  company_name: string
  position_title: string
  job_description: string
  location?: string
  salary_range?: string
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  recommendations: string[]
  experience_alignment?: any
  responsibility_alignment?: any
  employment_type?: string | null
  seniority_level?: string | null
  cv_metadata_id?: string
}

export interface UpdatePositionData {
  status?: string
  notes?: string
  applied_date?: string
}

/**
 * Hook for managing position CRUD operations
 * Provides centralized business logic for job positions
 */
export function usePositionActions(positionId?: string) {
  const loadingState = useLoadingState()

  // Create position mutation
  const { mutate: createMutate, isLoading: isCreating } = useMutation<
    CreatePositionData,
    Position
  >('/api/job-positions', 'POST')

  // Update position mutation
  const { mutate: updateMutate, isLoading: isUpdating } = useMutation<
    UpdatePositionData,
    Position
  >(`/api/job-positions/${positionId}`, 'PATCH')

  // Create position with loading state
  const createPosition = useCallback(
    async (data: CreatePositionData) => {
      return loadingState.execute(
        () => createMutate(data),
        {
          successMessage: 'Position created successfully!',
          errorMessage: 'Failed to create position'
        }
      )
    },
    [createMutate, loadingState]
  )

  // Update position status
  const updateStatus = useCallback(
    async (status: string) => {
      if (!positionId) {
        throw new Error('Position ID is required')
      }

      return loadingState.execute(
        () => updateMutate({ status }),
        {
          successMessage: 'Status updated successfully!',
          errorMessage: 'Failed to update status'
        }
      )
    },
    [positionId, updateMutate, loadingState]
  )

  // Update position notes
  const updateNotes = useCallback(
    async (notes: string) => {
      if (!positionId) {
        throw new Error('Position ID is required')
      }

      return loadingState.execute(
        () => updateMutate({ notes }),
        {
          successMessage: 'Notes saved successfully!',
          errorMessage: 'Failed to save notes'
        }
      )
    },
    [positionId, updateMutate, loadingState]
  )

  // Delete position
  const deletePosition = useCallback(async (overrideId?: string) => {
    const targetId = overrideId || positionId
    if (!targetId) {
      throw new Error('Position ID is required')
    }

    return loadingState.execute(
      async () => {
        const response = await fetch(`/api/job-positions/${targetId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete position')
        }

        return response.json()
      },
      {
        successMessage: 'Position deleted successfully!',
        errorMessage: 'Failed to delete position'
      }
    )
  }, [positionId, loadingState])

  // Generate tailored CV for position
  const generateTailoredCV = useCallback(
    async (cvContent: string, jobDescription: string, matchAnalysis: any) => {
      if (!positionId) {
        throw new Error('Position ID is required')
      }

      return loadingState.execute(
        async () => {
          // 1. Generate tailored content
          const tailorRes = await fetch('/api/tailor-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cvContent,
              jobDescription,
              matchAnalysis
            })
          })

          if (!tailorRes.ok) {
            const error = await tailorRes.json()
            throw new Error(error.error || 'Failed to generate tailored CV')
          }

          const { tailoredCV } = await tailorRes.json()

          // 2. Save tailored CV
          const saveRes = await fetch('/api/tailored-cvs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_position_id: positionId,
              cv_content: cvContent,
              tailored_content: tailoredCV
            })
          })

          if (!saveRes.ok) {
            throw new Error('Failed to save tailored CV')
          }

          return saveRes.json()
        },
        {
          successMessage: 'Tailored CV generated successfully!',
          errorMessage: 'Failed to generate tailored CV'
        }
      )
    },
    [positionId, loadingState]
  )

  return {
    createPosition,
    updateStatus,
    updateNotes,
    deletePosition,
    generateTailoredCV,
    isCreating,
    isUpdating,
    ...loadingState
  }
}
