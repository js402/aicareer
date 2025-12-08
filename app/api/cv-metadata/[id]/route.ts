import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import type { ExtractedCVInfo } from '@/lib/api-client'
import { removeCVFromBlueprint } from '@/lib/cv-blueprint-merger'

// PUT /api/cv-metadata/[id] - Update CV metadata
export const PUT = withAuth(async (request, { supabase, user }) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop() || ''
        const { extractedInfo } = await request.json()

        if (!extractedInfo) {
            return NextResponse.json(
                { error: 'extractedInfo is required' },
                { status: 400 }
            )
        }

        // Validate that the metadata belongs to the user
        const { data: existingMetadata, error: fetchError } = await supabase
            .from('cv_metadata')
            .select('id, user_id')
            .eq('id', id)
            .single()

        if (fetchError || !existingMetadata) {
            return NextResponse.json(
                { error: 'Metadata not found' },
                { status: 404 }
            )
        }

        if (existingMetadata.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Update the metadata
        const { data, error } = await supabase
            .from('cv_metadata')
            .update({
                extracted_info: extractedInfo,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating CV metadata:', error)
            return NextResponse.json(
                { error: 'Failed to update metadata' },
                { status: 500 }
            )
        }

        return NextResponse.json({ metadata: data })
    } catch (error) {
        console.error('Error updating CV metadata:', error)
        return NextResponse.json(
            { error: 'Failed to update CV metadata' },
            { status: 500 }
        )
    }
})

// DELETE /api/cv-metadata/[id] - Delete CV metadata
export const DELETE = withAuth(async (request, { supabase, user }) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop() || ''

        // Validate that the metadata belongs to the user
        const { data: existingMetadata, error: fetchError } = await supabase
            .from('cv_metadata')
            .select('id, user_id, cv_hash')
            .eq('id', id)
            .single()

        if (fetchError || !existingMetadata) {
            return NextResponse.json(
                { error: 'Metadata not found' },
                { status: 404 }
            )
        }

        if (existingMetadata.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Delete the metadata
        const { error } = await supabase
            .from('cv_metadata')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting CV metadata:', error)
            return NextResponse.json(
                { error: 'Failed to delete metadata' },
                { status: 500 }
            )
        }

        // Remove from blueprint
        try {
            if (existingMetadata.cv_hash) {
                await removeCVFromBlueprint(supabase, user.id, existingMetadata.cv_hash)
            }
        } catch (blueprintError) {
            console.error('Error updating blueprint on delete:', blueprintError)
            // Don't fail the request since the CV deletion succeeded
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting CV metadata:', error)
        return NextResponse.json(
            { error: 'Failed to delete CV metadata' },
            { status: 500 }
        )
    }
})
