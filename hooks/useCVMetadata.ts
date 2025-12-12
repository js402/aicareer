'use client'

import { useFetch, useMutation } from '@/hooks/useFetch'

export function useCVMetadataList() {
    const result = useFetch<{ metadata: any[] }>('/api/cv-metadata')
    return result
}

export function useRenameCVMetadata(id: string) {
    return useMutation<{ displayName: string }, { metadata: any }>(
        `/api/cv-metadata/${id}`,
        'PUT'
    )
}

export function useUpdateCVMetadata(id: string) {
    return useMutation<{ extractedInfo: any } , { metadata: any }>(`/api/cv-metadata/${id}`, 'PUT')
}

export function useDeleteCVMetadata(id: string) {
    // useMutation only supports POST/PATCH/PUT; use fetch wrapper here
    const mutate = async () => {
        const res = await fetch(`/api/cv-metadata/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete CV metadata')
        return res.json() as Promise<{ success: boolean }>
    }
    return { mutate, isLoading: false, error: null, data: null as any }
}
