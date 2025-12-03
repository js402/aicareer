import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generate SHA-256 hash of CV content for deduplication
 */
export async function hashCV(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if CV analysis exists in cache
 */
export async function getCachedAnalysis(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string
) {
    const { data, error } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('cv_hash', cvHash)
        .single()

    return data
}

/**
 * Store CV analysis in database
 */
export async function storeAnalysis(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string,
    cvContent: string,
    filename: string,
    analysis: string
) {
    const { data, error } = await supabase
        .from('cv_analyses')
        .insert({
            user_id: userId,
            cv_hash: cvHash,
            cv_content: cvContent,
            filename: filename,
            analysis: analysis,
        })
        .select()
        .single()

    if (error) {
        console.error('Error storing analysis:', error)
        throw error
    }

    return data
}

/**
 * Get all analyses for a user
 */
export async function getUserAnalyses(
    supabase: SupabaseClient,
    userId: string
) {
    const { data, error } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching analyses:', error)
        throw error
    }

    return data
}

/**
 * Update analysis timestamp (for cache hit tracking)
 */
export async function updateAnalysisTimestamp(
    supabase: SupabaseClient,
    id: string
) {
    const { error } = await supabase
        .from('cv_analyses')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating timestamp:', error)
    }
}
