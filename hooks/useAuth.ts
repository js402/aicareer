'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface UseAuthResult {
    user: any | null
    isLoading: boolean
    isAuthenticated: boolean
}

/**
 * Hook for managing Supabase auth state with real-time subscription
 */
export function useAuth(): UseAuthResult {
    const [user, setUser] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setIsLoading(false)
        }

        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    }
}
