import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { getCachedAnalysis } from '@/lib/cv-cache'

export const GET = withAuth(async (request, { supabase, user }) => {
    try {
        const { searchParams } = new URL(request.url)
        const hash = searchParams.get('hash')

        if (!hash) {
            return NextResponse.json(
                { error: 'Hash parameter is required' },
                { status: 400 }
            )
        }

        const cachedResult = await getCachedAnalysis(supabase, user.id, hash)

        if (!cachedResult) {
            return NextResponse.json(
                { error: 'Analysis not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            analysis: cachedResult.analysis,
            cvContent: cachedResult.cv_content,
            filename: cachedResult.filename,
            created_at: cachedResult.created_at
        })

    } catch (error) {
        console.error('Error retrieving analysis:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve analysis' },
            { status: 500 }
        )
    }
})
