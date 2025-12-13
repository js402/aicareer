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
  className?: string
}

export default function CVLayoutEditor({
  cvData,
  onLayoutChange,
  onPreview,
  className = ''
}: CVLayoutEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(
    CV_TEMPLATES.modern.styles
  )

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
    <div className={`grid grid-cols-1 gap-6 ${className}`}>
      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CV_TEMPLATES).map(([id, template]) => (
          <div
            key={id}
            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedTemplate === id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            onClick={() => handleTemplateChange(id)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Aa</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{template.name}</h4>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colors & Fonts */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Color Palette</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRINT_COLOR_PALETTES).map(([name, colors]) => (
                  <button
                    key={name}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${printSettings.colors === colors ? 'ring-2 ring-offset-2 ring-blue-500 border-transparent' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: colors.accent }}
                    onClick={() => updateSettings({ colors })}
                    title={name}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Font Family</Label>
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
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter (Modern)</SelectItem>
                  <SelectItem value="times">Times New Roman (Classic)</SelectItem>
                  <SelectItem value="source">Source Sans Pro (Clean)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Spacing & Sizes */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Layout & Spacing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Margins</Label>
                <span className="text-xs text-muted-foreground">{printSettings.margins?.top}mm</span>
              </div>
              <Slider
                min={10} max={30} step={1}
                value={[printSettings.margins?.top || 20]}
                onValueChange={([value]) => updateSettings({
                  margins: { top: value, right: value, bottom: value, left: value }
                })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs text-muted-foreground">{printSettings.fontSize?.base}pt</span>
              </div>
              <Slider
                min={9} max={14} step={0.5}
                value={[printSettings.fontSize?.base || 11]}
                onValueChange={([value]) => updateSettings({
                  fontSize: { ...printSettings.fontSize, base: value }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-column" className="text-xs">Two Column Layout</Label>
              <Switch
                id="two-column"
                checked={printSettings.twoColumn || false}
                onCheckedChange={(checked: boolean) => updateSettings({ twoColumn: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ats-mode" className="text-xs">ATS-Friendly Mode</Label>
              <Switch
                id="ats-mode"
                checked={printSettings.atsMode || false}
                onCheckedChange={(checked: boolean) => updateSettings({ atsMode: checked })}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 h-8 text-xs"
              onClick={generatePreview}
            >
              Refresh Preview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}