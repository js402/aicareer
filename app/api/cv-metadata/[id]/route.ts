import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { renderExtractedInfoToMarkdown } from '@/lib/cv-formatter'

// PUT /api/cv-metadata/[id] - Update CV metadata
export const PUT = withAuth(async (request, { supabase, user }) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop() || ''
        const body = await request.json()
        const { extractedInfo, displayName } = body

        if (!extractedInfo && !displayName) {
            return NextResponse.json(
                { error: 'extractedInfo or displayName is required' },
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
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        }
        if (extractedInfo) {
            updatePayload.extracted_info = extractedInfo
            updatePayload.cv_content = renderExtractedInfoToMarkdown(extractedInfo)
        }
        if (displayName) updatePayload.display_name = displayName

        const { data, error } = await supabase
            .from('cv_metadata')
            .update(updatePayload)
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

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting CV metadata:', error)
        return NextResponse.json(
            { error: 'Failed to delete CV metadata' },
            { status: 500 }
        )
    }
})
