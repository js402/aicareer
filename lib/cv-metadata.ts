import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedCVInfo } from './api-client'

/**
 * Get cached CV metadata
 */
export async function getCachedCVMetadata(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string
) {
    const { data } = await supabase
        .from('cv_metadata')
        .select('*')
        .eq('user_id', userId)
        .eq('cv_hash', cvHash)
        .single()

    return data
}

/**
 * Store or update CV metadata
 */
export async function storeCVMetadata(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string,
    extractedInfo: ExtractedCVInfo,
    extractionStatus: 'completed' | 'partial' | 'failed' = 'completed',
    confidenceScore?: number
) {
    const autoName = (() => {
        const dateStr = new Date().toISOString().slice(0, 10)
        const summary = (extractedInfo as any)?.summary || ''
        const topRole = (extractedInfo as any)?.primaryFunctions?.[0] || ''
        const base = topRole || summary || 'CV'
        return `${base} - ${dateStr}`
    })()
    const { data, error } = await supabase
        .from('cv_metadata')
        .upsert({
            user_id: userId,
            cv_hash: cvHash,
            extracted_info: extractedInfo,
            extraction_status: extractionStatus,
            confidence_score: confidenceScore,
            display_name: autoName,
        })
        .select()
        .single()

    if (error) {
        console.error('Error storing CV metadata:', error)
        throw error
    }

    return data
}

/**
 * Get all metadata for a user
 */
export async function getUserCVMetadata(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 50
) {
    const { data, error } = await supabase
        .from('cv_metadata')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching CV metadata:', error)
        throw error
    }

    return data
}

/**
 * Update metadata timestamp (for cache hit tracking)
 */
export async function updateMetadataTimestamp(
    supabase: SupabaseClient,
    id: string
) {
    const { error } = await supabase
        .from('cv_metadata')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating metadata timestamp:', error)
    }
}

/**
 * Delete CV metadata
 */
export async function deleteCVMetadata(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string
) {
    const { error } = await supabase
        .from('cv_metadata')
        .delete()
        .eq('user_id', userId)
        .eq('cv_hash', cvHash)

    if (error) {
        console.error('Error deleting CV metadata:', error)
        throw error
    }
}
