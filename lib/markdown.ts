/**
 * Markdown utility functions
 */

/**
 * Cleans markdown content by removing code block wrappers that may be added by LLMs
 * @param content - The markdown content to clean
 * @returns Cleaned markdown content
 */
export function cleanMarkdown(content: string): string {
    if (!content) return ''

    return content
        .replace(/^```markdown\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '')
        .trim()
}
