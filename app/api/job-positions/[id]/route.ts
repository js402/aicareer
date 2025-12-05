import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'

export const GET = withAuth(async (request, { supabase, user }) => {
    // Extract ID from URL since withAuth changes the function signature
    const id = request.nextUrl.pathname.split('/').pop() || ''

    try {
        // Fetch position details and associated tailored CVs
        const { data: position, error: positionError } = await supabase
            .from('job_positions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (positionError) throw positionError

        const { data: tailoredCVs, error: cvsError } = await supabase
            .from('tailored_cvs')
            .select('id, version, is_active, created_at')
            .eq('job_position_id', id)
            .eq('user_id', user.id)
            .order('version', { ascending: false })

        if (cvsError) throw cvsError

        return NextResponse.json({ ...position, tailored_cvs: tailoredCVs })
    } catch (error) {
        console.error('Error fetching job position:', error)
        return NextResponse.json(
            { error: 'Failed to fetch job position' },
            { status: 500 }
        )
    }
})

export const PATCH = withAuth(async (request, { supabase, user }) => {
    const id = request.nextUrl.pathname.split('/').pop() || ''

    try {
        const body = await request.json()
        const { status, notes, applied_date, submitted_cv_id } = body

        const updates: Record<string, unknown> = {}
        if (status) updates.status = status
        if (notes !== undefined) updates.notes = notes
        if (applied_date) updates.applied_date = applied_date
        if (submitted_cv_id !== undefined) updates.submitted_cv_id = submitted_cv_id

        const { data, error } = await supabase
            .from('job_positions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error updating job position:', error)
        return NextResponse.json(
            { error: 'Failed to update job position' },
            { status: 500 }
        )
    }
})

export const DELETE = withAuth(async (request, { supabase, user }) => {
    const id = request.nextUrl.pathname.split('/').pop() || ''

    try {
        const { error } = await supabase
            .from('job_positions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting job position:', error)
        return NextResponse.json(
            { error: 'Failed to delete job position' },
            { status: 500 }
        )
    }
})
