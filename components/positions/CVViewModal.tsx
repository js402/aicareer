import { Button } from "@/components/ui/button"
import { Download, Printer, Settings, X, Maximize2, Minimize2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cleanMarkdown } from "@/lib/markdown"
import { CVPrintSettings } from "@/components/positions/cv-print-settings"
import { useCVPrintSettings } from "@/hooks/useCVPrintSettings"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface TailoredCV {
    id: string
    version: number
    tailored_content?: string
}

interface CVViewModalProps {
    cv: TailoredCV | null
    isOpen: boolean
    companyName?: string
    positionTitle?: string
    onClose: () => void
    onDownload: (cvId: string, version: number) => Promise<void>
}

export function CVViewModal({
    cv,
    isOpen,
    companyName,
    positionTitle,
    onClose,
    onDownload
}: CVViewModalProps) {
    const [showSettings, setShowSettings] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPrinting, setIsPrinting] = useState(false)
    const { generateCSS, computeStyles } = useCVPrintSettings()
    const [settingsKey, setSettingsKey] = useState(0)
    const previewRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    // Handle escape key for closing modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isFullscreen) {
                    setIsFullscreen(false)
                } else {
                    onClose()
                }
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, isFullscreen, onClose])

    if (!isOpen || !cv) return null

    const handlePrint = async () => {
        const printContent = document.getElementById('cv-preview-content')
        if (!printContent) return

        setIsPrinting(true)

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            setIsPrinting(false)
            return
        }

        const dynamicCSS = generateCSS()

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${positionTitle || 'CV'} - ${companyName || 'Document'}</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        ${dynamicCSS}
                        
                        /* Additional print optimization */
                        @media print {
                            .page-break {
                                page-break-before: always;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `)

        printWindow.document.close()

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 100))

        printWindow.focus()
        printWindow.print()

        // Close window after print dialog closes
        printWindow.onafterprint = () => {
            printWindow.close()
            setIsPrinting(false)
        }

        // Fallback in case onafterprint doesn't fire
        setTimeout(() => {
            if (!printWindow.closed) {
                printWindow.close()
            }
            setIsPrinting(false)
        }, 1000)
    }

    const handleSettingsChange = () => {
        setSettingsKey(prev => prev + 1)
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    const styles = computeStyles()

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm",
                isFullscreen ? "p-0" : "p-4"
            )}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={modalRef}
                className={cn(
                    "bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col transition-all duration-200",
                    isFullscreen
                        ? "w-full h-full max-w-none max-h-none rounded-none"
                        : "w-full max-w-6xl max-h-[90vh]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                            Tailored CV - Version {cv.version}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                            {companyName && positionTitle
                                ? `${companyName} - ${positionTitle}`
                                : "Previewing generated content"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="hidden sm:flex"
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                            className={showSettings ? "bg-slate-100 dark:bg-slate-800" : ""}
                        >
                            <Settings className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                                {showSettings ? 'Hide Settings' : 'Settings'}
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            disabled={isPrinting}
                        >
                            <Printer className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                                {isPrinting ? 'Printing...' : 'Print / PDF'}
                            </span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="ml-2"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950/30">
                    {/* Settings Panel */}
                    {showSettings && (
                        <div className={cn(
                            "w-full md:w-80 border-r dark:border-slate-800 bg-white dark:bg-slate-900",
                            "overflow-y-auto",
                            isFullscreen ? "md:w-96" : ""
                        )}>
                            <div className="p-4 sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 z-10">
                                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    Print Settings
                                </h4>
                            </div>
                            <div className="p-4">
                                <CVPrintSettings onSettingsChange={handleSettingsChange} />
                            </div>
                        </div>
                    )}

                    {/* Preview Area */}
                    <div
                        className={cn(
                            "flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950",
                            showSettings ? "md:border-l dark:border-slate-800" : ""
                        )}
                        ref={previewRef}
                    >
                        <div className="p-4 md:p-6 lg:p-8 h-full flex items-start justify-center">
                            <div
                                key={settingsKey}
                                className={cn(
                                    "bg-white dark:bg-slate-900 shadow-lg transition-all duration-200",
                                    "print:shadow-none w-full",
                                    isFullscreen
                                        ? "max-w-[210mm]"
                                        : "max-w-[210mm]"
                                )}
                                style={{
                                    padding: styles.contentPadding,
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    minHeight: '297mm'
                                }}
                            >
                                <div
                                    id="cv-preview-content"
                                    className="max-w-none"
                                >
                                    <style>{`
                                        #cv-preview-content {
                                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                            font-size: ${styles.bodySize} !important;
                                            line-height: ${styles.lineHeight} !important;
                                            color: #1a1a1a;
                                        }
                                        #cv-preview-content h1 {
                                            font-size: ${styles.h1Size} !important;
                                            line-height: 1.1 !important;
                                            text-align: center;
                                            margin-bottom: 0.2em !important;
                                            margin-top: 0 !important;
                                            font-weight: 700;
                                            color: #111;
                                        }
                                        #cv-preview-content h1 + p {
                                            text-align: center !important;
                                            color: #444 !important;
                                            font-size: calc(${styles.bodySize} * 0.95) !important;
                                            margin-bottom: 0.6em !important;
                                        }
                                        #cv-preview-content h2 {
                                            font-size: ${styles.h2Size} !important;
                                            margin-top: ${styles.h2MarginTop} !important;
                                            margin-bottom: 0.3em !important;
                                            line-height: 1.2 !important;
                                            font-weight: 700;
                                            text-transform: uppercase;
                                            letter-spacing: 0.03em;
                                            border-bottom: 1.5px solid #333;
                                            padding-bottom: 0.15em;
                                            color: #111;
                                        }
                                        #cv-preview-content h3 {
                                            font-size: ${styles.h3Size} !important;
                                            margin-top: ${styles.h3MarginTop} !important;
                                            margin-bottom: 0.15em !important;
                                            line-height: 1.25 !important;
                                            font-weight: 600;
                                            color: #222;
                                        }
                                        #cv-preview-content p {
                                            margin-bottom: ${styles.pMarginBottom} !important;
                                            margin-top: 0 !important;
                                            color: #333;
                                        }
                                        #cv-preview-content ul {
                                            list-style: none !important;
                                            padding-left: 0 !important;
                                            margin: 0.2em 0 0.4em 0 !important;
                                        }
                                        #cv-preview-content li {
                                            margin-bottom: ${styles.liMarginBottom} !important;
                                            padding-left: 1em !important;
                                            position: relative;
                                            color: #333;
                                        }
                                        #cv-preview-content li::before {
                                            content: "•";
                                            position: absolute;
                                            left: 0;
                                            color: #555;
                                        }
                                        #cv-preview-content strong {
                                            font-weight: 600;
                                            color: #111;
                                        }
                                        #cv-preview-content em {
                                            font-style: italic;
                                            color: #555;
                                        }
                                        #cv-preview-content a {
                                            color: #0066cc;
                                            text-decoration: none;
                                        }
                                        #cv-preview-content hr {
                                            display: none;
                                        }
                                    `}</style>
                                    {cv.tailored_content ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {cleanMarkdown(cv.tailored_content)}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-12 text-muted-foreground">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <Settings className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-medium mb-2">No content available</p>
                                            <p className="text-sm">This CV version doesn&apos;t have tailored content yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 rounded-b-xl">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>Preview mode • A4 size • {styles.bodySize}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="min-w-[80px]"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => onDownload(cv.id, cv.version)}
                            className="min-w-[160px]"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Markdown
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}