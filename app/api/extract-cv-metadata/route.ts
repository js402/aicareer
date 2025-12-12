import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { storeCVMetadata, getCachedCVMetadata } from '@/lib/cv-metadata'
import { hashCV } from '@/lib/cv-cache'
import { extractCVMetadataWithAI, ValidationResult } from '@/lib/cv-service'

export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { cvContent } = await request.json()

        if (!cvContent) {
            return NextResponse.json(
                { error: 'CV content is required' },
                { status: 400 }
            )
        }

        const cvHash = await hashCV(cvContent)

        // Check for cached metadata first
        const cachedMetadata = await getCachedCVMetadata(supabase, user.id, cvHash)
        if (cachedMetadata) {
            return NextResponse.json({
                extractedInfo: cachedMetadata.extracted_info,
                metadataId: cachedMetadata.id,
                status: 'cached',
                cachedAt: cachedMetadata.created_at,
                extractionStatus: cachedMetadata.extraction_status,
                confidenceScore: cachedMetadata.confidence_score
            })
        }

        // STEP 1: Validate and extract CV structure
        const validation = await extractCVMetadataWithAI(cvContent)

        // Handle Invalid CVs
        if (validation?.status === 'invalid') {
            return NextResponse.json(
                {
                    error: 'Invalid CV format',
                    message: validation.rejectionReason || 'The uploaded file does not appear to be a valid CV.',
                    status: 'invalid'
                },
                { status: 400 }
            )
        }

        // For incomplete CVs, still return the extracted info if available
        if (validation?.status === 'incomplete') {
            // Store partial metadata in database if we have any extracted info
            let storedMetadata = null
            if (validation.extractedInfo) {
                try {
                    storedMetadata = await storeCVMetadata(
                        supabase,
                        user.id,
                        cvHash,
                        validation.extractedInfo,
                        'partial',
                        0.5 // Lower confidence for incomplete data
                    )
                } catch (cacheError) {
                    console.warn('Failed to cache partial metadata:', cacheError)
                }
            }

            return NextResponse.json(
                {
                    message: 'CV is incomplete',
                    extractedInfo: validation.extractedInfo,
                    metadataId: storedMetadata?.id,
                    status: 'incomplete'
                },
                { status: 200 } // Return 200 so frontend can handle it gracefully
            )
        }

        if (!validation?.extractedInfo) {
            return NextResponse.json(
                {
                    error: 'Failed to extract information',
                    status: 'error'
                },
                { status: 500 }
            )
        }

        // Store metadata in database
        let storedMetadata = null
        try {
            const extractionStatus = validation.status === 'valid' ? 'completed' : 'partial'
            storedMetadata = await storeCVMetadata(
                supabase,
                user.id,
                cvHash,
                validation.extractedInfo,
                extractionStatus,
                0.8 // Default confidence score, could be improved with ML model
            )
        } catch (cacheError) {
            console.warn('Failed to cache metadata:', cacheError)
            // Don't fail the request if caching fails
        }

        // Return successfully extracted metadata
        return NextResponse.json({
            extractedInfo: validation.extractedInfo,
            metadataId: storedMetadata?.id,
            status: validation.status,
            extractionStatus: validation.status === 'valid' ? 'completed' : 'partial'
        })

    } catch (error) {
        console.error('Error extracting CV metadata:', error)

        return NextResponse.json(
            {
                error: 'Failed to extract CV metadata',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
})
