import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { parseContactInfoString, type ContactInfo } from '@/lib/utils'

// POST /api/parse-contact-info - Parse contact info string into structured format
export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { contactInfo } = await request.json()

        if (!contactInfo) {
            return NextResponse.json(
                { parsed: {} },
                { status: 200 }
            )
        }

        // If already an object, return as-is
        if (typeof contactInfo === 'object' && contactInfo !== null) {
            return NextResponse.json({ parsed: contactInfo })
        }

        // Parse using shared utility
        const parsed = parseContactInfoString(String(contactInfo))

        return NextResponse.json({ parsed })
    } catch (error) {
        console.error('Error parsing contact info:', error)
        return NextResponse.json(
            { error: 'Failed to parse contact info' },
            { status: 500 }
        )
    }
})
