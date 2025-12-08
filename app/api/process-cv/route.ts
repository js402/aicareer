import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { extractCVMetadata } from '@/lib/api-client'
import { mergeCVIntoBlueprint } from '@/lib/cv-blueprint-merger'
import { hashCV } from '@/lib/cv-cache'

// POST /api/process-cv - Process CV content through the full workflow
export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { cvContent } = await request.json()

        if (!cvContent || typeof cvContent !== 'string') {
            return NextResponse.json(
                { error: 'CV content is required and must be a string' },
                { status: 400 }
            )
        }

        // Generate hash for this CV
        const cvHash = await hashCV(cvContent)

        // Extract metadata
        const result = await extractCVMetadata(cvContent)

        let blueprintUpdated = false

        // Process into blueprint only for non-cached results
        if ((result.status === 'valid' || result.status === 'incomplete') && result.extractedInfo) {
            try {
                await mergeCVIntoBlueprint(supabase, user.id, result.extractedInfo, cvHash)
                blueprintUpdated = true
            } catch (blueprintError) {
                console.warn('Failed to process CV into blueprint:', blueprintError)
                // Don't fail the entire process if blueprint processing fails
            }
        }

        // Determine next step based on authentication
        const { data: { session } } = await supabase.auth.getSession()
        const nextStep = session ? 'analysis' : 'auth'

        return NextResponse.json({
            status: 'processed',
            extractedInfo: result.extractedInfo,
            extractionStatus: result.status,
            blueprintUpdated,
            nextStep,
            message: result.message
        })

    } catch (error) {
        console.error('Error processing CV:', error)
        return NextResponse.json(
            { error: 'Failed to process CV', status: 'error' },
            { status: 500 }
        )
    }
})
