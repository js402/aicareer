import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Authentication result from middleware
 */
export interface AuthResult {
    supabase: SupabaseClient
    user: User
}

/**
 * Standard error response format
 */
export function errorResponse(message: string, status: number = 500) {
    return NextResponse.json({ error: message }, { status })
}

/**
 * Middleware to check authentication
 * Returns authenticated user and supabase client or error response
 */
export function withAuth(
    handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        try {
            const supabase = await createServerSupabaseClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                return errorResponse(
                    'Unauthorized - please sign in',
                    401
                )
            }

            return handler(request, { supabase, user })
        } catch (error) {
            console.error('Auth middleware error:', error)
            return errorResponse('Internal server error', 500)
        }
    }
}

/**
 * Middleware to check authentication AND Pro subscription
 * Returns authenticated user and supabase client or error response
 */
export function withProAccess(
    handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return withAuth(async (request, auth) => {
        const isPro = await hasProAccess(auth.supabase, auth.user.id)

        if (!isPro) {
            return errorResponse(
                'This feature is available only to Pro subscribers',
                403
            )
        }

        return handler(request, auth)
    })
}

/**
 * Middleware for session-based auth (uses session instead of user)
 */
export function withSession(
    handler: (request: NextRequest, supabase: SupabaseClient, userId: string) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        try {
            const supabase = await createServerSupabaseClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                return errorResponse('Unauthorized', 401)
            }

            return handler(request, supabase, session.user.id)
        } catch (error) {
            console.error('Session middleware error:', error)
            return errorResponse('Internal server error', 500)
        }
    }
}
