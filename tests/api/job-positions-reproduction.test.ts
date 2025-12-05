import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DELETE } from '@/app/api/job-positions/[id]/route'
import { POST as CREATE_POST } from '@/app/api/job-positions/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/api-middleware', () => ({
    withAuth: (handler: any) => async (req: any) => {
        return handler(req, {
            supabase: (global as any).supabaseMock,
            user: { id: 'test-user-id' }
        })
    }
}))

describe('Job Position Deletion & Duplicates', () => {
    let supabaseMock: any

    beforeEach(() => {
        supabaseMock = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: null, error: null })
        }
            ; (global as any).supabaseMock = supabaseMock
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should delete a job position even with circular dependency', async () => {
        // Mock successful delete via global thenable

        const req = new NextRequest('http://localhost/api/job-positions/123', {
            method: 'DELETE'
        })

        const response = await DELETE(req)
        const data = await response.json()

        expect(data).toEqual({ success: true })
        expect(supabaseMock.from).toHaveBeenCalledWith('job_positions')
        expect(supabaseMock.delete).toHaveBeenCalled()
        expect(supabaseMock.eq).toHaveBeenCalledWith('id', '123')
    })

    it('should return existing position if duplicate found', async () => {
        const existingPosition = { id: '123', company_name: 'Test Co', position_title: 'Dev' }

        // Mock finding existing position
        supabaseMock.select.mockReturnValueOnce({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingPosition, error: null })
        })

        const req = new NextRequest('http://localhost/api/job-positions', {
            method: 'POST',
            body: JSON.stringify({
                company_name: 'Test Co',
                position_title: 'Dev',
                job_description: 'Desc'
            })
        })

        const response = await CREATE_POST(req)
        const data = await response.json()

        expect(data).toEqual(existingPosition)
        // Should NOT attempt insert
        expect(supabaseMock.insert).not.toHaveBeenCalled()
    })
})
