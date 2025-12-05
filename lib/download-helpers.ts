/**
 * File download helper functions
 */
import { cleanMarkdown } from './markdown'

/**
 * Downloads text content as a file
 * @param content - The text content to download
 * @param filename - The name of the file to download
 * @param mimeType - Optional MIME type (defaults to text/plain)
 */
export function downloadTextFile(
    content: string,
    filename: string,
    mimeType: string = 'text/plain'
): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    a.setAttribute('download', filename)

    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, 100)
}

/**
 * Downloads markdown content as a file, with optional cleaning
 * @param content - The markdown content to download
 * @param filename - The name of the file to download
 * @param clean - Whether to clean the markdown before downloading
 */
export function downloadMarkdown(
    content: string,
    filename: string,
    clean: boolean = true
): void {
    let processedContent = content

    if (clean) {
        processedContent = cleanMarkdown(content)
    }

    downloadTextFile(processedContent, filename, 'text/markdown;charset=utf-8')
}
