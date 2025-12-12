'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UseAuthGuardOptions {
    redirectTo?: string
    requireCV?: boolean
    cvContent?: string
}

interface UseAuthGuardResult {
    isLoading: boolean
    isAuthenticated: boolean
}

import { useSubscriptionStatusAction } from '@/hooks/useSubscription'

export function useAuthGuard({ redirectTo = 'analysis', requireCV = false, cvContent }: UseAuthGuardOptions = {}): UseAuthGuardResult {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const { mutate: getSubscriptionStatus } = useSubscriptionStatusAction()

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true)
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push(`/auth?redirect=${redirectTo}`)
                    return
                }

                if (requireCV && !cvContent) {
                    router.push('/')
                    return
                }

                // Optional: Check if user has Pro access for certain pages
                if (redirectTo.includes('job-match') || redirectTo.includes('career-guidance')) {
                    const { isPro } = await getSubscriptionStatus(undefined)

                    if (!isPro) {
                        router.push('/pricing')
                        return
                    }
                }

                setIsAuthenticated(true)
            } catch (error) {
                console.error('Auth guard error:', error)
                router.push('/auth')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router, redirectTo, requireCV, cvContent])

    return { isLoading, isAuthenticated }
}