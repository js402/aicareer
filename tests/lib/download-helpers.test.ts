// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { downloadMarkdown } from '@/lib/download-helpers'
import { cleanMarkdown } from '@/lib/markdown'

// Mock cleanMarkdown
vi.mock('@/lib/markdown', () => ({
    cleanMarkdown: vi.fn((content) => content.trim())
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:url')
global.URL.revokeObjectURL = vi.fn()

describe('downloadMarkdown', () => {
    let createElementSpy: Mock
    let appendChildSpy: Mock
    let clickSpy: Mock

    beforeEach(() => {
        // Mock DOM elements
        clickSpy = vi.fn()
        const anchorMock = {
            style: {},
            href: '',
            download: '',
            setAttribute: vi.fn(),
            click: clickSpy
        } as unknown as HTMLAnchorElement

        createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)
        appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchorMock)
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchorMock)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should download markdown content', () => {
        const content = '# Test Content'
        const filename = 'test.md'

        downloadMarkdown(content, filename, false)

        expect(createElementSpy).toHaveBeenCalledWith('a')
        expect(appendChildSpy).toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalled()
        expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should clean markdown content if clean flag is true', () => {
        const content = '```markdown\n# Test Content\n```'
        const filename = 'test.md'

        downloadMarkdown(content, filename, true)

        expect(cleanMarkdown).toHaveBeenCalledWith(content)
    })
})
