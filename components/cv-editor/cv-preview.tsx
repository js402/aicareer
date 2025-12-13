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
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Print Optimized
          </Badge>
        </div>
        
        {/* Preview Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Select value={zoom.toString()} onValueChange={(value) => setZoom(parseFloat(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoomOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={paperSize} 
              onValueChange={(value: keyof typeof PAPER_SIZES) => setPaperSize(value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PAPER_SIZES).map(size => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <div className="h-full border rounded-lg bg-gray-50 overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="CV Preview"
            sandbox="allow-same-origin"
            style={{ 
              backgroundColor: '#f5f5f5',
              minHeight: '600px'
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}