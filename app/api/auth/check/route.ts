import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/auth/check - Check authentication status and provide redirect info
export const GET = async (request: NextRequest) => {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const { searchParams } = new URL(request.url)
        const redirectTo = searchParams.get('redirect') || 'analysis'

        if (session?.user) {
            return NextResponse.json({
                authenticated: true,
                user: {
                    id: session.user.id,
                    email: session.user.email
                },
                redirectUrl: `/${redirectTo}`
            })
        } else {
            return NextResponse.json({
                authenticated: false,
                redirectUrl: `/auth?redirect=${redirectTo}`
            })
        }
    } catch (error) {
        console.error('Error checking authentication:', error)
        return NextResponse.json(
            { error: 'Failed to check authentication' },
            { status: 500 }
        )
    }
}
