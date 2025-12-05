import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'

export const GET = withAuth(async (request, { supabase, user }) => {
    const id = request.nextUrl.pathname.split('/').pop() || ''

    try {
        const { data, error } = await supabase
            .from('tailored_cvs')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching tailored CV:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tailored CV' },
            { status: 500 }
        )
    }
})
