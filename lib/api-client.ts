/**
 * Client-side helper function to call the CV analysis API
 */

export interface AnalyzeCVResponse {
    analysis: string
    fromCache: boolean
    cachedAt?: string
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
    model?: string
    filename?: string
    status?: 'valid' | 'incomplete' | 'invalid'
    questions?: string[]
    message?: string
}

export interface AnalyzeCVError {
    error: string
    details?: string
}

export interface ContactInfo {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
}

export interface ExtractedCVInfo {
    name: string
    contactInfo: string | ContactInfo
    experience: Array<{role: string, company: string, duration: string}>
    skills: string[]
    education: Array<{degree: string, institution: string, year: string}>
}

export interface ExtractCVMetadataResponse {
    extractedInfo: ExtractedCVInfo
    status: 'valid' | 'incomplete' | 'invalid' | 'error' | 'cached'
    questions?: string[]
    message?: string
    error?: string
    cachedAt?: string
    extractionStatus?: string
    confidenceScore?: number
}

export async function analyzeCV(
    cvContent: string,
    customPrompt?: string
): Promise<AnalyzeCVResponse> {
    const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
            cvContent,
            prompt: customPrompt,
        }),
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to analyze CV')
    }

    return response.json()
}

export async function extractCVMetadata(
    cvContent: string
): Promise<ExtractCVMetadataResponse> {
    const response = await fetch('/api/extract-cv-metadata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
            cvContent,
        }),
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to extract CV metadata')
    }

    return response.json()
}

export interface CVMetadataResponse {
    id: string
    user_id: string
    cv_hash: string
    extracted_info: ExtractedCVInfo
    extraction_status: 'completed' | 'partial' | 'failed'
    confidence_score: number | null
    created_at: string
    updated_at: string
}

export interface GetCVMetadataResponse {
    metadata: CVMetadataResponse[]
    total: number
    hasMore: boolean
}

/**
 * Get all CV metadata for the current user
 */
export async function getUserCVMetadata(limit: number = 50): Promise<GetCVMetadataResponse> {
    const response = await fetch(`/api/cv-metadata?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to fetch CV metadata')
    }

    return response.json()
}

/**
 * Update CV metadata
 */
export async function updateCVMetadata(
    metadataId: string,
    extractedInfo: ExtractedCVInfo
): Promise<CVMetadataResponse> {
    const response = await fetch(`/api/cv-metadata/${metadataId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ extractedInfo }),
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to update CV metadata')
    }

    const data = await response.json()
    return data.metadata
}

/**
 * Delete CV metadata
 */
export async function deleteCVMetadata(metadataId: string): Promise<void> {
    const response = await fetch(`/api/cv-metadata/${metadataId}`, {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to delete CV metadata')
    }
}

/**
 * CV Blueprint API functions
 */
export interface CVBlueprintResponse {
    blueprint: {
        id: string
        user_id: string
        profile_data: any
        total_cvs_processed: number
        last_cv_processed_at: string | null
        blueprint_version: number
        confidence_score: number
        data_completeness: number
        created_at: string
        updated_at: string
    }
    isNew: boolean
}

export interface BlueprintMergeResponse {
    success: boolean
    blueprint: any
    changes: Array<{
        type: string
        description: string
        impact: number
    }>
    mergeSummary: {
        newSkills: number
        newExperience: number
        newEducation: number
        updatedFields: number
        confidence: number
    }
}

/**
 * Get user's CV blueprint
 */
export async function getUserCVBlueprint(): Promise<CVBlueprintResponse> {
    const response = await fetch('/api/cv-blueprint', {
        method: 'GET',
        credentials: 'include',
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to fetch CV blueprint')
    }

    return response.json()
}

/**
 * Process new CV into blueprint
 */
export async function processCVIntoBlueprint(
    cvMetadata: ExtractedCVInfo,
    cvHash?: string
): Promise<BlueprintMergeResponse> {
    const response = await fetch('/api/cv-blueprint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cvMetadata, cvHash }),
    })

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json()
        throw new Error(error.error || 'Failed to process CV into blueprint')
    }

    return response.json()
}

/**
 * Unified CV processing endpoint
 */
export interface ProcessCVResponse {
    status: 'processed' | 'error'
    extractedInfo?: ExtractedCVInfo
    extractionStatus?: string
    blueprintUpdated?: boolean
    nextStep?: 'analysis' | 'auth'
    message?: string
    error?: string
}

export async function processCV(cvContent: string): Promise<ProcessCVResponse> {
    const response = await fetch('/api/process-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cvContent }),
    });

    if (!response.ok) {
        const error: AnalyzeCVError = await response.json();
        throw new Error(error.error || 'Failed to process CV');
    }

    return response.json();
}

/**
 * Example usage:
 *
 * import { analyzeCV, extractCVMetadata, getUserCVMetadata, updateCVMetadata, deleteCVMetadata } from '@/lib/api-client'
 *
 * try {
 *   const result = await analyzeCV(cvContent)
 *   console.log(result.analysis)
 * } catch (error) {
 *   console.error('Analysis failed:', error)
 * }
 *
 * try {
 *   const metadata = await extractCVMetadata(cvContent)
 *   console.log(metadata.extractedInfo)
 * } catch (error) {
 *   console.error('Metadata extraction failed:', error)
 * }
 *
 * try {
 *   const { metadata } = await getUserCVMetadata()
 *   console.log('User has', metadata.length, 'CVs stored')
 * } catch (error) {
 *   console.error('Failed to fetch user metadata:', error)
 * }
 */
