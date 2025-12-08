import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'

export const GET = async (request: NextRequest) => {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const { searchParams } = new URL(request.url)
        const redirectTo = searchParams.get('redirect') || 'analysis'

        if (session?.user) {
            // Check subscription status
            const isPro = await hasProAccess(supabase, session.user.id)

            return NextResponse.json({
                authenticated: true,
                user: {
                    id: session.user.id,
                    email: session.user.email
                },
                isPro,
                redirectUrl: `/${redirectTo}`,
                message: isPro ? 'Pro user - Full access granted' : 'Free user - Upgrade for full features'
            })
        } else {
            return NextResponse.json({
                authenticated: false,
                redirectUrl: `/auth?redirect=${redirectTo}`,
                message: 'Authentication required'
            })
        }
    } catch (error) {
        console.error('Error checking authentication:', error)
        return NextResponse.json(
            {
                authenticated: false,
                redirectUrl: '/auth',
                error: 'Failed to check authentication',
                message: 'Please try signing in again'
            },
            { status: 500 }
        )
    }
}