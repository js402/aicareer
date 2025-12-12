import { useMutation, type UseMutationOptions } from '@/hooks/useFetch'

export interface JobMatchResult {
    matchScore: number
    matchingSkills: string[]
    missingSkills: string[]
    recommendations: string[]
    experienceAlignment: any
    responsibilityAlignment: any
    metadata: {
        company_name: string
        position_title: string
        location: string
        salary_range: string
        employment_type: string | null
        seniority_level: string | null
    }
    fromCache?: boolean
    cachedAt?: string
}

export interface EvaluateMatchPayload {
    jobDescription: string
    cvMetadataId: string
}

export function useEvaluateJobMatch(options?: UseMutationOptions<EvaluateMatchPayload, JobMatchResult>) {
    return useMutation<EvaluateMatchPayload, JobMatchResult>(
        '/api/evaluate-job-match',
        'POST',
        options
    )
}
