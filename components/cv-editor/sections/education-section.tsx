'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    GraduationCap, Plus, Trash2, ChevronDown, ChevronUp,
    Building2, Calendar, Award, BookOpen
} from "lucide-react"
import type { EducationEntry } from "@/lib/api-client"
import type { CVValidationResult } from "../cv-validation"

interface EducationSectionProps {
    education: EducationEntry[]
    onChange: (education: EducationEntry[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

export function EducationSection({
    education,
    onChange,
    readOnly = false,
    validation: _validation
}: EducationSectionProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))
    const [newCoursework, setNewCoursework] = useState<{ [key: number]: string }>({})
    const [newActivity, setNewActivity] = useState<{ [key: number]: string }>({})

    const toggleExpand = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    const addEducation = () => {
        const newEdu: EducationEntry = {
            degree: '',
            institution: '',
            year: '',
            location: '',
            gpa: '',
            coursework: [],
            activities: []
        }
        onChange([...education, newEdu])
        setExpandedItems(prev => new Set([...prev, education.length]))
    }

    const updateEducation = (index: number, field: keyof EducationEntry, value: unknown) => {
        const updated = [...education]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const removeEducation = (index: number) => {
        onChange(education.filter((_, i) => i !== index))
    }

    const addCoursework = (eduIndex: number) => {
        const course = newCoursework[eduIndex]?.trim()
        if (!course) return

        const updated = [...education]
        updated[eduIndex] = {
            ...updated[eduIndex],
            coursework: [...(updated[eduIndex].coursework || []), course]
        }
        onChange(updated)
        setNewCoursework(prev => ({ ...prev, [eduIndex]: '' }))
    }

    const removeCoursework = (eduIndex: number, courseIndex: number) => {
        const updated = [...education]
        updated[eduIndex] = {
            ...updated[eduIndex],
            coursework: updated[eduIndex].coursework?.filter((_, i) => i !== courseIndex) || []
        }
        onChange(updated)
    }

    const addActivity = (eduIndex: number) => {
        const activity = newActivity[eduIndex]?.trim()
        if (!activity) return

        const updated = [...education]
        updated[eduIndex] = {
            ...updated[eduIndex],
            activities: [...(updated[eduIndex].activities || []), activity]
        }
        onChange(updated)
        setNewActivity(prev => ({ ...prev, [eduIndex]: '' }))
    }

    const removeActivity = (eduIndex: number, activityIndex: number) => {
        const updated = [...education]
        updated[eduIndex] = {
            ...updated[eduIndex],
            activities: updated[eduIndex].activities?.filter((_, i) => i !== activityIndex) || []
        }
        onChange(updated)
    }

    const moveEducation = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === education.length - 1)
        ) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        const updated = [...education]
        const [removed] = updated.splice(index, 1)
        updated.splice(newIndex, 0, removed)
        onChange(updated)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add your educational background, degrees, and certifications
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={addEducation} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                    </Button>
                )}
            </div>

            {education.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No education added yet</p>
                        {!readOnly && (
                            <Button onClick={addEducation} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Education
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {education.map((edu, index) => (
                        <Card key={index} className="overflow-hidden">
                            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpand(index)}>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveEducation(index, 'up') }}
                                                    disabled={index === 0}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveEducation(index, 'down') }}
                                                    disabled={index === education.length - 1}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                        
                                        <CollapsibleTrigger className="flex-1 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-left">
                                                    <div className="font-medium">
                                                        {edu.degree || 'Untitled Degree'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Building2 className="h-3 w-3" />
                                                        {edu.institution || 'Institution'}
                                                        {edu.year && (
                                                            <>
                                                                <span>•</span>
                                                                <Calendar className="h-3 w-3" />
                                                                {edu.year}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedItems.has(index) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </CollapsibleTrigger>

                                        {!readOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); removeEducation(index) }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>

                                <CollapsibleContent>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Degree / Certificate</Label>
                                                <Input
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                    placeholder="Bachelor of Science in Computer Science"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Institution</Label>
                                                <Input
                                                    value={edu.institution}
                                                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                    placeholder="Stanford University"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Year / Duration</Label>
                                                <Input
                                                    value={edu.year}
                                                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                                    placeholder="2020 or 2016-2020"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Location</Label>
                                                <Input
                                                    value={edu.location || ''}
                                                    onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                                    placeholder="Stanford, CA"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>GPA (Optional)</Label>
                                                <Input
                                                    value={edu.gpa || ''}
                                                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                                    placeholder="3.8/4.0"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        {/* Relevant Coursework */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Relevant Coursework
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {(edu.coursework || []).map((course, cIndex) => (
                                                    <Badge key={cIndex} variant="secondary" className="flex items-center gap-1">
                                                        {course}
                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => removeCoursework(index, cIndex)}
                                                                className="ml-1 hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {!readOnly && (
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        value={newCoursework[index] || ''}
                                                        onChange={(e) => setNewCoursework(prev => ({ ...prev, [index]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCoursework(index))}
                                                        placeholder="Add course (e.g., Data Structures)"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addCoursework(index)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Activities */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Award className="h-4 w-4" />
                                                Activities & Honors
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {(edu.activities || []).map((activity, aIndex) => (
                                                    <Badge key={aIndex} variant="outline" className="flex items-center gap-1">
                                                        {activity}
                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => removeActivity(index, aIndex)}
                                                                className="ml-1 hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {!readOnly && (
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        value={newActivity[index] || ''}
                                                        onChange={(e) => setNewActivity(prev => ({ ...prev, [index]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity(index))}
                                                        placeholder="Add activity (e.g., Dean's List)"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addActivity(index)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
