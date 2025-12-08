
/**
 * Parse markdown content into structured sections based on headers.
 * Splits by # header and returns title/content pairs.
 */
export function parseAnalysisSections(markdown: string): { title: string; content: string }[] {
    if (!markdown) return []

    // Split by top-level headers (# Header)
    // The regex looks for # followed by text, capturing the title and the content until the next #
    const sections: { title: string; content: string }[] = []

    // Normalize newlines
    const text = markdown.replace(/\r\n/g, '\n')

    // Check if there are no headers - return as single section
    if (!text.includes('# ')) {
        return [{ title: 'Analysis', content: text }]
    }

    // Split by # Header
    const parts = text.split(/(^|\n)# /).filter(p => p.trim())

    parts.forEach(part => {
        // If part starts with newline or empty, skip or clean
        if (!part.trim()) return

        // First line is title, rest is content
        const firstLineEnd = part.indexOf('\n')
        if (firstLineEnd === -1) {
            // Only title?
            sections.push({ title: part.trim(), content: '' })
        } else {
            const title = part.substring(0, firstLineEnd).trim()
            const content = part.substring(firstLineEnd).trim()
            sections.push({ title, content })
        }
    })

    return sections
}
