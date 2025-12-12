// Removed conflicting import - ContactInfo is now defined locally with enhanced fields

export interface ValidateCVResponse {
    status: 'valid' | 'suspicious' | 'invalid'
    message: string
    validation: {
        contentLength: number
        lineCount: number
        wordCount: number
        hasEmail: boolean
        hasPhone: boolean
        hasExperience: boolean
        hasEducation: boolean
    }
    recommendations: string[]
}

export interface ProcessCVResponse {
    status: 'auth_required' | 'subscription_required' | 'success' | 'error'
    nextStep?: string
    message: string
    data?: unknown
    error?: string
}

// Added types
export interface ContactInfo {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
    raw?: string
}

export interface ExperienceEntry {
    role: string
    company: string
    location?: string
    duration: string
    description?: string
    highlights?: string[]
}

export interface EducationEntry {
    degree: string
    institution: string
    location?: string
    year: string
    gpa?: string
    coursework?: string[]
    activities?: string[]
}

export interface ProjectEntry {
    name: string
    description: string
    technologies: string[]
    link?: string
    duration?: string
}

export interface CertificationEntry {
    name: string
    issuer: string
    year: string
}

export interface LeadershipEntry {
    role: string
    organization: string
    duration: string
    description?: string
    highlights?: string[]
}

export type SeniorityLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director' | 'executive'

export interface ExtractedCVInfo {
    name?: string
    contactInfo: string | ContactInfo
    experience: ExperienceEntry[]
    education: EducationEntry[]
    skills: string[]
    inferredSkills?: string[]  // Skills inferred from context
    projects: ProjectEntry[]
    certifications: CertificationEntry[]
    languages: string[]
    summary: string
    leadership?: LeadershipEntry[]
    seniorityLevel?: SeniorityLevel
    yearsOfExperience?: number
    industries?: string[]
    primaryFunctions?: string[]
}

export interface CVMetadataResponse {
    id: string
    user_id: string
    cv_hash: string
    extracted_info: ExtractedCVInfo
    extraction_status: 'pending' | 'completed' | 'failed'
    confidence_score: number
    created_at: string
    updated_at: string
}

export interface ExtractMetadataResponse {
    status: 'valid' | 'invalid' | 'incomplete' | 'cached'
    message?: string
    questions?: string[]
    extractedInfo?: ExtractedCVInfo
}

export interface AnalyzeCVResponse {
    status: 'valid' | 'invalid' | 'incomplete'
    message?: string
    questions?: string[]
    analysis?: string
}

/**
 * Public CV validation (no authentication required)
 */
export async function validateCV(cvContent: string): Promise<ValidateCVResponse> {
    const response = await fetch('/api/validate-cv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvContent }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Validation failed: ${errorText}`)
    }

    return response.json()
}

/**
 * Check if user is authenticated and has Pro access
 */
export async function checkAuthAndSubscription(): Promise<{
    authenticated: boolean
    isPro: boolean
    user?: { id: string; email: string }
    message: string
}> {
    const response = await fetch('/api/auth/check')

    if (!response.ok) {
        throw new Error('Failed to check authentication status')
    }

    return response.json()
}

// Update the existing processCV function to handle auth better
export async function processCV(cvContent: string): Promise<ProcessCVResponse> {
    try {
        // First check auth
        const authStatus = await checkAuthAndSubscription()

        if (!authStatus.authenticated) {
            return {
                status: 'auth_required',
                nextStep: 'auth',
                message: 'Authentication required for full processing'
            }
        }

        if (!authStatus.isPro) {
            return {
                status: 'subscription_required',
                nextStep: 'pricing',
                message: 'Pro subscription required for full processing'
            }
        }

        // If authenticated and has Pro, proceed
        const response = await fetch('/api/process-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cvContent }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return {
                status: 'error',
                error: errorData.error || 'Failed to process CV',
                message: errorData.message || 'Processing failed'
            }
        }

        return response.json()
    } catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to process CV',
            message: 'An unexpected error occurred'
        }
    }
}

// Added functions
export async function extractCVMetadata(cvContent: string): Promise<ExtractMetadataResponse> {
    const response = await fetch('/api/extract-cv-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvContent }),
    })

    if (!response.ok) {
        throw new Error('Failed to extract metadata')
    }

    return response.json()
}

export async function analyzeCV(cvContent: string): Promise<AnalyzeCVResponse> {
    const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvContent }),
    })

    if (!response.ok) {
        throw new Error('Failed to analyze CV')
    }

    return response.json()
}

export async function getUserCVMetadata(): Promise<{ metadata: CVMetadataResponse[] }> {
    const response = await fetch('/api/cv-metadata', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch CV metadata')
    }

    return response.json()
}

export async function updateCVMetadata(metadataId: string, updatedInfo: ExtractedCVInfo): Promise<{ metadata: CVMetadataResponse }> {
    const response = await fetch(`/api/cv-metadata/${metadataId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedInfo: updatedInfo }),
    })

    if (!response.ok) {
        throw new Error('Failed to update CV metadata')
    }

    return response.json()
}

export async function renameCVMetadata(metadataId: string, displayName: string): Promise<{ metadata: CVMetadataResponse }> {
    const response = await fetch(`/api/cv-metadata/${metadataId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
    })

    if (!response.ok) {
        throw new Error('Failed to rename CV')
    }

    return response.json()
}

export async function deleteCVMetadata(metadataId: string): Promise<void> {
    const response = await fetch(`/api/cv-metadata/${metadataId}`, {
        method: 'DELETE',
    })

    if (!response.ok) {
        throw new Error('Failed to delete CV metadata')
    }
}