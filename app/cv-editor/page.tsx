'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Wand2,
  FileText,
  Download,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react'
import CVLayoutEditor from '@/components/cv-editor/cv-layout-editor'
import CVPreview from '@/components/cv-editor/cv-preview'
import { renderCVWithTemplate, CV_TEMPLATES } from '@/lib/cv-templates'
import { generatePrintCSS, PrintSettings } from '@/lib/cv-print-engine'
import type { ExtractedCVInfo } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useAuthGuard } from '@/hooks/useAuthGuard'

import { Navbar } from '@/components/navbar'

function CVEditorPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cvId = searchParams.get('id')
  const { toast } = useToast()
  const { isLoading: authLoading } = useAuthGuard()

  const [cvData, setCvData] = useState<ExtractedCVInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(
    CV_TEMPLATES.modern.styles
  )
  const [previewHTML, setPreviewHTML] = useState('')
  const [previewCSS, setPreviewCSS] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Fetch CV data
  useEffect(() => {
    if (!cvId || authLoading) return

    async function fetchCV() {
      try {
        const response = await fetch(`/api/cv-metadata/${cvId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch CV data')
        }
        const data = await response.json()

        // Parse extractedInfo if it's a string
        const extractedInfo = typeof data.extractedInfo === 'string'
          ? JSON.parse(data.extractedInfo)
          : data.extractedInfo

        setCvData(extractedInfo)

        // Also try to fetch saved layout
        const layoutRes = await fetch(`/api/cv-layouts/${cvId}`)
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json()
          if (layoutData.template_id) {
            setSelectedTemplate(layoutData.template_id)
            if (layoutData.settings) {
              setPrintSettings(layoutData.settings)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching CV:', err)
        setError(err instanceof Error ? err.message : 'Failed to load CV')
      } finally {
        setLoading(false)
      }
    }

    fetchCV()
  }, [cvId, authLoading])

  // Generate preview when CV data or settings change
  useEffect(() => {
    if (cvData) {
      generatePreview(selectedTemplate, printSettings)
    }
  }, [cvData, selectedTemplate, printSettings])

  const generatePreview = useCallback((templateId: string, settings: PrintSettings) => {
    if (!cvData) return

    try {
      const html = renderCVWithTemplate(cvData, templateId, settings)
      const css = generatePrintCSS(settings)
      setPreviewHTML(html)
      setPreviewCSS(css)
    } catch (error) {
      console.error('Preview generation failed:', error)
    }
  }, [cvData])

  const handleLayoutChange = useCallback((templateId: string, settings: PrintSettings) => {
    setSelectedTemplate(templateId)
    setPrintSettings(settings)
  }, [])

  const handlePreview = useCallback((html: string, css: string) => {
    setPreviewHTML(html)
    setPreviewCSS(css)
  }, [])

  const handleSave = async () => {
    if (!cvId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/cv-layouts/${cvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          settings: printSettings,
          html: previewHTML,
          css: previewCSS
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save layout')
      }

      toast({
        title: "Layout Saved",
        description: "Your CV layout has been saved successfully",
      })
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "Save Error",
        description: "Failed to save CV layout",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!cvId || !previewHTML) return

    // Open the server-generated print view in a new tab
    // The server ensures the correct filename in the title/headers
    // This allows the user to use the browser's native "Save as PDF" which is reliable
    const printUrl = `/api/cv-pdf/${cvId}`

    // We can POST the settings if we want to support unsaved changes, 
    // but a GET/link is simpler if we save first or simple pass params URL encoded.
    // However, the current API is POST. Let's create a form submit or use the POST approach.

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/cv-pdf/${cvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: previewHTML,
          css: previewCSS,
          settings: printSettings
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF view')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Open in new tab for printing
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          // The HTML itself has window.print() in onload
        }
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to view the print version.",
          variant: "destructive"
        })
      }

      // Cleanup URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000)

    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Error",
        description: "Failed to open print view.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-3">
              <div className="h-96 w-full bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="xl:col-span-2">
              <div className="h-[600px] w-full bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !cvData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error Loading CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {error || 'No CV data found. Please upload a CV first.'}
            </p>
            <Button onClick={() => router.push('/cv-metadata')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to CV Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTemplate = CV_TEMPLATES[selectedTemplate]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      {/* Sub-header for critical actions */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm sticky top-14 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Editor</h1>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <Badge variant="secondary" className="text-xs font-normal">
                {currentTemplate.name}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 text-xs"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-2" />
                )}
                {isSaving ? 'Saving' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Info Banner */}
        <Alert className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Design your CV with professional templates optimized for print and ATS systems.
            Changes are reflected in real-time in the preview.
          </AlertDescription>
        </Alert>

        {/* Layout Editor (Controls on Top) */}
        <div className="w-full">
          <CVLayoutEditor
            cvData={cvData}
            onLayoutChange={handleLayoutChange}
            onPreview={handlePreview}
          />
        </div>

        {/* Preview (Below) */}
        <div className="w-full">
          <CVPreview
            html={previewHTML}
            css={previewCSS}
            settings={printSettings}
            onDownload={handleDownload}
            className="h-[800px] shadow-sm" // Fixed height for scrollable preview area
          />
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function CVEditorLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3">
            <div className="h-96 w-full bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="xl:col-span-2">
            <div className="h-[600px] w-full bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export wrapped with Suspense
export default function CVEditorPage() {
  return (
    <Suspense fallback={<CVEditorLoading />}>
      <CVEditorPageContent />
    </Suspense>
  )
}
