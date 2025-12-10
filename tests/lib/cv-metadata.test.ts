import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    getCachedCVMetadata,
    storeCVMetadata,
    getUserCVMetadata,
    updateMetadataTimestamp,
    deleteCVMetadata
} from '@/lib/cv-metadata'

// Mock cv-blueprint-merger to avoid OpenAI dependency
vi.mock('@/lib/cv-blueprint-merger', () => ({
    mergeCVIntoBlueprint: vi.fn().mockResolvedValue({})
}))

const mockSupabase = {
    from: vi.fn()
}

describe('CV Metadata Library', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getCachedCVMetadata', () => {
        it('should return cached metadata', async () => {
            const mockMetadata = {
                id: 'meta_123',
                user_id: 'user_123',
                cv_hash: 'hash123',
                extracted_info: { name: 'John Doe' },
                extraction_status: 'completed',
                confidence_score: 0.8,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            }

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: mockMetadata, error: null })
                        })
                    })
                })
            })

            const result = await getCachedCVMetadata(mockSupabase as any, 'user_123', 'hash123')
            expect(result).toEqual(mockMetadata)
        })

        it('should return null when no cached metadata exists', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: null, error: null })
                        })
                    })
                })
            })

            const result = await getCachedCVMetadata(mockSupabase as any, 'user_123', 'hash123')
            expect(result).toBeNull()
        })
    })

    describe('storeCVMetadata', () => {
        it('should store new metadata', async () => {
            const extractedInfo = {
                name: 'John Doe',
                contactInfo: 'john@example.com',
                experience: [{ role: 'Developer', company: 'Acme', duration: '2020-2023' }],
                skills: ['JavaScript'],
                education: [{ degree: 'BS', institution: 'University', year: '2020' }],
                projects: [],
                certifications: [],
                languages: [],
                summary: ''
            }

            const mockResult = {
                id: 'meta_123',
                user_id: 'user_123',
                cv_hash: 'hash123',
                extracted_info: extractedInfo,
                extraction_status: 'completed',
                confidence_score: 0.8,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            }

            mockSupabase.from.mockReturnValue({
                upsert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockResult, error: null })
                    })
                })
            })

            const result = await storeCVMetadata(
                mockSupabase as any,
                'user_123',
                'hash123',
                extractedInfo,
                'completed',
                0.8
            )

            expect(result).toEqual(mockResult)
            expect(mockSupabase.from).toHaveBeenCalledWith('cv_metadata')
        })

        it('should handle storage errors', async () => {
            const extractedInfo = {
                name: 'John Doe',
                contactInfo: 'john@example.com',
                experience: [],
                skills: [],
                education: [],
                projects: [],
                certifications: [],
                languages: [],
                summary: ''
            }

            mockSupabase.from.mockReturnValue({
                upsert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Storage failed' }
                        })
                    })
                })
            })

            await expect(storeCVMetadata(
                mockSupabase as any,
                'user_123',
                'hash123',
                extractedInfo
            )).rejects.toThrow('Storage failed')
        })
    })

    describe('getUserCVMetadata', () => {
        it('should return user metadata list', async () => {
            const mockMetadata = [
                { id: 'meta_1', user_id: 'user_123' },
                { id: 'meta_2', user_id: 'user_123' }
            ]

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: mockMetadata, error: null })
                        })
                    })
                })
            })

            const result = await getUserCVMetadata(mockSupabase as any, 'user_123')
            expect(result).toEqual(mockMetadata)
        })

        it('should handle database errors', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Database error' }
                            })
                        })
                    })
                })
            })

            await expect(getUserCVMetadata(mockSupabase as any, 'user_123')).rejects.toThrow('Database error')
        })
    })

    describe('updateMetadataTimestamp', () => {
        it('should update timestamp', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            })

            await expect(updateMetadataTimestamp(mockSupabase as any, 'meta_123')).resolves.toBeUndefined()
        })

        it('should handle update errors', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
                })
            })

            // Should not throw, just log warning
            await expect(updateMetadataTimestamp(mockSupabase as any, 'meta_123')).resolves.toBeUndefined()
        })
    })

    describe('deleteCVMetadata', () => {
        it('should delete metadata', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                })
            })

            await expect(deleteCVMetadata(mockSupabase as any, 'user_123', 'hash123')).resolves.toBeUndefined()
        })

        it('should handle deletion errors', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: { message: 'Deletion failed' } })
                    })
                })
            })

            await expect(deleteCVMetadata(mockSupabase as any, 'user_123', 'hash123')).rejects.toThrow('Deletion failed')
        })
    })
})
