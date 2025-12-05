import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { POST } from '@/app/api/evaluate-job-match/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/openai', () => ({
    openai: {
        chat: {
            completions: {
                create: vi.fn()
            }
        }
    },
    DEFAULT_MODEL: 'gpt-4o'
}))

// Mock middleware to just execute the handler with mocked context
vi.mock('@/lib/api-middleware', () => ({
    withProAccess: (handler: (req: NextRequest, context: { supabase: unknown, user: { id: string } }) => Promise<Response>) => async (req: NextRequest) => {
        return handler(req, {
            supabase: (global as any).supabaseMock,
            user: { id: 'test-user-id' }
        })
    }
}))

// Mock crypto
vi.mock('crypto', () => ({
    createHash: () => ({
        update: () => ({
            digest: () => 'mock-hash'
        })
    })
}))

describe('evaluate-job-match API', () => {
    let supabaseMock: any

    beforeEach(() => {
        // Setup Supabase mock
        supabaseMock = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            insert: vi.fn().mockResolvedValue({ error: null })
        };
        (global as any).supabaseMock = supabaseMock
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return cached result if found', async () => {
        const cachedResult = {
            matchScore: 85,
            matchingSkills: ['React'],
            missingSkills: ['Vue'],
            recommendations: ['Learn Vue'],
            metadata: {}
        }

        // Mock cache hit
        supabaseMock.single.mockResolvedValue({
            data: {
                analysis_result: cachedResult,
                created_at: '2023-01-01T00:00:00Z'
            },
            error: null
        })

        const req = new NextRequest('http://localhost/api/evaluate-job-match', {
            method: 'POST',
            body: JSON.stringify({
                cvContent: 'CV Content',
                jobDescription: 'Job Description'
            })
        })

        const response = await POST(req)
        const data = await response.json()

        expect(data).toEqual({
            ...cachedResult,
            fromCache: true,
            cachedAt: '2023-01-01T00:00:00Z'
        })

        // Verify OpenAI was NOT called
        const { openai } = await import('@/lib/openai')
        expect(openai.chat.completions.create).not.toHaveBeenCalled()
    })

    it('should call OpenAI and cache result if not found', async () => {
        const newResult = {
            matchScore: 90,
            matchingSkills: ['Node.js'],
            missingSkills: [],
            recommendations: [],
            metadata: {}
        }

        // Mock cache miss
        supabaseMock.single.mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
        })

        // Mock OpenAI response
        const { openai } = await import('@/lib/openai')
            ; (openai.chat.completions.create as Mock).mockResolvedValue({
                choices: [{
                    message: {
                        content: JSON.stringify(newResult)
                    }
                }]
            })

        const req = new NextRequest('http://localhost/api/evaluate-job-match', {
            method: 'POST',
            body: JSON.stringify({
                cvContent: 'CV Content',
                jobDescription: 'Job Description'
            })
        })

        const response = await POST(req)
        const data = await response.json()

        expect(data).toEqual(newResult)

        // Verify OpenAI WAS called
        expect(openai.chat.completions.create).toHaveBeenCalled()

        // Verify result was cached
        expect(supabaseMock.from).toHaveBeenCalledWith('job_match_analyses')
        expect(supabaseMock.insert).toHaveBeenCalledWith({
            user_id: 'test-user-id',
            cv_hash: 'mock-hash',
            job_hash: 'mock-hash',
            match_score: 90,
            analysis_result: newResult
        })
    })
})
