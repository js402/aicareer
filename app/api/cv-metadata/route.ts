import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { getUserCVMetadata } from '@/lib/cv-metadata'

// GET /api/cv-metadata - Get all CV metadata for the authenticated user
export const GET = withAuth(async (request, { supabase, user }) => {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const metadata = await getUserCVMetadata(supabase, user.id, limit)

        return NextResponse.json({
            metadata,
            total: metadata.length,
            hasMore: metadata.length === limit
        })
    } catch (error) {
        console.error('Error fetching CV metadata:', error)
        return NextResponse.json(
            { error: 'Failed to fetch CV metadata' },
            { status: 500 }
        )
    }
})

// POST /api/cv-metadata - Create a new CV entry
export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { content, filename } = await request.json()

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        // Generate SHA-256 hash for the content
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const cvHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const { data, error } = await supabase
            .from('cv_metadata')
            .upsert({
                user_id: user.id,
                cv_hash: cvHash,
                cv_content: content,
                display_name: filename || 'Untitled CV',
                extraction_status: 'pending', // Pending full analysis
                extracted_info: {}, // Empty until analyzed
                source_type: 'uploaded'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating CV:', error)
        return NextResponse.json(
            { error: 'Failed to create CV' },
            { status: 500 }
        )
    }
})
