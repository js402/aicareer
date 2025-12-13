'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserSubscription, type Subscription } from '@/lib/subscription'

export function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadSubscription()

        // Set up real-time subscription to changes
        const channel = supabase
            .channel('subscription-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'subscriptions',
                },
                () => {
                    // Reload subscription when it changes
                    loadSubscription()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadSubscription = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setSubscription(null)
                setIsLoading(false)
                return
            }

            const sub = await getUserSubscription(supabase, user.id)
            setSubscription(sub)
        } catch (err) {
            console.error('Error loading subscription:', err)
            setError(err instanceof Error ? err.message : 'Failed to load subscription')
        } finally {
            setIsLoading(false)
        }
    }

    const hasProAccess = subscription?.status === 'active' || subscription?.status === 'trialing'
    const isTrialing = subscription?.status === 'trialing'
    const isCanceled = subscription?.cancel_at_period_end === true

    return {
        subscription,
        isLoading,
        error,
        hasProAccess,
        isTrialing,
        isCanceled,
        reload: loadSubscription,
    }
}
