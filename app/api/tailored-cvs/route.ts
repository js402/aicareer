import { NextResponse } from 'next/server'
import { withProAccess } from '@/lib/api-middleware'
import crypto from 'crypto'

export const POST = withProAccess(async (request, { supabase, user }) => {
    try {
        const body = await request.json()
        const { job_position_id, cv_content, tailored_content } = body

        if (!job_position_id || !cv_content || !tailored_content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (tailored_content.trim().length < 50) {
            return NextResponse.json(
                { error: 'Tailored content is too short or empty' },
                { status: 400 }
            )
        }

        // Calculate hash of original CV
        const original_cv_hash = crypto
            .createHash('sha256')
            .update(cv_content)
            .digest('hex')

        // Get latest version number
        const { data: latestVersion } = await supabase
            .from('tailored_cvs')
            .select('version')
            .eq('job_position_id', job_position_id)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        const nextVersion = (latestVersion?.version || 0) + 1

        // Check version limit (Pro: 5, but for now let's just allow unlimited for Pro)
        // TODO: Implement stricter limits if needed

        const { data, error } = await supabase
            .from('tailored_cvs')
            .insert({
                user_id: user.id,
                job_position_id,
                original_cv_hash,
                tailored_content,
                version: nextVersion,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error saving tailored CV:', error)
        return NextResponse.json(
            { error: 'Failed to save tailored CV' },
            { status: 500 }
        )
    }
})
