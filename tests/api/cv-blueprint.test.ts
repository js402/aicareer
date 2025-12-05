import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/cv-blueprint/route'
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
    from: vi.fn(),
    rpc: vi.fn()
}

describe('CV Blueprint API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
    })

    describe('GET /api/cv-blueprint', () => {
        it('should return existing blueprint', async () => {
            const mockBlueprint = {
                id: 'blueprint_123',
                user_id: 'user_123',
                profile_data: {
                    personal: { name: 'John Doe' },
                    contact: { email: 'john@example.com' },
                    experience: [],
                    education: [],
                    skills: ['JavaScript']
                },
                total_cvs_processed: 2,
                confidence_score: 0.8,
                data_completeness: 0.75,
                blueprint_version: 3,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z'
            }

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockBlueprint, error: null })
            })

            const request = new NextRequest('http://localhost/api/cv-blueprint')
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.blueprint).toEqual(mockBlueprint)
            expect(data.isNew).toBe(false)
        })

        it('should create new blueprint if none exists', async () => {
            const newBlueprintId = 'new_blueprint_123'
            const mockBlueprint = {
                id: newBlueprintId,
                user_id: 'user_123',
                profile_data: {
                    personal: {},
                    contact: {},
                    experience: [],
                    education: [],
                    skills: []
                },
                total_cvs_processed: 0,
                confidence_score: 0.0,
                data_completeness: 0.0,
                blueprint_version: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            }

            // Mock blueprint creation
            mockSupabase.rpc.mockResolvedValue(newBlueprintId)
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'cv_blueprints') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValueOnce({ data: null, error: null })
                            .mockResolvedValueOnce({ data: mockBlueprint, error: null })
                    }
                }
                return {}
            })

            const request = new NextRequest('http://localhost/api/cv-blueprint')
            const response = await GET(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.blueprint).toEqual(mockBlueprint)
            expect(data.isNew).toBe(true)
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_cv_blueprint', { p_user_id: 'user_123' })
        })
    })

    describe('POST /api/cv-blueprint', () => {
        it('should process CV into blueprint successfully', async () => {
            const cvMetadata = {
                name: 'Jane Doe',
                contactInfo: { email: 'jane@example.com' },
                experience: [{ role: 'Senior Developer', company: 'Tech Corp', duration: '2020-2024' }],
                skills: ['JavaScript', 'React', 'Node.js'],
                education: [{ degree: 'BS', institution: 'University', year: '2020' }]
            }

            const mergeResult = {
                success: true,
                blueprint: { id: 'blueprint_123', profile_data: {} },
                changes: [{ type: 'skill', description: 'Added new skill: Node.js', impact: 0.1 }],
                mergeSummary: {
                    newSkills: 1,
                    newExperience: 1,
                    newEducation: 0,
                    updatedFields: 0,
                    confidence: 0.85
                }
            }

            // Mock the blueprint operations
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'cv_blueprints') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: 'blueprint_123' }, error: null })
                    }
                }
                return {}
            })

            // Mock the mergeCVIntoBlueprint function
            vi.doMock('@/lib/cv-blueprint-merger', () => ({
                mergeCVIntoBlueprint: vi.fn().mockResolvedValue(mergeResult)
            }))

            const request = new NextRequest('http://localhost/api/cv-blueprint', {
                method: 'POST',
                body: JSON.stringify({ cvMetadata, cvHash: 'hash123' })
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toEqual(mergeResult)
        })

        it('should return 400 for missing CV metadata', async () => {
            const request = new NextRequest('http://localhost/api/cv-blueprint', {
                method: 'POST',
                body: JSON.stringify({})
            })

            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })
})
