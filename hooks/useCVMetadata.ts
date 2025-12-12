'use client'

import { useFetch, useMutation, useAsyncAction, type UseFetchOptions } from '@/hooks/useFetch'

export function useCVMetadataList(options?: UseFetchOptions<{ metadata: any[] }>) {
    const result = useFetch<{ metadata: any[] }>('/api/cv-metadata', options)
    return result
}

export function useRenameCVMetadata(id: string) {
    return useMutation<{ displayName: string }, { metadata: any }>(
        `/api/cv-metadata/${id}`,
        'PUT'
    )
}

export function useUpdateCVMetadata(id: string) {
    return useMutation<{ extractedInfo: any }, { metadata: any }>(`/api/cv-metadata/${id}`, 'PUT')
}

export function useDeleteCVMetadata(id?: string) {
    return useAsyncAction(async (targetId?: string) => {
        const finalId = targetId || id
        if (!finalId) throw new Error('CV Metadata ID is required')

        const res = await fetch(`/api/cv-metadata/${finalId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete CV metadata')
        return res.json() as Promise<{ success: boolean }>
    })
}

export function useUpdateCVMetadataAction() {
    return useAsyncAction(async ({ id, extractedInfo }: { id: string, extractedInfo: any }) => {
        const res = await fetch(`/api/cv-metadata/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extractedInfo })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to update CV metadata')
        }

        return res.json()
    })
}
