import { useMutation, type UseMutationOptions } from '@/hooks/useFetch'

interface TailorCVPayload {
    jobDescription: string
    // cvContent is fetched from blueprint by the API
}

interface TailorCVResponse {
    tailoredCV: string
}

export function useTailorCV(options?: UseMutationOptions<TailorCVPayload, TailorCVResponse>) {
    return useMutation<TailorCVPayload, TailorCVResponse>(
        '/api/tailor-cv',
        'POST',
        options
    )
}
