
import { useState, useEffect } from 'react'
import { useAsyncAction, type UseAsyncActionOptions } from '@/hooks/useFetch'

export function useSubscriptionStatusAction(options?: UseAsyncActionOptions<void, any>) {
    return useAsyncAction(async () => {
        const res = await fetch('/api/subscription/status')
        if (!res.ok) {
            throw new Error('Failed to fetch subscription status')
        }
        return res.json()
    }, options)
}

export function useSubscription() {
    const [hasProAccess, setHasProAccess] = useState(false)
    const { mutate: checkStatus, isLoading } = useSubscriptionStatusAction()

    useEffect(() => {
        checkStatus(undefined).then(data => {
            if (data?.status === 'active' || data?.status === 'trialing') {
                setHasProAccess(true)
            }
        }).catch(() => setHasProAccess(false))
    }, [checkStatus])

    return { hasProAccess, isLoading }
}
