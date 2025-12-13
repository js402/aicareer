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
