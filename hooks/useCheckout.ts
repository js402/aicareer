'use client'

import { useMutation } from '@/hooks/useFetch'

interface CreateCheckoutPayload {
    priceId: string
}

interface CreateCheckoutResponse {
    sessionUrl?: string
    error?: string
}

export function useCreateCheckoutSession() {
    return useMutation<CreateCheckoutPayload, CreateCheckoutResponse>(
        '/api/create-checkout-session',
        'POST'
    )
}
