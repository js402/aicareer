'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
    User, Briefcase, GraduationCap, Code, FolderOpen, Award, 
    Globe, Save, X, RotateCcw, CheckCircle, AlertCircle,
    AlertTriangle, Info, Loader2, Users
} from "lucide-react"
import type { ExtractedCVInfo, LeadershipEntry } from "@/lib/api-client"
import { PersonalInfoSection } from "./sections/personal-info-section"
import { ExperienceSection } from "./sections/experience-section"
import { EducationSection } from "./sections/education-section"
import { SkillsSection } from "./sections/skills-section"
import { ProjectsSection } from "./sections/projects-section"
import { CertificationsSection } from "./sections/certifications-section"
import { LanguagesSection } from "./sections/languages-section"
import { LeadershipSection } from "./sections"
import { validateCV, getFirstIncompleteSectionId, type SectionValidation } from "./cv-validation"

export interface CVEditorProps {
    initialData: ExtractedCVInfo
    onSave: (data: ExtractedCVInfo) => Promise<void>
    onCancel?: () => void
    isLoading?: boolean
    readOnly?: boolean
    showPreview?: boolean
    compact?: boolean
    /** Auto-navigate to first incomplete section */
    autoFocusIncomplete?: boolean
    /** Show validation alerts prominently */
    showValidationAlerts?: boolean
}

interface SectionConfig {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
}

const SECTIONS: SectionConfig[] = [
    { id: 'personal', label: 'Personal Info', icon: User, description: 'Name, contact details, and summary' },
    { id: 'experience', label: 'Experience', icon: Briefcase, description: 'Work history and achievements' },
    { id: 'leadership', label: 'Leadership', icon: Users, description: 'Leadership roles and impact' },
    { id: 'education', label: 'Education', icon: GraduationCap, description: 'Degrees and certifications' },
    { id: 'skills', label: 'Skills', icon: Code, description: 'Technical and soft skills' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, description: 'Personal and professional projects' },
    { id: 'certifications', label: 'Certifications', icon: Award, description: 'Professional certifications' },
    { id: 'languages', label: 'Languages', icon: Globe, description: 'Spoken languages' },
]

function SectionStatusBadge({ section }: { section: SectionValidation }) {
    if (section.isComplete && section.missingFields.length === 0) {
        return (
            <span className="flex h-2 w-2 rounded-full bg-green-500" title="Complete" />
        )
    }
    
    const hasErrors = section.missingFields.some(f => f.severity === 'error')
    const hasWarnings = section.missingFields.some(f => f.severity === 'warning')
    
    if (hasErrors) {
        return (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Missing required fields" />
        )
    }
    
    if (hasWarnings) {
        return (
            <span className="flex h-2 w-2 rounded-full bg-amber-500" title="Recommended fields missing" />
        )
    }
    
    return (
        <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Optional improvements available" />
    )
}

export function CVEditor({
    initialData,
    onSave,
    onCancel,
    isLoading = false,
    readOnly = false,
    compact = false,
    autoFocusIncomplete = true,
    showValidationAlerts = true
}: CVEditorProps) {
    const [formData, setFormData] = useState<ExtractedCVInfo>(initialData)
    const [activeTab, setActiveTab] = useState('personal')
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

    // Validate the current form data
    const validation = useMemo(() => validateCV(formData), [formData])

    // Get section validation for the active tab
    const activeSectionValidation = useMemo(() => 
        validation.sections.find(s => s.id === activeTab),
        [validation, activeTab]
    )

    // Auto-navigate to first incomplete section on mount
    useEffect(() => {
        if (autoFocusIncomplete && !validation.isComplete) {
            const firstIncomplete = getFirstIncompleteSectionId(validation)
            if (firstIncomplete) {
                setActiveTab(firstIncomplete)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only on mount - intentionally ignore deps

    // Update form data and track changes
    const updateField = useCallback(<K extends keyof ExtractedCVInfo>(
        field: K,
        value: ExtractedCVInfo[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
        setSaveSuccess(false)
        setSaveError(null)
    }, [])

    // Reset to initial data
    const handleReset = useCallback(() => {
        setFormData(initialData)
        setHasChanges(false)
        setSaveError(null)
        setSaveSuccess(false)
        setDismissedAlerts(new Set())
    }, [initialData])

    // Save changes
    const handleSave = useCallback(async () => {
        setIsSaving(true)
        setSaveError(null)
        setSaveSuccess(false)

        try {
            await onSave(formData)
            setHasChanges(false)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }, [formData, onSave])

    const dismissAlert = (alertId: string) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]))
    }

    // Get section-specific missing field message
    const getSectionMissingMessage = (sectionId: string): string | null => {
        const section = validation.sections.find(s => s.id === sectionId)
        if (!section || section.missingFields.length === 0) return null
        
        const errors = section.missingFields.filter(f => f.severity === 'error')
        if (errors.length > 0) {
            return errors.map(e => e.message).join('. ')
        }
        
        const warnings = section.missingFields.filter(f => f.severity === 'warning')
        if (warnings.length > 0) {
            return warnings.map(w => w.message).join('. ')
        }
        
        return null
    }

    return (
        <div className={`flex flex-col h-full ${compact ? 'gap-3' : 'gap-4'}`}>
            {/* Header with actions */}
            <div className="flex items-center justify-between pb-3 border-b shrink-0">
                <div className="flex items-center gap-4">
                    {/* Completion Progress */}
                    <div className="flex items-center gap-2">
                        <Progress 
                            value={validation.overallScore} 
                            className="w-20 h-2"
                        />
                        <Badge variant={validation.isComplete ? "default" : "secondary"} className="text-xs">
                            {validation.overallScore}%
                        </Badge>
                    </div>
                    
                    {/* Status badges */}
                    {hasChanges && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                            Unsaved
                        </Badge>
                    )}
                    {saveSuccess && (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Saved
                        </Badge>
                    )}
                </div>
                
                {/* Action buttons */}
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleReset} 
                            disabled={!hasChanges || isSaving}
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Reset
                        </Button>
                        <Button 
                            size="sm"
                            onClick={handleSave} 
                            disabled={!hasChanges || isSaving || isLoading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5 mr-1.5" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Critical missing fields alert */}
            {showValidationAlerts && validation.criticalMissing.length > 0 && !dismissedAlerts.has('critical') && (
                <Alert variant="destructive" className="relative">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Required Information Missing</AlertTitle>
                    <AlertDescription>
                        Please complete the following to enable full analysis:
                        <ul className="list-disc list-inside mt-2">
                            {validation.criticalMissing.slice(0, 3).map((field, i) => (
                                <li key={i}>{field.label}: {field.message}</li>
                            ))}
                            {validation.criticalMissing.length > 3 && (
                                <li>...and {validation.criticalMissing.length - 3} more</li>
                            )}
                        </ul>
                    </AlertDescription>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => dismissAlert('critical')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </Alert>
            )}

            {/* Error message */}
            {saveError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{saveError}</AlertDescription>
                </Alert>
            )}

            {/* Main editor with tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid grid-cols-8 w-full h-auto p-1 shrink-0">
                    {SECTIONS.map(section => {
                        const sectionValidation = validation.sections.find(s => s.id === section.id)
                        return (
                            <TabsTrigger 
                                key={section.id} 
                                value={section.id}
                                className="flex items-center gap-1.5 text-xs py-2 px-2 relative"
                            >
                                <section.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline truncate">{section.label}</span>
                                {sectionValidation && (
                                    <span className="absolute -top-1 -right-1">
                                        <SectionStatusBadge section={sectionValidation} />
                                    </span>
                                )}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                <Card className="mt-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Section-specific guidance */}
                    {activeSectionValidation && activeSectionValidation.missingFields.length > 0 && (
                        <div className="border-b px-4 py-2 bg-muted/30 shrink-0">
                            <div className="flex items-start gap-2 text-sm">
                                {activeSectionValidation.missingFields.some(f => f.severity === 'error') ? (
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                ) : activeSectionValidation.missingFields.some(f => f.severity === 'warning') ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                ) : (
                                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className="text-muted-foreground">
                                        {getSectionMissingMessage(activeTab)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <CardContent className="py-6">
                            <TabsContent value="personal" className="mt-0">
                                <PersonalInfoSection
                                    name={formData.name || ''}
                                    contactInfo={formData.contactInfo}
                                    summary={formData.summary || ''}
                                    seniorityLevel={formData.seniorityLevel}
                                    yearsOfExperience={formData.yearsOfExperience}
                                    industries={formData.industries || []}
                                    onChange={(field, value) => updateField(field as keyof ExtractedCVInfo, value as ExtractedCVInfo[keyof ExtractedCVInfo])}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="experience" className="mt-0">
                                <ExperienceSection
                                    experiences={formData.experience || []}
                                    onChange={(experiences) => updateField('experience', experiences)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="leadership" className="mt-0">
                                <LeadershipSection
                                    leadership={formData.leadership || []}
                                    onChange={(leadership: LeadershipEntry[]) => updateField('leadership', leadership)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="education" className="mt-0">
                                <EducationSection
                                    education={formData.education || []}
                                    onChange={(education) => updateField('education', education)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="skills" className="mt-0">
                                <SkillsSection
                                    skills={formData.skills || []}
                                    inferredSkills={formData.inferredSkills || []}
                                    primaryFunctions={formData.primaryFunctions || []}
                                    onChange={(skills) => updateField('skills', skills)}
                                    onInferredChange={(inferredSkills) => updateField('inferredSkills', inferredSkills)}
                                    onFunctionsChange={(functions) => updateField('primaryFunctions', functions)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="projects" className="mt-0">
                                <ProjectsSection
                                    projects={formData.projects || []}
                                    onChange={(projects) => updateField('projects', projects)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="certifications" className="mt-0">
                                <CertificationsSection
                                    certifications={formData.certifications || []}
                                    onChange={(certifications) => updateField('certifications', certifications)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>

                            <TabsContent value="languages" className="mt-0">
                                <LanguagesSection
                                    languages={formData.languages || []}
                                    onChange={(languages) => updateField('languages', languages)}
                                    readOnly={readOnly}
                                    validation={validation}
                                />
                            </TabsContent>
                        </CardContent>
                    </ScrollArea>
                </Card>
            </Tabs>
        </div>
    )
}
