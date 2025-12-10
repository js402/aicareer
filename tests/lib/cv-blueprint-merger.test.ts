import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mergeCVIntoBlueprint } from '@/lib/cv-blueprint-merger'

// Mock OpenAI client
vi.mock('@/lib/openai', () => ({
    openai: {
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                newProfile: {
                                    personal: { name: 'John Doe', summary: 'Experienced Dev', languages: ['English', 'German'] },
                                    contact: { email: 'john@example.com' },
                                    experience: [{ role: 'Senior Developer', company: 'New Corp', duration: '2022-2024', confidence: 0.9, sources: ['cv_hash_123'] }],
                                    education: [{ degree: 'MS', institution: 'University', year: '2022', confidence: 0.9, sources: ['cv_hash_123'] }],
                                    skills: [{ name: 'JavaScript', confidence: 0.9, sources: ['cv_hash_123'] }],
                                    projects: [{ name: 'Project A', description: 'Desc A', technologies: ['React'], confidence: 0.9, sources: ['cv_hash_123'] }],
                                    certifications: [{ name: 'Certified Dev', issuer: 'Issuer', year: '2023', confidence: 0.9, sources: ['cv_hash_123'] }]
                                },
                                changes: [
                                    { type: 'project', description: 'Added Project A', impact: 0.2 },
                                    { type: 'certification', description: 'Added Certified Dev', impact: 0.2 },
                                    { type: 'personal', description: 'Updated summary', impact: 0.1 }
                                ],
                                summary: {
                                    newSkills: 0,
                                    newExperience: 1,
                                    newEducation: 1,
                                    newProjects: 1,
                                    newCertifications: 1,
                                    updatedFields: 1
                                }
                            })
                        }
                    }]
                })
            }
        }
    },
    DEFAULT_MODEL: 'gpt-4o'
}))

const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn()
}

describe('CV Blueprint Merger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Set up default RPC mock for each test
        mockSupabase.rpc.mockResolvedValue({ data: 'blueprint-123', error: null })
    })

    describe('mergeCVIntoBlueprint', () => {
        it('should merge new CV data including projects and certifications', async () => {
            const existingBlueprint = {
                id: 'blueprint_123',
                profile_data: {
                    personal: { name: 'John Doe' },
                    contact: { email: 'john@example.com' },
                    experience: [],
                    education: [],
                    skills: [],
                    projects: [],
                    certifications: []
                },
                total_cvs_processed: 1,
                blueprint_version: 1,
                confidence_score: 0.7,
                data_completeness: 0.5
            }

            const newCV = {
                name: 'John Doe',
                contactInfo: { email: 'john@example.com' },
                experience: [],
                skills: [],
                education: [],
                projects: [{ name: 'Project A', description: 'Desc A', technologies: ['React'] }],
                certifications: [{ name: 'Certified Dev', issuer: 'Issuer', year: '2023' }],
                languages: ['English', 'German'],
                summary: 'Experienced Dev'
            }

            // Mock existing blueprint fetch
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'cv_blueprints') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: existingBlueprint, error: null })
                            })
                        }),
                        update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({ data: { ...existingBlueprint, blueprint_version: 2 }, error: null })
                                })
                            })
                        })
                    }
                }
                return {}
            })

            // Mock change recording - the RPC should return different values for different calls
            mockSupabase.rpc.mockImplementation((functionName) => {
                if (functionName === 'get_or_create_cv_blueprint') {
                    return Promise.resolve({ data: 'blueprint-123', error: null })
                }
                // For change recording
                return Promise.resolve(null)
            })

            const result = await mergeCVIntoBlueprint(mockSupabase as any, 'user_123', newCV, 'cv_hash_123')

            expect(result.blueprint).toBeDefined()
            expect(result.changes.length).toBeGreaterThan(0)
            expect(result.mergeSummary.newProjects).toBe(1)
            expect(result.mergeSummary.newCertifications).toBe(1)
            expect(mockSupabase.rpc).toHaveBeenCalledWith('record_blueprint_change', expect.any(Object))
        })

        it('should create new blueprint if none exists', async () => {
            const newCV = {
                name: 'Jane Smith',
                contactInfo: { email: 'jane@example.com' },
                experience: [{ role: 'Developer', company: 'Tech Corp', duration: '2020-2024' }],
                skills: ['Python', 'Django'],
                education: [{ degree: 'BS', institution: 'College', year: '2020' }],
                projects: [],
                certifications: [],
                languages: [],
                summary: ''
            }

            const newBlueprint = {
                id: 'new_blueprint_123',
                profile_data: {
                    personal: { name: 'Jane Smith', languages: [] },
                    contact: { email: 'jane@example.com' },
                    experience: [expect.objectContaining({ role: 'Developer' })],
                    education: [expect.objectContaining({ degree: 'BS' })],
                    skills: [expect.objectContaining({ name: 'Python' })],
                    projects: [],
                    certifications: []
                },
                total_cvs_processed: 1,
                blueprint_version: 1,
                confidence_score: expect.any(Number),
                data_completeness: expect.any(Number)
            }

            // Mock no existing blueprint initially
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'cv_blueprints') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: null, error: null })
                            })
                        }),
                        update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({ data: newBlueprint, error: null })
                                })
                            })
                        })
                    }
                }
                return {}
            })

            // Mock RPC to return blueprint ID
            mockSupabase.rpc.mockResolvedValue({ data: 'new_blueprint_123', error: null })

            const result = await mergeCVIntoBlueprint(mockSupabase as any, 'user_123', newCV, 'cv_hash_123')

            expect(result.blueprint).toBeDefined()
            expect(result.blueprint.id).toBe('new_blueprint_123')
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_cv_blueprint', { p_user_id: 'user_123' })
        })
    })
})
