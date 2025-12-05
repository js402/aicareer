import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cv-metadata/route'
import { PUT as UPDATE, DELETE as DELETE_ONE } from '@/app/api/cv-metadata/[id]/route'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: vi.fn()
}))

const mockSession = {
    user: { id: 'user_123', email: 'test@example.com' }
}

const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
    },
    from: vi.fn()
}

describe('CV Metadata API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
    })

    describe('GET /api/cv-metadata', () => {
        it('should return user CV metadata', async () => {
            const mockMetadata = [
                {
                    id: 'meta_1',
                    user_id: 'user_123',
                    cv_hash: 'hash123',
                    extracted_info: {
                        name: 'John Doe',
                        contactInfo: 'john@example.com',
                        experience: [{ role: 'Developer', company: 'Acme', duration: '2020-2023' }],
                        skills: ['JavaScript', 'React'],
                        education: [{ degree: 'BS', institution: 'University', year: '2020' }]
                    },
                    extraction_status: 'completed',
                    confidence_score: 0.8,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ]

            const mockRequest = {
                url: 'http://localhost/api/cv-metadata'
            } as unknown as NextRequest

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: mockMetadata, error: null })
                        })
                    })
                })
            })

            const response = await GET(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.metadata).toEqual(mockMetadata)
            expect(data.total).toBe(1)
            expect(data.hasMore).toBe(false)
        })

        it('should handle pagination parameters', async () => {
            const mockRequest = {
                url: 'http://localhost/api/cv-metadata?limit=5&offset=10'
            } as unknown as NextRequest

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: [], error: null })
                        })
                    })
                })
            })

            await GET(mockRequest)

            expect(mockSupabase.from).toHaveBeenCalledWith('cv_metadata')
        })
    })

    describe('PUT /api/cv-metadata/[id]', () => {
        it('should update CV metadata successfully', async () => {
            const updatedInfo = {
                name: 'Jane Doe',
                contactInfo: 'jane@example.com',
                experience: [{ role: 'Senior Developer', company: 'Tech Corp', duration: '2020-2024' }],
                skills: ['JavaScript', 'React', 'Node.js'],
                education: [{ degree: 'MS', institution: 'University', year: '2022' }]
            }

            const mockRequest = {
                json: vi.fn().mockResolvedValue({ extractedInfo: updatedInfo }),
                nextUrl: { pathname: '/api/cv-metadata/meta_123' }
            } as unknown as NextRequest

            // Mock the metadata existence check and update
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'meta_123', user_id: 'user_123' }, error: null })
                })
            })

            const mockUpdate = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'meta_123', extracted_info: updatedInfo },
                            error: null
                        })
                    })
                })
            })

            mockSupabase.from.mockImplementation((table) => {
                if (table === 'cv_metadata') {
                    return {
                        select: mockSelect,
                        update: mockUpdate
                    }
                }
                return {}
            })

            const response = await UPDATE(mockRequest)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.metadata.extracted_info).toEqual(updatedInfo)
        })

        it('should return 404 for non-existent metadata', async () => {
            const mockRequest = {
                json: vi.fn().mockResolvedValue({ extractedInfo: {} }),
                nextUrl: { pathname: '/api/cv-metadata/nonexistent' }
            } as unknown as NextRequest

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                })
            })

            mockSupabase.from.mockReturnValue({
                select: mockSelect
            })

            const response = await UPDATE(mockRequest)
            expect(response.status).toBe(404)
        })

        it('should return 403 for unauthorized access', async () => {
            const mockRequest = {
                json: vi.fn().mockResolvedValue({ extractedInfo: {} }),
                nextUrl: { pathname: '/api/cv-metadata/meta_123' }
            } as unknown as NextRequest

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'meta_123', user_id: 'other_user' }, error: null })
                })
            })

            mockSupabase.from.mockReturnValue({
                select: mockSelect
            })

            const response = await UPDATE(mockRequest)
            expect(response.status).toBe(403)
        })

        it('should return 400 for missing extractedInfo', async () => {
            const mockRequest = {
                json: vi.fn().mockResolvedValue({}),
                nextUrl: { pathname: '/api/cv-metadata/meta_123' }
            } as unknown as NextRequest

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: { id: 'meta_123', user_id: 'user_123' }, error: null })
                })
            })

            const response = await UPDATE(mockRequest)
            expect(response.status).toBe(400)
        })
    })

    describe('DELETE /api/cv-metadata/[id]', () => {
        it('should delete CV metadata successfully', async () => {
            const mockRequest = {
                nextUrl: { pathname: '/api/cv-metadata/meta_123' }
            } as unknown as NextRequest

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'meta_123', user_id: 'user_123' }, error: null })
                })
            })

            const mockDelete = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })

            mockSupabase.from.mockReturnValue({
                select: mockSelect,
                delete: mockDelete
            })

            const response = await DELETE_ONE(mockRequest)
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data.success).toBe(true)
        })

        it('should return 404 for non-existent metadata', async () => {
            const mockRequest = {
                nextUrl: { pathname: '/api/cv-metadata/nonexistent' }
            } as unknown as NextRequest

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                })
            })

            mockSupabase.from.mockReturnValue({
                select: mockSelect
            })

            const response = await DELETE_ONE(mockRequest)
            expect(response.status).toBe(404)
        })

        it('should return 403 for unauthorized access', async () => {
            const mockRequest = {
                nextUrl: { pathname: '/api/cv-metadata/meta_123' }
            } as unknown as NextRequest

            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'meta_123', user_id: 'other_user' }, error: null })
                })
            })

            mockSupabase.from.mockReturnValue({
                select: mockSelect
            })

            const response = await DELETE_ONE(mockRequest)
            expect(response.status).toBe(403)
        })
    })
})
