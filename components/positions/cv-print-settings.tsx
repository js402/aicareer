import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { useCVPrintSettings } from "@/hooks/useCVPrintSettings"
import { TEMPLATES, PRINT_COLOR_PALETTE, type DesignTemplate, type FontPreset, type MarginPreset, type SectionSpacing } from "@/lib/cv-print-templates"
import { useState } from "react"

interface CVPrintSettingsProps {
    onSettingsChange?: () => void
}

export function CVPrintSettings({ onSettingsChange }: CVPrintSettingsProps) {
    const { settings, updateSettings, resetSettings } = useCVPrintSettings()
    const [showAdvanced, setShowAdvanced] = useState(false)

    const handleChange = (key: string, value: unknown) => {
        updateSettings({ [key]: value })
        onSettingsChange?.()
    }

    const handleReset = () => {
        resetSettings()
        onSettingsChange?.()
    }

    return (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Print Settings</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 text-xs"
                >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                </Button>
            </div>

            <div className="space-y-3">
                {/* Design Template */}
                <div className="space-y-1.5">
                    <Label htmlFor="design-template" className="text-xs font-medium">
                        Design Template
                    </Label>
                    <Select
                        value={settings.design || 'modern'}
                        onValueChange={(value: DesignTemplate) => handleChange('design', value)}
                    >
                        <SelectTrigger id="design-template" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(TEMPLATES).map(([key, template]) => (
                                <SelectItem key={key} value={key}>
                                    <span className="font-medium">{template.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        - {template.description}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Accent Color */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Accent Color</Label>
                    <div className="flex gap-2">
                        {PRINT_COLOR_PALETTE.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => handleChange('accentColor', color.value)}
                                className={`w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-all ${color.class} ${settings.accentColor === color.value ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100' : ''
                                    }`}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>

                {/* Paper Size & Alignment */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="paper-size" className="text-xs font-medium">Paper Size</Label>
                        <Select
                            value={settings.paperSize || 'A4'}
                            onValueChange={(value) => handleChange('paperSize', value)}
                        >
                            <SelectTrigger id="paper-size" className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A4">A4</SelectItem>
                                <SelectItem value="Letter">Letter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="header-align" className="text-xs font-medium">Header Align</Label>
                        <Select
                            value={settings.headerAlign || 'center'}
                            onValueChange={(value) => handleChange('headerAlign', value)}
                        >
                            <SelectTrigger id="header-align" className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Font Size Preset */}
                <div className="space-y-1.5">
                    <Label htmlFor="font-preset" className="text-xs font-medium">
                        Font Size
                    </Label>
                    <Select
                        value={settings.fontPreset}
                        onValueChange={(value: FontPreset) => handleChange('fontPreset', value)}
                    >
                        <SelectTrigger id="font-preset" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ultra-compact">Ultra Compact (8pt)</SelectItem>
                            <SelectItem value="compact">Compact (9pt)</SelectItem>
                            <SelectItem value="standard">Standard (10pt)</SelectItem>
                            <SelectItem value="large">Large (11pt)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Margin Preset */}
                <div className="space-y-1.5">
                    <Label htmlFor="margin-preset" className="text-xs font-medium">
                        Margins
                    </Label>
                    <Select
                        value={settings.marginPreset}
                        onValueChange={(value: MarginPreset) => handleChange('marginPreset', value)}
                    >
                        <SelectTrigger id="margin-preset" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minimal">Minimal (0.5cm)</SelectItem>
                            <SelectItem value="tight">Tight (0.75cm)</SelectItem>
                            <SelectItem value="normal">Normal (1cm)</SelectItem>
                            <SelectItem value="comfortable">Comfortable (1.5cm)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Section Spacing */}
                <div className="space-y-1.5">
                    <Label htmlFor="section-spacing" className="text-xs font-medium">
                        Section Spacing
                    </Label>
                    <Select
                        value={settings.sectionSpacing}
                        onValueChange={(value: SectionSpacing) => handleChange('sectionSpacing', value)}
                    >
                        <SelectTrigger id="section-spacing" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="tight">Tight</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="relaxed">Relaxed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Settings Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full justify-between h-8 text-xs font-normal"
                >
                    Line Height
                    {showAdvanced ? (
                        <ChevronUp className="h-3 w-3" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )}
                </Button>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {/* Line Height */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="line-height" className="text-xs font-medium">
                                    Line Height
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {settings.lineHeight.toFixed(2)}
                                </span>
                            </div>
                            <Slider
                                id="line-height"
                                min={1.1}
                                max={1.6}
                                step={0.05}
                                value={[settings.lineHeight]}
                                onValueChange={([value]: number[]) => handleChange('lineHeight', value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <p className="text-xs text-muted-foreground">
                    💡 <strong>Ultra Compact + Minimal + Minimal</strong> for maximum content
                </p>
                <p className="text-xs text-muted-foreground">
                    📄 Use <strong>Print / PDF</strong> button to save as PDF
                </p>
            </div>
        </div>
    )
}
