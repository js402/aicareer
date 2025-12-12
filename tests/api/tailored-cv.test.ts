import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as tailorCV } from '@/app/api/tailor-cv/route'
import { POST as saveTailoredCV } from '@/app/api/tailored-cvs/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: vi.fn()
}))

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

// Mock Subscription check
vi.mock('@/lib/subscription', () => ({
    hasProAccess: vi.fn()
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'
import { hasProAccess } from '@/lib/subscription'

const mockSession = {
    user: { id: 'user_123', email: 'test@example.com' }
}

const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
    },
    from: vi.fn().mockImplementation((table) => {
        if (table === 'tailored_cvs') {
            return {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'tailored_123' },
                    error: null
                })
            }
        }
        return {}
    })
}

describe('Tailored CV API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
    })

    describe('POST /api/tailor-cv', () => {
        it('should return 403 if user is not pro', async () => {
            vi.mocked(hasProAccess).mockResolvedValue(false)

            const mockRequest = {
                json: vi.fn().mockResolvedValue({ cvContent: 'cv', jobDescription: 'jd' })
            } as unknown as NextRequest

            const response = await tailorCV(mockRequest)
            expect(response.status).toBe(403)
        })

        it('should generate tailored CV successfully for pro users', async () => {
            vi.mocked(hasProAccess).mockResolvedValue(true)

            const mockRequest = {
                json: vi.fn().mockResolvedValue({ cvContent: 'cv', jobDescription: 'jd' })
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
            vi.mocked(hasProAccess).mockResolvedValue(true)

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
                    cvContent: 'original cv',
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
            vi.mocked(hasProAccess).mockResolvedValue(true)

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

            mockSupabase.from.mockImplementation((table) => {
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
            vi.mocked(hasProAccess).mockResolvedValue(true)

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
