import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const pdfRequestSchema = z.object({
  html: z.string(),
  css: z.string().optional(),
  settings: z.object({
    paperSize: z.enum(['A4', 'Letter']).optional(),
    margins: z.object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number()
    }).optional()
  }).optional()
})

export async function POST(
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
    const parsed = pdfRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: parsed.error.issues
      }, { status: 400 })
    }

    const { html, css, settings } = parsed.data
    const paperSize = settings?.paperSize || 'A4'
    const margins = settings?.margins || { top: 20, right: 20, bottom: 20, left: 20 }

    // Fetch CV metadata for filename
    const { data: cvMetadata } = await supabase
      .from('cv_metadata')
      .select('extracted_info, display_name')
      .eq('id', id)
      .single()

    let filename = `cv-${id}`
    if (cvMetadata) {
      // extract name from jsonb or use display_name
      const info = typeof cvMetadata.extracted_info === 'string'
        ? JSON.parse(cvMetadata.extracted_info)
        : cvMetadata.extracted_info

      const candidateName = info?.name || cvMetadata.display_name
      if (candidateName) {
        filename = `cv-${candidateName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
      }
    }

    // Build full HTML document with print styles
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV</title>
  <style>
    ${css || ''}
    
    /* PDF-specific optimizations */
    @page {
      size: ${paperSize};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .cv-container {
        background: white;
      }
    }
    
    body {
      margin: 0;
      padding: 0;
      background: white;
    }
  </style>
</head>
<body>
  ${html}
  <script>
    // Auto-trigger print dialog when opened
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`

    // Return HTML as a print-ready page that will trigger browser print dialog
    // User can then print to PDF from their browser
    return new NextResponse(fullHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${filename}.html"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error in POST /api/cv-pdf/[id]:', error)
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
