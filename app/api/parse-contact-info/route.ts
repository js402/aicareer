import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'

interface ContactInfo {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
}

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

        // Parse string format
        const contactString = String(contactInfo).toLowerCase()
        const parsed: ContactInfo = {}

        // Email extraction (basic regex)
        const emailMatch = contactString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
        if (emailMatch) {
            parsed.email = emailMatch[1]
        }

        // Phone extraction (basic patterns)
        const phonePatterns = [
            /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/, // US format
            /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // International
            /\d{10,15}/ // Raw digits
        ]

        for (const pattern of phonePatterns) {
            const phoneMatch = contactString.match(pattern)
            if (phoneMatch) {
                parsed.phone = phoneMatch[0].replace(/[^\d+\-\s()]/g, '') // Clean up
                break
            }
        }

        // LinkedIn extraction
        const linkedinMatch = contactString.match(/(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/i)
        if (linkedinMatch) {
            parsed.linkedin = linkedinMatch[1]
        }

        // Website extraction (basic)
        const websiteMatch = contactString.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/i)
        if (websiteMatch && !websiteMatch[1].includes('linkedin')) {
            parsed.website = websiteMatch[1]
        }

        // Location extraction (remaining text, usually at the end)
        let locationText = contactString
            .replace(parsed.email || '', '')
            .replace(parsed.phone || '', '')
            .replace(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i, '')
            .replace(/https?:\/\/[^\s]+/gi, '')
            .replace(/[^\w\s,.-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        if (locationText && locationText.length > 3) {
            parsed.location = locationText
        }

        return NextResponse.json({ parsed })
    } catch (error) {
        console.error('Error parsing contact info:', error)
        return NextResponse.json(
            { error: 'Failed to parse contact info' },
            { status: 500 }
        )
    }
})
