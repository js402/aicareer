import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as tailorCV } from '@/app/api/tailor-cv/route'
import { POST as saveTailoredCV } from '@/app/api/tailored-cvs/route'
import { NextRequest } from 'next/server'

// Mock OpenAI
vi.mock('@/lib/openai', () => ({
    openai: {
        chat: {
            completions: {
                create: vi.fn()
            }
        }
    }
}))

// Mock api-middleware with withProAccess
vi.mock('@/lib/api-middleware', () => ({
    withProAccess: (handler: (req: NextRequest, context: { supabase: unknown, user: { id: string } }) => Promise<Response>) => async (req: NextRequest) => {
        const globalMock = (global as any)
        if (globalMock.mockProAccessDenied) {
            return new Response(JSON.stringify({ error: 'Pro subscription required' }), { status: 403 })
        }
        return handler(req, {
            supabase: globalMock.mockSupabase,
            user: { id: 'user_123' }
        })
    }
}))

import { openai } from '@/lib/openai'

const mockSession = {
    user: { id: 'user_123', email: 'test@example.com' }
}

const createMockSupabase = () => ({
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
    },
    from: vi.fn().mockImplementation((table) => {
        if (table === 'cv_metadata') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: [{
                        id: 'cv-123',
                        cv_hash: 'hash-123',
                        extracted_info: {
                            name: 'John Doe',
                            contactInfo: { email: 'john@example.com' },
                            experience: [{ title: 'Developer', company: 'Tech Corp', duration: '2020-2024' }],
                            education: [{ degree: 'BS', institution: 'University', year: '2020' }],
                            skills: ['JavaScript', 'React']
                        }
                    }],
                    error: null
                })
            }
        }
        if (table === 'tailored_cvs') {
            return {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'tailored_123', version: 1 },
                    error: null
                })
            }
        }
        return {}
    })
})

describe('Tailored CV API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(global as any).mockProAccessDenied = false
        ;(global as any).mockSupabase = createMockSupabase()
    })

    describe('POST /api/tailor-cv', () => {
        it('should return 403 if user is not pro', async () => {
            ;(global as any).mockProAccessDenied = true

            const mockRequest = {
                json: vi.fn().mockResolvedValue({ jobDescription: 'jd' })
            } as unknown as NextRequest

            const response = await tailorCV(mockRequest)
            expect(response.status).toBe(403)
        })

        it('should generate tailored CV successfully for pro users', async () => {
            const mockRequest = {
                json: vi.fn().mockResolvedValue({ jobDescription: 'jd' })
            } as unknown as NextRequest

            const mockCompletion = {
                choices: [{ message: { content: 'Tailored CV Content' } }]
            }
            vi.mocked(openai.chat.completions.create).mockResolvedValue(mockCompletion as any)

            const response = await tailorCV(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.tailoredCV).toBe('Tailored CV Content')
        })

        it('should strip markdown code blocks from OpenAI response', async () => {
            const mockCompletion = {
                choices: [{
                    message: {
                        content: '```markdown\n# Header\nContent\n```'
                    }
                }]
            }
            vi.mocked(openai.chat.completions.create).mockResolvedValue(mockCompletion as any)

            const mockRequest = {
                json: vi.fn().mockResolvedValue({
                    jobDescription: 'job desc'
                })
            } as unknown as NextRequest

            const response = await tailorCV(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.tailoredCV).toBe('# Header\nContent')
        })
    })

    describe('POST /api/tailored-cvs', () => {
        it('should save tailored CV successfully', async () => {
            const mockBody = {
                job_position_id: 'pos_123',
                cv_content: 'original cv',
                tailored_content: 'This is a tailored CV content that is definitely longer than fifty characters to pass the validation check.'
            }

            const mockRequest = {
                json: vi.fn().mockResolvedValue(mockBody)
            } as unknown as NextRequest

            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'cv_123', ...mockBody }, error: null })
                })
            })

            ;(global as any).mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'tailored_cvs') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                order: vi.fn().mockReturnValue({
                                    limit: vi.fn().mockReturnValue({
                                        single: vi.fn().mockResolvedValue({ data: { version: 1 } })
                                    })
                                })
                            })
                        }),
                        insert: mockInsert
                    }
                }
                return {}
            })

            const response = await saveTailoredCV(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.id).toBe('cv_123')
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                job_position_id: 'pos_123',
                version: 2
            }))
        })

        it('should return 400 if tailored content is too short', async () => {
            const mockBody = {
                job_position_id: 'pos_123',
                cv_content: 'original cv',
                tailored_content: 'too short'
            }

            const mockRequest = {
                json: vi.fn().mockResolvedValue(mockBody)
            } as unknown as NextRequest

            const response = await saveTailoredCV(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe('Tailored content is too short or empty')
        })
    })
})
