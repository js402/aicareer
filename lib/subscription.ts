import type { SupabaseClient } from '@supabase/supabase-js'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'paused'

export interface Subscription {
    id: string
    user_id: string
    stripe_customer_id: string
    stripe_subscription_id: string | null
    status: SubscriptionStatus
    plan: string
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    created_at: string
    updated_at: string
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(
    supabase: SupabaseClient,
    userId: string
): Promise<Subscription | null> {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null
        }
        console.error('Error fetching subscription:', error)
        throw error
    }

    return data
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(
    supabase: SupabaseClient,
    userId: string
): Promise<boolean> {
    const subscription = await getUserSubscription(supabase, userId)
    return subscription !== null && subscription.status === 'active'
}

/**
 * Check if user has access to pro features
 */
export async function hasProAccess(
    supabase: SupabaseClient,
    userId: string
): Promise<boolean> {
    const subscription = await getUserSubscription(supabase, userId)

    if (!subscription) {
        return false
    }

    // Check if subscription is active and not expired
    if (subscription.status !== 'active') {
        return false
    }

    // Check if current period has not ended
    if (subscription.current_period_end) {
        const periodEnd = new Date(subscription.current_period_end)
        const now = new Date()
        if (now > periodEnd) {
            return false
        }
    }

    return true
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(
    supabase: SupabaseClient,
    subscription: Partial<Subscription> & { user_id: string; stripe_customer_id: string }
) {
    const { data, error } = await supabase
        .from('subscriptions')
        .upsert(subscription, {
            onConflict: 'stripe_subscription_id',
        })
        .select()
        .single()

    if (error) {
        console.error('Error upserting subscription:', error)
        throw error
    }

    return data
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
    supabase: SupabaseClient,
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
    additionalData?: Partial<Subscription>
) {
    const updateData: Partial<Subscription> = {
        status,
        ...additionalData,
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .select()
        .single()

    if (error) {
        console.error('Error updating subscription status:', error)
        throw error
    }

    return data
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
    supabase: SupabaseClient,
    stripeSubscriptionId: string
): Promise<Subscription | null> {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return null
        }
        console.error('Error fetching subscription by Stripe ID:', error)
        throw error
    }

    return data
}
