import { describe, it, expect } from 'vitest'
import { cleanMarkdown } from '@/lib/markdown'

describe('cleanMarkdown', () => {
    it('should remove markdown code block wrappers', () => {
        const input = '```markdown\n# Header\nContent\n```'
        const expected = '# Header\nContent'
        expect(cleanMarkdown(input)).toBe(expected)
    })

    it('should remove generic code block wrappers', () => {
        const input = '```\n# Header\nContent\n```'
        const expected = '# Header\nContent'
        expect(cleanMarkdown(input)).toBe(expected)
    })

    it('should handle content without wrappers', () => {
        const input = '# Header\nContent'
        const expected = '# Header\nContent'
        expect(cleanMarkdown(input)).toBe(expected)
    })

    it('should trim whitespace', () => {
        const input = '  # Header\nContent  '
        const expected = '# Header\nContent'
        expect(cleanMarkdown(input)).toBe(expected)
    })

    it('should return empty string for empty input', () => {
        expect(cleanMarkdown('')).toBe('')
    })
})
