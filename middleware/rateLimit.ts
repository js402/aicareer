import { createServerSupabaseClient } from '@/lib/supabase-server'


/**
 * Rate limiting implementation for serverless environments
 * Uses Supabase database for persistent storage
 */
export async function rateLimit(
    ip: string,
    limit: number = 10,
    windowMs: number = 60 * 1000
): Promise<boolean> {
    try {
        const supabase = await createServerSupabaseClient()
        const now = new Date()
        const windowStart = new Date(now.getTime() - windowMs)

        // Try to get existing record for this IP within the current window
        const { data: existingRecord, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('ip_address', ip)
            .gte('window_start', windowStart.toISOString())
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" which is expected
            // PGRST205 is "relation not found" (table missing) — treat as soft-disable
            if (fetchError.code === 'PGRST205') {
                console.warn('Rate limit table missing (rate_limits); allowing request')
                return true
            }

            console.error('Rate limit fetch error:', fetchError)
            // Allow request on error to avoid blocking legitimate users
            return true
        }

        if (existingRecord) {
            // Update existing record
            const newCount = existingRecord.request_count + 1

            if (newCount > limit) {
                return false // Rate limit exceeded
            }

            const { error: updateError } = await supabase
                .from('rate_limits')
                .update({
                    request_count: newCount,
                    updated_at: now.toISOString()
                })
                .eq('id', existingRecord.id)

            if (updateError) {
                console.error('Rate limit update error:', updateError)
                return true // Allow on error
            }

            return true
        } else {
            // Create new record
            const { error: insertError } = await supabase
                .from('rate_limits')
                .insert({
                    ip_address: ip,
                    request_count: 1,
                    window_start: now.toISOString()
                })

            if (insertError) {
                if ((insertError as any).code === 'PGRST205') {
                    console.warn('Rate limit table missing (rate_limits) on insert; allowing request')
                    return true
                }
                console.error('Rate limit insert error:', insertError)
                return true // Allow on error
            }

            return true
        }
    } catch (error) {
        console.error('Rate limiting error:', error)
        // Allow request on error to avoid blocking legitimate users
        return true
    }
}

/**
 * Legacy in-memory rate limiting (deprecated - use database version above)
 * @deprecated Use the database-based rateLimit function instead
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function legacyRateLimit(ip: string, limit: number = 10, windowMs: number = 60 * 1000) {
    const now = Date.now()
    const record = rateLimitMap.get(ip) || { count: 0, lastReset: now }

    if (now - record.lastReset > windowMs) {
        record.count = 0
        record.lastReset = now
    }

    record.count += 1
    rateLimitMap.set(ip, record)

    return record.count <= limit
}
