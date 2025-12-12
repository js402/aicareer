import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/job-positions/route'
import { GET as GET_ONE, PATCH, DELETE } from '@/app/api/job-positions/[id]/route'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: vi.fn()
}))

// Mock Subscription check
vi.mock('@/lib/subscription', () => ({
    hasProAccess: vi.fn().mockResolvedValue(true)
}))

const mockSession = {
    user: { id: 'user_123', email: 'test@example.com' }
}

const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
    },
    from: vi.fn().mockImplementation((tableName) => {
        if (tableName === 'subscriptions') {
            const selectResult = {
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: { status: 'active' }, error: null })
                        })
                    })
                })
            }
            return {
                select: vi.fn().mockReturnValue(selectResult)
            }
        }
        return {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            }),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
        }
    })
}

describe('Job Positions API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
    })

    describe('POST /api/job-positions', () => {
        it('should create a job position successfully', async () => {
            const mockBody = {
                company_name: 'Acme Corp',
                position_title: 'Developer',
                job_description: 'Write code'
            }

            const mockRequest = {
                json: vi.fn().mockResolvedValue(mockBody)
            } as unknown as NextRequest

            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'pos_123', ...mockBody }, error: null })
                })
            })

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }),
                insert: mockInsert
            })

            const response = await POST(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual({ id: 'pos_123', ...mockBody })
            expect(mockSupabase.from).toHaveBeenCalledWith('job_positions')
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: mockSession.user.id,
                status: 'saved'
            }))
        })

        it('should return 400 if required fields are missing', async () => {
            const mockRequest = {
                json: vi.fn().mockResolvedValue({})
            } as unknown as NextRequest

            const response = await POST(mockRequest)
            expect(response.status).toBe(400)
        })
    })

    describe('GET /api/job-positions', () => {
        it('should list job positions', async () => {
            const mockPositions = [{ id: 'pos_1' }, { id: 'pos_2' }]
            const mockRequest = {
                url: 'http://localhost/api/job-positions'
            } as unknown as NextRequest

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockPositions, error: null })
                    })
                })
            })

            const response = await GET(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.positions).toEqual(mockPositions)
        })
    })

    describe('GET /api/job-positions/[id]', () => {
        it('should get position details', async () => {
            const mockPosition = { id: 'pos_123', title: 'Dev' }
            const mockCVs = [{ id: 'cv_1' }]

            // Mock position query
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'job_positions') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({ data: mockPosition, error: null })
                                })
                            })
                        })
                    }
                }
                if (table === 'tailored_cvs') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    order: vi.fn().mockResolvedValue({ data: mockCVs, error: null })
                                })
                            })
                        })
                    }
                }
                return {}
            })

            const mockRequest = {
                nextUrl: { pathname: '/api/job-positions/pos_123' }
            } as unknown as NextRequest
            const response = await GET_ONE(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual({ ...mockPosition, tailored_cvs: mockCVs })
        })
    })

    describe('PATCH /api/job-positions/[id]', () => {
        it('should update position', async () => {
            const mockBody = { status: 'applied' }

            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 'pos_123', status: 'applied' }, error: null })
                            })
                        })
                    })
                })
            })

            const patchMockRequest = {
                json: vi.fn().mockResolvedValue(mockBody),
                nextUrl: { pathname: '/api/job-positions/pos_123' }
            } as unknown as NextRequest
            const response = await PATCH(patchMockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.status).toBe('applied')
        })

        it('should update submitted_cv_id', async () => {
            const mockBody = { submitted_cv_id: '123e4567-e89b-12d3-a456-426614174000', status: 'applied' }

            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: 'pos_123', status: 'applied', submitted_cv_id: '123e4567-e89b-12d3-a456-426614174000' },
                                    error: null
                                })
                            })
                        })
                    })
                })
            })

            const patchMockRequest = {
                json: vi.fn().mockResolvedValue(mockBody),
                nextUrl: { pathname: '/api/job-positions/pos_123' }
            } as unknown as NextRequest
            const response = await PATCH(patchMockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.submitted_cv_id).toBe('123e4567-e89b-12d3-a456-426614174000')
        })
    })

    describe('DELETE /api/job-positions/[id]', () => {
        it('should delete position', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                })
            })

            const deleteMockRequest = {
                nextUrl: { pathname: '/api/job-positions/pos_123' }
            } as unknown as NextRequest
            const response = await DELETE(deleteMockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
        })
    })
})
