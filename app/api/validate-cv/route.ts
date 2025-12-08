import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { cvContent } = await request.json()

        if (!cvContent || typeof cvContent !== 'string') {
            return NextResponse.json(
                { error: 'CV content is required and must be a string' },
                { status: 400 }
            )
        }

        // Basic validation (no AI, no auth required)
        const contentLength = cvContent.length
        const lineCount = cvContent.split('\n').length
        const wordCount = cvContent.split(/\s+/).filter(Boolean).length

        // Simple checks for CV-like content
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cvContent)
        const hasPhone = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/.test(cvContent)
        const hasExperience = /experience|work|employment|job|role|position/i.test(cvContent)
        const hasEducation = /education|degree|university|college|school/i.test(cvContent)

        const isValidCV = contentLength >= 100 && (hasExperience || hasEducation)

        return NextResponse.json({
            status: isValidCV ? 'valid' : 'suspicious',
            message: isValidCV
                ? 'CV content appears valid for preview'
                : 'Content may not be a standard CV format',
            validation: {
                contentLength,
                lineCount,
                wordCount,
                hasEmail,
                hasPhone,
                hasExperience,
                hasEducation
            },
            recommendations: isValidCV ? [] : [
                'Ensure your CV includes work experience or education sections',
                'Include contact information for better analysis',
                'Minimum 100 characters recommended'
            ]
        })
    } catch (error) {
        console.error('Error validating CV:', error)
        return NextResponse.json(
            { error: 'Invalid request format' },
            { status: 400 }
        )
    }
}