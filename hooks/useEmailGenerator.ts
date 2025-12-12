import { useAsyncAction } from '@/hooks/useFetch'

export interface GenerateEmailPayload {
    jobDescription: string
    cvMetadataId: string
    mode: 'employee' | 'freelancer'
    companyName: string
    positionTitle: string
    tone: string
    length: string
    focus: string
}

export interface GenerateEmailResponse {
    emailBody: string
}

export function useGenerateEmail() {
    return useAsyncAction(async (payload: GenerateEmailPayload) => {
        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) throw new Error('Failed to generate email')

        return response.json() as Promise<GenerateEmailResponse>
    })
}
