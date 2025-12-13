import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const layoutUpdateSchema = z.object({
  templateId: z.string(),
  settings: z.object({
    template: z.string().optional(),
    paperSize: z.enum(['A4', 'Letter']).optional(),
    margins: z.object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number()
    }).optional(),
    fontSize: z.object({
      base: z.number(),
      h1: z.number(),
      h2: z.number(),
      h3: z.number()
    }).optional(),
    lineHeight: z.object({
      body: z.number(),
      headings: z.number()
    }).optional(),
    spacing: z.object({
      sectionGap: z.number(),
      paragraphGap: z.number(),
      listItemGap: z.number()
    }).optional(),
    colors: z.object({
      primary: z.string(),
      accent: z.string(),
      text: z.string(),
      muted: z.string()
    }).optional(),
    typography: z.object({
      fontFamily: z.string(),
      headingWeight: z.number(),
      bodyWeight: z.number()
    }).optional(),
    atsMode: z.boolean().optional(),
    twoColumn: z.boolean().optional(),
    accentOpacity: z.number().optional()
  }),
  html: z.string().optional(),
  css: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cv_layouts')
      .select('*')
      .eq('cv_id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching layout:', error)
      return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 })
    }

    // Return default layout if none exists
    if (!data) {
      return NextResponse.json({
        cv_id: id,
        template_id: 'modern',
        settings: null,
        html: null,
        css: null
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/cv-layouts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = layoutUpdateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: parsed.error.issues 
      }, { status: 400 })
    }

    const { templateId, settings, html, css } = parsed.data

    // Check if layout exists
    const { data: existing } = await supabase
      .from('cv_layouts')
      .select('id')
      .eq('cv_id', id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing layout
      const { data, error } = await supabase
        .from('cv_layouts')
        .update({
          template_id: templateId,
          settings,
          html,
          css,
          updated_at: new Date().toISOString()
        })
        .eq('cv_id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating layout:', error)
        return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Insert new layout
      const { data, error } = await supabase
        .from('cv_layouts')
        .insert({
          cv_id: id,
          user_id: user.id,
          template_id: templateId,
          settings,
          html,
          css
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating layout:', error)
        return NextResponse.json({ error: 'Failed to create layout' }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error in PUT /api/cv-layouts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('cv_layouts')
      .delete()
      .eq('cv_id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting layout:', error)
      return NextResponse.json({ error: 'Failed to delete layout' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/cv-layouts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
