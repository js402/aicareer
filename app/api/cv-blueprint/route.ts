import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { mergeCVIntoBlueprint, calculateConfidenceScore, calculateDataCompleteness, type BlueprintProfile } from '@/lib/cv-blueprint-merger'

// GET /api/cv-blueprint - Get user's CV blueprint
export const GET = withAuth(async (request, { supabase, user }) => {
    try {
        const { data: blueprint, error } = await supabase
            .from('cv_blueprints')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error
        }

        if (!blueprint) {
            // Create initial blueprint if it doesn't exist
            try {
                const { data: newBlueprint, error: createError } = await supabase
                    .rpc('get_or_create_cv_blueprint', { p_user_id: user.id })

                if (createError) {
                    // Check if the error is because the function doesn't exist (not in test environment)
                    if (createError.message?.includes('function') &&
                        createError.message?.includes('does not exist') &&
                        process.env.NODE_ENV !== 'test') {
                        return NextResponse.json(
                            {
                                error: 'Database setup incomplete. Please run Supabase migrations.',
                                setupRequired: true,
                                help: 'Run: supabase db push'
                            },
                            { status: 503 }
                        )
                    }
                    throw createError
                }

                // Fetch the created blueprint
                const { data: createdBlueprint, error: fetchError } = await supabase
                    .from('cv_blueprints')
                    .select('*')
                    .eq('id', newBlueprint)
                    .single()

                if (fetchError) throw fetchError

                return NextResponse.json({
                    blueprint: createdBlueprint,
                    isNew: true
                })
            } catch (error) {
                if (error instanceof Error &&
                    (error.message.includes('Database setup') || error.message.includes('migrations')) &&
                    process.env.NODE_ENV !== 'test') {
                    return NextResponse.json(
                        {
                            error: error.message,
                            setupRequired: true,
                            help: 'Run: supabase db push'
                        },
                        { status: 503 }
                    )
                }
                throw error
            }
        }

        // Calculate display percentages
        const blueprintWithCalculations = {
            ...blueprint,
            displayPercentages: {
                confidencePercent: Math.round((blueprint.confidence_score || 0) * 100),
                completenessPercent: Math.round((blueprint.data_completeness || 0) * 100)
            }
        }

        return NextResponse.json({
            blueprint: blueprintWithCalculations,
            isNew: false
        })
    } catch (error) {
        console.error('Error fetching CV blueprint:', error)
        return NextResponse.json(
            { error: 'Failed to fetch CV blueprint' },
            { status: 500 }
        )
    }
})

// POST /api/cv-blueprint - Process new CV into blueprint
export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const { cvMetadata, cvHash } = await request.json()

        if (!cvMetadata) {
            return NextResponse.json(
                { error: 'CV metadata is required' },
                { status: 400 }
            )
        }

        // Merge the CV into the blueprint
        const result = await mergeCVIntoBlueprint(supabase, user.id, cvMetadata, cvHash)

        return NextResponse.json({
            success: true,
            blueprint: result.blueprint,
            changes: result.changes,
            mergeSummary: result.mergeSummary
        })
    } catch (error) {
        console.error('Error processing CV into blueprint:', error)

        // Check if it's a database setup error
        const errorMessage = error instanceof Error ? error.message : 'Failed to process CV into blueprint'
        const isSetupError = errorMessage.includes('Database setup') || errorMessage.includes('migrations')

        return NextResponse.json(
            {
                error: errorMessage,
                setupRequired: isSetupError,
                help: isSetupError ? 'Run: supabase db push' : undefined
            },
            { status: isSetupError ? 503 : 500 } // 503 Service Unavailable for setup issues
        )
    }
})

// PUT /api/cv-blueprint - Manually update blueprint data
export const PUT = withAuth(async (request, { supabase, user }) => {
    try {
        const { profileData } = await request.json()

        if (!profileData) {
            return NextResponse.json(
                { error: 'Profile data is required' },
                { status: 400 }
            )
        }

        // Calculate new metrics
        const dataCompleteness = calculateDataCompleteness(profileData as BlueprintProfile)
        const confidenceScore = calculateConfidenceScore(profileData as BlueprintProfile, 0)

        // Update database
        const { data: updatedBlueprint, error } = await supabase
            .from('cv_blueprints')
            .update({
                profile_data: profileData,
                confidence_score: confidenceScore,
                data_completeness: dataCompleteness,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            blueprint: updatedBlueprint,
            success: true
        })
    } catch (error) {
        console.error('Error updating CV blueprint:', error)
        return NextResponse.json(
            { error: 'Failed to update blueprint' },
            { status: 500 }
        )
    }
})
