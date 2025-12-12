import { useFetch, type UseFetchOptions } from '@/hooks/useFetch'

export function useCVDetail(id: string | null, options?: UseFetchOptions<{ metadata: any }>) {
    return useFetch<{ metadata: any }>(
        id ? `/api/cv-metadata/${id}` : '',
        { ...options, skip: !id }
    )
}
