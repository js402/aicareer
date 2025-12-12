import { useFetch, type UseFetchOptions } from '@/hooks/useFetch'
import { type Position } from '@/hooks/usePositionActions'

export interface PositionsResponse {
    positions: Position[]
}

export function usePosition(id: string, options?: UseFetchOptions<Position>) {
    return useFetch<Position>(`/api/job-positions/${id}`, options)
}

export function usePositionsList(options?: UseFetchOptions<PositionsResponse>) {
    return useFetch<PositionsResponse>('/api/job-positions', options)
}
