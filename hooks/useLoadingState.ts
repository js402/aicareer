'use client'

import { useState, useCallback, useRef } from 'react'

interface UseLoadingStateOptions {
  successDuration?: number // Auto-clear success message after ms
  errorDuration?: number // Auto-clear error message after ms
}

interface UseLoadingStateReturn {
  isLoading: boolean
  error: string | null
  success: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
  execute: <T>(
    action: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ) => Promise<T | null>
  reset: () => void
}

/**
 * Hook for managing loading, error, and success states
 * Provides a unified interface with auto-clearing messages
 */
export function useLoadingState(
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn {
  const { successDuration = 3000, errorDuration = 5000 } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)
  const [success, setSuccessState] = useState<string | null>(null)

  const successTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const errorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const setError = useCallback(
    (errorMessage: string | null) => {
      setErrorState(errorMessage)
      setSuccessState(null)

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }

      if (errorMessage && errorDuration > 0) {
        errorTimeoutRef.current = setTimeout(() => {
          setErrorState(null)
        }, errorDuration)
      }
    },
    [errorDuration]
  )

  const setSuccess = useCallback(
    (successMessage: string | null) => {
      setSuccessState(successMessage)
      setErrorState(null)

      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }

      if (successMessage && successDuration > 0) {
        successTimeoutRef.current = setTimeout(() => {
          setSuccessState(null)
        }, successDuration)
      }
    },
    [successDuration]
  )

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
    if (loading) {
      setErrorState(null)
      setSuccessState(null)
    }
  }, [])

  const execute = useCallback(
    async <T,>(
      action: () => Promise<T>,
      executeOptions?: {
        successMessage?: string
        errorMessage?: string
        onSuccess?: (result: T) => void
        onError?: (error: Error) => void
      }
    ): Promise<T | null> => {
      setLoading(true)
      try {
        const result = await action()
        if (executeOptions?.successMessage) {
          setSuccess(executeOptions.successMessage)
        }
        executeOptions?.onSuccess?.(result)
        return result
      } catch (err) {
        const errorMessage =
          executeOptions?.errorMessage ||
          (err instanceof Error ? err.message : 'An error occurred')
        setError(errorMessage)
        executeOptions?.onError?.(
          err instanceof Error ? err : new Error(String(err))
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [setLoading, setSuccess, setError]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setErrorState(null)
    setSuccessState(null)
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  return {
    isLoading,
    error,
    success,
    setLoading,
    setError,
    setSuccess,
    execute,
    reset
  }
}
