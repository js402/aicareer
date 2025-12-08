'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UseAuthRedirectOptions {
    redirectTo?: string
    requirePro?: boolean
    onUnauthenticated?: () => void
    onUnauthorized?: () => void
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
    const router = useRouter()
    const { redirectTo = 'analysis', requirePro = false } = options

    const checkAuthAndRedirect = async (): Promise<boolean> => {
        try {
            // Check authentication
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
                if (options.onUnauthenticated) {
                    options.onUnauthenticated()
                } else {
                    router.push(`/auth?redirect=${redirectTo}`)
                }
                return false
            }

            // Check subscription if required
            if (requirePro) {
                const response = await fetch('/api/subscription/status')
                const { isPro } = await response.json()
                
                if (!isPro) {
                    if (options.onUnauthorized) {
                        options.onUnauthorized()
                    } else {
                        router.push('/pricing')
                    }
                    return false
                }
            }

            return true
        } catch (error) {
            console.error('Auth check failed:', error)
            router.push('/auth')
            return false
        }
    }

    return { checkAuthAndRedirect }
}