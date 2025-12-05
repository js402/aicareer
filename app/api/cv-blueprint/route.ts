import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/api-middleware'
import { mergeCVIntoBlueprint } from '@/lib/cv-blueprint-merger'

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
            const { data: newBlueprint, error: createError } = await supabase
                .rpc('get_or_create_cv_blueprint', { p_user_id: user.id })

            if (createError) throw createError

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
        }

        return NextResponse.json({
            blueprint,
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
        return NextResponse.json(
            { error: 'Failed to process CV into blueprint' },
            { status: 500 }
        )
    }
})
