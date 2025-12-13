import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Printer, Eye, FileText } from 'lucide-react'
import { generatePrintCSS, PAPER_SIZES } from '@/lib/cv-print-engine'
import type { PrintSettings } from '@/lib/cv-print-engine'

interface CVPreviewProps {
  html: string
  css?: string
  settings?: PrintSettings
  onDownload?: () => void
  className?: string
}

export default function CVPreview({
  html,
  css,
  settings,
  onDownload,
  className = ''
}: CVPreviewProps) {
  const [zoom, setZoom] = useState(0.75)
  const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('A4')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Generate complete CSS with print optimizations
  const completeCSS = React.useMemo(() => {
    const baseCSS = css || (settings ? generatePrintCSS(settings) : '')

    return `
      ${baseCSS}
      
      /* Preview-specific styles */
      .cv-container {
        max-width: none;
        margin: 0;
        padding: ${settings?.margins?.top || 20}mm ${settings?.margins?.right || 20}mm ${settings?.margins?.bottom || 20}mm ${settings?.margins?.left || 20}mm;
        background: white;
        min-height: 100vh;
      }
      
      /* Paper size simulation */
      @media screen {
        body {
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        
        .cv-container {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
          background: white;
          ${PAPER_SIZES[paperSize] ? `
            width: ${PAPER_SIZES[paperSize].width};
            min-height: ${PAPER_SIZES[paperSize].height};
            /* Visual page breaks */
            background-image: linear-gradient(to bottom, transparent calc(${PAPER_SIZES[paperSize].height} - 1px), #dedede calc(${PAPER_SIZES[paperSize].height} - 1px), #dedede ${PAPER_SIZES[paperSize].height});
            background-size: 100% ${PAPER_SIZES[paperSize].height};
          ` : ''}
        }
      }
      
      /* Zoom styles */
      html {
        zoom: ${zoom};
      }
    `
  }, [css, settings, zoom, paperSize])

  // Update iframe content when HTML or CSS changes
  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        // DOCTYPE must be clean
        doc.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CV Preview</title>
            <style>${completeCSS}</style>
          </head>
          <body>
            ${html}
          </body>
          </html>
        `)
        doc.close()
      }
    }
  }, [html, completeCSS])

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownloadPDF = () => {
    // This would integrate with your existing PDF generation
    onDownload?.()
  }

  const zoomOptions = [
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' }
  ]

  return (
    <div className={`flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </h2>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <Select value={zoom.toString()} onValueChange={(value) => setZoom(parseFloat(value))}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zoomOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center text-xs text-muted-foreground">
            <Badge variant="outline" className="h-5 px-1.5 font-normal">
              {PAPER_SIZES[paperSize].name.split(' ')[0]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 text-xs">
            <Printer className="w-3.5 h-3.5 mr-2" />
            Print
          </Button>
          <Button variant="default" size="sm" onClick={handleDownloadPDF} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm">
            <Download className="w-3.5 h-3.5 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900/50 p-8 flex justify-center items-start">
        <div
          className="transition-transform origin-top duration-200 ease-out shadow-2xl"
          style={{
            transform: `scale(${zoom})`,
            marginBottom: '50px' // Extra space for scrolling
          }}
        >
          <iframe
            ref={iframeRef}
            className="bg-white"
            title="CV Preview"
            sandbox="allow-same-origin"
            style={{
              width: PAPER_SIZES[paperSize].width,
              minHeight: PAPER_SIZES[paperSize].height,
              border: 'none',
              // Use CSS variable or calculated visual breaks
            }}
          />
        </div>
      </div>
    </div>
  )
}