'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    Briefcase, Plus, Trash2, ChevronDown, ChevronUp, 
    Building2, Calendar, Star
} from "lucide-react"
import type { ExperienceEntry, LeadershipEntry } from "@/lib/api-client"

import type { CVValidationResult } from "../cv-validation"

interface ExperienceSectionProps {
    experiences: ExperienceEntry[]
    leadership: LeadershipEntry[]
    onChange: (experiences: ExperienceEntry[]) => void
    onLeadershipChange: (leadership: LeadershipEntry[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

export function ExperienceSection({
    experiences,
    leadership: _leadership,
    onChange,
    onLeadershipChange: _onLeadershipChange,
    readOnly = false,
    validation: _validation
}: ExperienceSectionProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))
    const [newHighlight, setNewHighlight] = useState<{ [key: number]: string }>({})

    const toggleExpand = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    const addExperience = () => {
        const newExp: ExperienceEntry = {
            role: '',
            company: '',
            duration: '',
            location: '',
            description: '',
            highlights: []
        }
        onChange([...experiences, newExp])
        setExpandedItems(prev => new Set([...prev, experiences.length]))
    }

    const updateExperience = (index: number, field: keyof ExperienceEntry, value: unknown) => {
        const updated = [...experiences]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const removeExperience = (index: number) => {
        onChange(experiences.filter((_, i) => i !== index))
    }

    const addHighlight = (expIndex: number) => {
        const highlight = newHighlight[expIndex]?.trim()
        if (!highlight) return

        const updated = [...experiences]
        updated[expIndex] = {
            ...updated[expIndex],
            highlights: [...(updated[expIndex].highlights || []), highlight]
        }
        onChange(updated)
        setNewHighlight(prev => ({ ...prev, [expIndex]: '' }))
    }

    const removeHighlight = (expIndex: number, highlightIndex: number) => {
        const updated = [...experiences]
        updated[expIndex] = {
            ...updated[expIndex],
            highlights: updated[expIndex].highlights?.filter((_, i) => i !== highlightIndex) || []
        }
        onChange(updated)
    }

    const moveExperience = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === experiences.length - 1)
        ) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        const updated = [...experiences]
        const [removed] = updated.splice(index, 1)
        updated.splice(newIndex, 0, removed)
        onChange(updated)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Work Experience
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add your work history, starting with the most recent position
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={addExperience} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Position
                    </Button>
                )}
            </div>

            {experiences.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No work experience added yet</p>
                        {!readOnly && (
                            <Button onClick={addExperience} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Position
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {experiences.map((exp, index) => (
                        <Card key={index} className="overflow-hidden">
                            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpand(index)}>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveExperience(index, 'up') }}
                                                    disabled={index === 0}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveExperience(index, 'down') }}
                                                    disabled={index === experiences.length - 1}
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
                                                        {exp.role || 'Untitled Position'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Building2 className="h-3 w-3" />
                                                        {exp.company || 'Company'}
                                                        {exp.duration && (
                                                            <>
                                                                <span>•</span>
                                                                <Calendar className="h-3 w-3" />
                                                                {exp.duration}
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
                                                onClick={(e) => { e.stopPropagation(); removeExperience(index) }}
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
                                                <Label>Job Title / Role</Label>
                                                <Input
                                                    value={exp.role}
                                                    onChange={(e) => updateExperience(index, 'role', e.target.value)}
                                                    placeholder="Senior Software Engineer"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input
                                                    value={exp.company}
                                                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                    placeholder="Tech Company Inc."
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Duration</Label>
                                                <Input
                                                    value={exp.duration}
                                                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                                    placeholder="Jan 2020 - Present"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Location</Label>
                                                <Input
                                                    value={exp.location || ''}
                                                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                                    placeholder="San Francisco, CA (Remote)"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={exp.description || ''}
                                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                                placeholder="Brief description of your role and responsibilities..."
                                                className="min-h-[80px]"
                                                disabled={readOnly}
                                            />
                                        </div>

                                        {/* Highlights/Achievements */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                Key Achievements
                                            </Label>
                                            <div className="space-y-2">
                                                {(exp.highlights || []).map((highlight, hIndex) => (
                                                    <div key={hIndex} className="flex items-start gap-2 group">
                                                        <span className="text-muted-foreground mt-2">•</span>
                                                        <div className="flex-1 bg-muted/30 rounded-md px-3 py-2 text-sm">
                                                            {highlight}
                                                        </div>
                                                        {!readOnly && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                                                                onClick={() => removeHighlight(index, hIndex)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {!readOnly && (
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        value={newHighlight[index] || ''}
                                                        onChange={(e) => setNewHighlight(prev => ({ ...prev, [index]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight(index))}
                                                        placeholder="Add an achievement (e.g., Increased sales by 25%)"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addHighlight(index)}
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

            {/* Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="py-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Pro tip:</strong> Use the ACM formula for achievements: 
                        <strong> Action + Context + Metric</strong>. 
                        Example: &quot;Led migration of legacy system to cloud, reducing operational costs by 40%&quot;
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
