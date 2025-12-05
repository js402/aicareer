import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cleanMarkdown } from "@/lib/markdown"

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
    if (!isOpen || !cv) return null

    const handlePrint = () => {
        const printContent = document.getElementById('cv-preview-content')
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>Tailored CV - ${companyName} - ${positionTitle}</title>
                    <style>
                        @page {
                            margin: 2cm;
                            size: A4;
                        }
                        body { 
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333;
                            max-width: 210mm;
                            margin: 0 auto;
                            background: white;
                        }
                        * { box-sizing: border-box; }
                        
                        h1 { 
                            font-size: 24pt; 
                            font-weight: 700; 
                            margin-bottom: 0.5em; 
                            color: #111;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        
                        h2 { 
                            font-size: 16pt; 
                            font-weight: 600; 
                            margin-top: 1.5em; 
                            margin-bottom: 0.75em; 
                            color: #2c3e50;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        h3 { 
                            font-size: 13pt; 
                            font-weight: 600; 
                            margin-top: 1.2em; 
                            margin-bottom: 0.5em; 
                            color: #444;
                        }
                        
                        p { 
                            margin-bottom: 0.8em; 
                            text-align: justify;
                        }
                        
                        ul { 
                            list-style-type: disc; 
                            padding-left: 1.2em; 
                            margin-bottom: 1em; 
                        }
                        
                        li { 
                            margin-bottom: 0.4em; 
                            padding-left: 0.2em;
                        }
                        
                        strong {
                            font-weight: 600;
                            color: #000;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 1em;
                        }
                        
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        
                        th {
                            background-color: #f2f2f2;
                            font-weight: 600;
                        }
                        
                        blockquote {
                            border-left: 4px solid #ccc;
                            margin: 0 0 1em 0;
                            padding-left: 1em;
                            color: #666;
                            font-style: italic;
                        }
                        
                        pre {
                            background-color: #f5f5f5;
                            padding: 10px;
                            border-radius: 4px;
                            overflow-x: auto;
                            margin-bottom: 1em;
                        }
                        
                        code {
                            font-family: 'Courier New', Courier, monospace;
                            background-color: #f5f5f5;
                            padding: 2px 4px;
                            border-radius: 2px;
                            font-size: 0.9em;
                        }
                        
                        pre code {
                            background-color: transparent;
                            padding: 0;
                        }
                        
                        a {
                            color: #2563eb;
                            text-decoration: none;
                        }
                        
                        @media print {
                            body { 
                                padding: 0; 
                                margin: 0;
                                width: 100%;
                            }
                            @page {
                                margin: 1.5cm;
                            }
                            a {
                                text-decoration: none;
                                color: #000;
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
        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                    <div>
                        <h3 className="font-semibold text-lg">
                            Tailored CV - Version {cv.version}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Previewing generated content
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print / PDF
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950/50">
                    <div className="max-w-[210mm] mx-auto bg-white dark:bg-slate-900 shadow-lg p-[20mm] min-h-[297mm]">
                        <div id="cv-preview-content" className="prose dark:prose-invert max-w-none">
                            {cv.tailored_content ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {cleanMarkdown(cv.tailored_content)}
                                </ReactMarkdown>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No content available for this version.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-2 bg-white dark:bg-slate-900 rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={() => onDownload(cv.id, cv.version)}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Markdown
                    </Button>
                </div>
            </div>
        </div>
    )
}
