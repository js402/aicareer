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
            from: vi.fn(),
            select: vi.fn(),
            eq: vi.fn(),
            single: vi.fn(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            rpc: vi.fn()
        };

        // Mock the CV metadata fetching and job match caching
        supabaseMock.from.mockImplementation((table: string) => {
            if (table === 'cv_metadata') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockResolvedValue({
                        data: [{
                            id: 'cv-metadata-123',
                            cv_hash: 'cv-hash-123',
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
            if (table === 'job_match_analyses') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: supabaseMock.single,
                    insert: supabaseMock.insert
                }
            }
            return supabaseMock
        });

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
            experienceAlignment: {
                seniorityMatch: "Good Fit",
                yearsExperienceRequired: 3,
                yearsExperienceCandidate: 4,
                comment: "Candidate meets experience requirements"
            },
            responsibilityAlignment: {
                matchingResponsibilities: ["Frontend dev"],
                missingResponsibilities: ["Team lead"]
            },
            recommendations: ['Learn Vue'],
            metadata: {
                company_name: "Tech Corp",
                position_title: "Frontend Dev",
                location: "Remote",
                salary_range: "$100k-120k",
                employment_type: "Full-time",
                seniority_level: "Mid"
            }
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
            experienceAlignment: {
                seniorityMatch: "Good Fit",
                yearsExperienceRequired: 5,
                yearsExperienceCandidate: 5,
                comment: "Perfect match"
            },
            responsibilityAlignment: {
                matchingResponsibilities: ["Backend dev"],
                missingResponsibilities: []
            },
            recommendations: [],
            metadata: {
                company_name: "Node Corp",
                position_title: "Backend Dev",
                location: "NY",
                salary_range: "$120k-140k",
                employment_type: "Full-time",
                seniority_level: "Senior"
            }
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
            cv_hash: 'mock-hash', // This will be the blueprint hash now
            job_hash: 'mock-hash',
            match_score: 90,
            analysis_result: newResult
        })
    })
})
