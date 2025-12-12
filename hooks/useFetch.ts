'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export interface UseFetchOptions<T> {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    skip?: boolean // Skip fetching if true
    dependencies?: any[] // Custom dependencies for refetch
}

export interface UseFetchResult<T> {
    data: T | null
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

/**
 * Generic hook for fetching data from any endpoint
 * Handles loading, error, and success states
 */
export function useFetch<T = any>(
    url: string,
    options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(!options.skip)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchData = useCallback(async () => {
        if (options.skip) return

        setIsLoading(true)
        setError(null)
        abortControllerRef.current = new AbortController()

        try {
            const response = await fetch(url, {
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const result: T = await response.json()
            setData(result)
            options.onSuccess?.(result)
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return // Ignore aborted requests
            }
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            options.onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }, [url, options.skip, options.onSuccess, options.onError])

    useEffect(() => {
        fetchData()

        return () => {
            abortControllerRef.current?.abort()
        }
    }, [fetchData, ...(options.dependencies || [])])

    const refetch = useCallback(async () => {
        await fetchData()
    }, [fetchData])

    return { data, isLoading, error, refetch }
}

/**
 * Hook for POST/PATCH/PUT requests
 */
export interface UseMutationOptions<T, R = any> {
    onSuccess?: (data: R) => void
    onError?: (error: Error) => void
}

export interface UseMutationResult<T, R> {
    mutate: (payload: T) => Promise<R>
    isLoading: boolean
    error: Error | null
    data: R | null
}

export function useMutation<T = any, R = any>(
    url: string,
    method: 'POST' | 'PATCH' | 'PUT' = 'POST',
    options: UseMutationOptions<T, R> = {}
): UseMutationResult<T, R> {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [data, setData] = useState<R | null>(null)

    const mutate = useCallback(
        async (payload: T): Promise<R> => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || `HTTP ${response.status}`)
                }

                const result: R = await response.json()
                setData(result)
                options.onSuccess?.(result)
                return result
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err))
                setError(error)
                options.onError?.(error)
                throw error
            } finally {
                setIsLoading(false)
            }
        },
        [url, method, options]
    )

    return { mutate, isLoading, error, data }
}
