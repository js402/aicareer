import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasProAccess } from '@/lib/subscription'
import { withAuth } from '@/lib/api-middleware'

export const POST = withAuth(async (request, { supabase, user }) => {
    try {
        const body = await request.json()
        const {
            company_name,
            position_title,
            job_description,
            job_url,
            location,
            salary_range,
            match_score,
            matching_skills,
            missing_skills,
            recommendations,
            experience_alignment,
            responsibility_alignment,
            employment_type,
            seniority_level
        } = body

        // Validate required fields
        if (!company_name || !position_title || !job_description) {
            return NextResponse.json(
                { error: 'Company name, position title, and job description are required' },
                { status: 400 }
            )
        }

        // Check for existing position
        const { data: existing } = await supabase
            .from('job_positions')
            .select('*')
            .eq('user_id', user.id)
            .eq('company_name', company_name)
            .eq('position_title', position_title)
            .single()

        if (existing) {
            return NextResponse.json(existing)
        }

        // Check position limit for free users
        const isPro = await hasProAccess(supabase, user.id)

        if (!isPro) {
            const { count, error: countError } = await supabase
                .from('job_positions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            if (countError) throw countError

            const FREE_LIMIT = 3
            if (count !== null && count >= FREE_LIMIT) {
                return NextResponse.json(
                    {
                        error: 'Free tier limit reached',
                        details: `Free users can only save up to ${FREE_LIMIT} job positions. Please upgrade to Pro for unlimited positions.`
                    },
                    { status: 403 }
                )
            }
        }

        const { data, error } = await supabase
            .from('job_positions')
            .insert({
                user_id: user.id,
                company_name,
                position_title,
                job_description,
                job_url,
                location,
                salary_range,
                match_score,
                matching_skills,
                missing_skills,
                recommendations,
                experience_alignment,
                responsibility_alignment,
                employment_type,
                seniority_level,
                status: 'saved'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating job position:', error)
        return NextResponse.json(
            { error: 'Failed to create job position' },
            { status: 500 }
        )
    }
})

export const GET = withAuth(async (request, { supabase, user }) => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    try {
        let query = supabase
            .from('job_positions')
            .select('*')
            .eq('user_id', user.id)

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        query = query.order(sort, { ascending: order === 'asc' })

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ positions: data })
    } catch (error) {
        console.error('Error fetching job positions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch job positions' },
            { status: 500 }
        )
    }
})
