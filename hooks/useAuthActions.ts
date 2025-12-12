import { useAsyncAction, type UseAsyncActionOptions } from '@/hooks/useFetch'

export function useAuthCheck(options?: UseAsyncActionOptions<{ redirect?: string } | undefined, any>) {
    return useAsyncAction(async (params?: { redirect?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.redirect) {
            searchParams.append('redirect', params.redirect)
        }

        const res = await fetch(`/api/auth/check?${searchParams.toString()}`)
        if (!res.ok) {
            throw new Error('Failed to check auth status')
        }
        return res.json()
    }, options)
}
