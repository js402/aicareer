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
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-${cvData?.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Downloaded",
        description: "Your CV has been downloaded as PDF",
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Download Error",
        description: "Failed to download PDF. Try using the Print button instead.",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/cv-metadata')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-600" />
                <h1 className="text-lg font-semibold">CV Layout Editor</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                {currentTemplate.name}
              </Badge>
              <Badge 
                variant={currentTemplate.printOptimized ? "default" : "secondary"} 
                className="text-xs hidden sm:inline-flex"
              >
                {currentTemplate.printOptimized ? 'Print Ready' : 'Standard'}
              </Badge>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  disabled={!previewHTML || isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <Alert className="mb-6">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Design your CV with professional templates optimized for print and ATS systems. 
            Changes are reflected in real-time in the preview.
          </AlertDescription>
        </Alert>

        {/* Editor Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Layout Editor */}
          <div className="xl:col-span-3 space-y-6">
            <CVLayoutEditor
              cvData={cvData}
              onLayoutChange={handleLayoutChange}
              onPreview={handlePreview}
            />
          </div>

          {/* Preview */}
          <div className="xl:col-span-2">
            <div className="sticky top-24">
              <CVPreview
                html={previewHTML}
                css={previewCSS}
                settings={printSettings}
                onDownload={handleDownload}
                className="h-[calc(100vh-8rem)]"
              />
            </div>
          </div>
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
