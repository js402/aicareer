import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Save,
  ArrowLeft,
  Wand2,
  FileText
} from 'lucide-react'
import CVLayoutEditor from '@/components/cv-editor/cv-layout-editor'
import CVPreview from '@/components/cv-editor/cv-preview'
import { renderCVWithTemplate, CV_TEMPLATES } from '@/lib/cv-templates'
import { generatePrintCSS, PrintSettings } from '@/lib/cv-print-engine'
import type { ExtractedCVInfo } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface CVEditorPageProps {
  cvData: ExtractedCVInfo
  cvId?: string
}

export default function CVEditorPage({ cvData, cvId }: CVEditorPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(
    CV_TEMPLATES.modern.styles
  )
  const [previewHTML, setPreviewHTML] = useState('')
  const [previewCSS, setPreviewCSS] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Generate initial preview
  useEffect(() => {
    generatePreview(selectedTemplate, CV_TEMPLATES.modern.styles)
  }, [cvData])

  const generatePreview = useCallback((templateId: string, settings: PrintSettings) => {
    setIsGenerating(true)
    try {
      const html = renderCVWithTemplate(cvData, templateId, settings)
      const css = generatePrintCSS(settings)
      
      setPreviewHTML(html)
      setPreviewCSS(css)
    } catch (error) {
      console.error('Preview generation failed:', error)
      toast({
        title: "Preview Error",
        description: "Failed to generate CV preview",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [cvData, toast])

  const handleLayoutChange = useCallback((templateId: string, settings: PrintSettings) => {
    setSelectedTemplate(templateId)
    setPrintSettings(settings)
    generatePreview(templateId, settings)
  }, [generatePreview])

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
        headers: {
          'Content-Type': 'application/json',
        },
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
    try {
      const response = await fetch(`/api/cv-pdf/${cvId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      a.download = `cv-${cvData.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'}.pdf`
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
        description: "Failed to download PDF",
        variant: "destructive"
      })
    }
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
                onClick={() => router.back()}
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
              <Badge variant="secondary" className="text-xs">
                {currentTemplate.name}
              </Badge>
              <Badge 
                variant={currentTemplate.printOptimized ? "default" : "secondary"} 
                className="text-xs"
              >
                {currentTemplate.printOptimized ? 'Print Ready' : 'Standard'}
              </Badge>
              
              <div className="flex items-center gap-2 ml-4">
                {cvId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                )}
                <Button
                  onClick={handleDownload}
                  size="sm"
                  disabled={!previewHTML}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
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