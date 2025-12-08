// Update the API route to separate concerns
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';

// Public endpoint for basic validation (no auth)
export async function POST(request: NextRequest) {
  try {
    const { cvContent } = await request.json();

    if (!cvContent || typeof cvContent !== 'string') {
      return NextResponse.json(
        { error: 'CV content is required' },
        { status: 400 }
      );
    }

    // Basic validation only (no extraction)
    return NextResponse.json({
      status: 'valid',
      message: 'CV content is valid for preview',
      contentLength: cvContent.length,
      lineCount: cvContent.split('\n').length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

// Protected endpoint for extraction (requires auth)
export const PUT = withAuth(async (request, { supabase, user }) => {
  try {
    const { cvContent } = await request.json();

    if (!cvContent) {
      return NextResponse.json(
        { error: 'CV content is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('cv_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'processed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached && cached.content_hash === await hashCV(cvContent)) {
      return NextResponse.json({
        status: 'processed',
        extractedInfo: cached.extracted_data,
        message: 'Retrieved from cache'
      });
    }

    // Perform extraction
    const extractionResult = await extractCVMetadataWithAI(cvContent);

    // Store result
    if (extractionResult.extractedInfo) {
      await supabase.from('cv_states').upsert({
        user_id: user.id,
        content_hash: await hashCV(cvContent),
        extracted_data: extractionResult.extractedInfo,
        status: 'processed',
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'processed',
      extractedInfo: extractionResult.extractedInfo,
      questions: extractionResult.missingInfoQuestions
    });
  } catch (error) {
    console.error('Protected extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    );
  }
});

// Helper functions (mock implementations if not imported)
import { extractCVMetadataWithAI } from '@/lib/cv-service';
import { hashCV } from '@/lib/cv-cache';