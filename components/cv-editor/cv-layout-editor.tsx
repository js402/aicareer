import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CV_TEMPLATES, 
  PRINT_COLOR_PALETTES, 
  renderCVWithTemplate 
} from '@/lib/cv-templates'
import { 
  PrintSettings, 
  generatePrintCSS 
} from '@/lib/cv-print-engine'
import type { ExtractedCVInfo } from '@/lib/api-client'

interface CVLayoutEditorProps {
  cvData: ExtractedCVInfo
  onLayoutChange?: (templateId: string, settings: PrintSettings) => void
  onPreview?: (html: string, css: string) => void
}

export default function CVLayoutEditor({ 
  cvData, 
  onLayoutChange,
  onPreview 
}: CVLayoutEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(
    CV_TEMPLATES.modern.styles
  )
  const [previewMode, setPreviewMode] = useState<'desktop' | 'print'>('print')

  const updateSettings = useCallback((updates: Partial<PrintSettings>) => {
    const newSettings = { ...printSettings, ...updates }
    setPrintSettings(newSettings)
    onLayoutChange?.(selectedTemplate, newSettings)
  }, [printSettings, selectedTemplate, onLayoutChange])

  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    const template = CV_TEMPLATES[templateId]
    setPrintSettings(template.styles)
    onLayoutChange?.(templateId, template.styles)
  }, [onLayoutChange])

  const generatePreview = useCallback(() => {
    const html = renderCVWithTemplate(cvData, selectedTemplate, printSettings)
    const css = generatePrintCSS(printSettings)
    onPreview?.(html, css)
  }, [cvData, selectedTemplate, printSettings, onPreview])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Selection */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Layout Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CV_TEMPLATES).map(([id, template]) => (
              <div
                key={id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplate === id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateChange(id)}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded mb-3 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Preview</span>
                </div>
                <h4 className="font-semibold text-sm">{template.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Type</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Color Palette</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(PRINT_COLOR_PALETTES).map(([name, colors]) => (
                    <Button
                      key={name}
                      variant={printSettings.colors === colors ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => updateSettings({ colors })}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors.accent }}
                        />
                        <span className="capitalize text-xs">{name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accent-opacity">Accent Opacity</Label>
                  <span className="text-sm text-gray-500">
                    {Math.round((printSettings.accentOpacity || 1) * 100)}%
                  </span>
                </div>
                <Slider
                  id="accent-opacity"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={[printSettings.accentOpacity || 1]}
                  onValueChange={([value]) => updateSettings({ accentOpacity: value })}
                />
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <div>
                <Label>Font Size</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="base-size" className="text-sm">Base</Label>
                    <span className="text-sm text-gray-500">{printSettings.fontSize?.base || 11}pt</span>
                  </div>
                  <Slider
                    id="base-size"
                    min={9}
                    max={14}
                    step={0.5}
                    value={[printSettings.fontSize?.base || 11]}
                    onValueChange={([value]) => updateSettings({ 
                      fontSize: { ...printSettings.fontSize, base: value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={printSettings.typography?.fontFamily || 'inter'}
                  onValueChange={(value) => updateSettings({
                    typography: { 
                      ...printSettings.typography, 
                      fontFamily: value === 'inter' ? 
                        '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' :
                        value === 'times' ?
                        '"Times New Roman", Times, serif' :
                        '"Source Sans Pro", -apple-system, sans-serif'
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter (Modern)</SelectItem>
                    <SelectItem value="times">Times New Roman (Classic)</SelectItem>
                    <SelectItem value="source">Source Sans Pro (Clean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="line-height">Line Height</Label>
                  <span className="text-sm text-gray-500">{printSettings.lineHeight?.body || 1.4}</span>
                </div>
                <Slider
                  id="line-height"
                  min={1.2}
                  max={1.8}
                  step={0.1}
                  value={[printSettings.lineHeight?.body || 1.4]}
                  onValueChange={([value]) => updateSettings({ 
                    lineHeight: { 
                      ...printSettings.lineHeight,
                      body: value,
                      headings: value - 0.2
                    }
                  })}
                />
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="margins">Margins</Label>
                  <span className="text-sm text-gray-500">{printSettings.margins?.top || 20}mm</span>
                </div>
                <Slider
                  id="margins"
                  min={10}
                  max={30}
                  step={1}
                  value={[printSettings.margins?.top || 20]}
                  onValueChange={([value]) => updateSettings({ 
                    margins: { 
                      top: value, 
                      right: value, 
                      bottom: value, 
                      left: value 
                    }
                  })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="section-gap">Section Spacing</Label>
                  <span className="text-sm text-gray-500">{printSettings.spacing?.sectionGap || 18}px</span>
                </div>
                <Slider
                  id="section-gap"
                  min={12}
                  max={30}
                  step={2}
                  value={[printSettings.spacing?.sectionGap || 18]}
                  onValueChange={([value]) => updateSettings({ 
                    spacing: { 
                      ...printSettings.spacing, 
                      sectionGap: value 
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="two-column">Two Column Layout</Label>
                <Switch
                  id="two-column"
                  checked={printSettings.twoColumn || false}
                  onCheckedChange={(checked: boolean) => updateSettings({ twoColumn: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ats-mode">ATS-Friendly Mode</Label>
                <Switch
                  id="ats-mode"
                  checked={printSettings.atsMode || false}
                  onCheckedChange={(checked: boolean) => updateSettings({ atsMode: checked })}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview Button */}
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={generatePreview}
              className="w-full"
            >
              Generate Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleTemplateChange('classic')}
            >
              ATS Optimized
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateSettings({ 
                margins: { top: 15, right: 15, bottom: 15, left: 15 },
                spacing: { sectionGap: 14, paragraphGap: 6, listItemGap: 3 }
              })}
            >
              Maximize Content
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateSettings({
                fontSize: { ...printSettings.fontSize, base: 12 },
                spacing: { sectionGap: 22, paragraphGap: 10, listItemGap: 5 }
              })}
            >
              Executive Style
            </Button>
            <Button 
              variant="outline"
              onClick={() => updateSettings({ 
                colors: PRINT_COLOR_PALETTES.monochrome,
                atsMode: true 
              })}
            >
              Print Safe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}