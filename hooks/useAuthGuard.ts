'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UseAuthGuardOptions {
    redirectTo?: string
    requireCV?: boolean
    cvContent?: string
}

export function useAuthGuard({ redirectTo = 'analysis', requireCV = false, cvContent }: UseAuthGuardOptions = {}) {
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
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
                    const response = await fetch('/api/subscription/status')
                    const { isPro } = await response.json()

                    if (!isPro) {
                        router.push('/pricing')
                        return
                    }
                }
            } catch (error) {
                console.error('Auth guard error:', error)
                router.push('/auth')
            }
        }

        checkAuth()
    }, [router, redirectTo, requireCV, cvContent])
}