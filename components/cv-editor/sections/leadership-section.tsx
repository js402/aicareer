'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    Users, Plus, Trash2, ChevronDown, ChevronUp, 
    Building2, Calendar, Star
} from "lucide-react"
import type { LeadershipEntry } from "@/lib/api-client"

import type { CVValidationResult } from "../cv-validation"

interface LeadershipSectionProps {
    leadership: LeadershipEntry[]
    onChange: (leadership: LeadershipEntry[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

export function LeadershipSection({
    leadership,
    onChange,
    readOnly = false,
    validation: _validation
}: LeadershipSectionProps) {
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

    const addLeadership = () => {
        const newEntry: LeadershipEntry = {
            role: '',
            organization: '',
            duration: '',
            description: '',
            highlights: []
        }
        onChange([...(leadership || []), newEntry])
        setExpandedItems(prev => new Set([...prev, (leadership || []).length]))
    }

    const updateLeadership = (index: number, field: keyof LeadershipEntry, value: unknown) => {
        const updated = [...(leadership || [])]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const removeLeadership = (index: number) => {
        onChange((leadership || []).filter((_, i) => i !== index))
    }

    const addHighlight = (entryIndex: number) => {
        const highlight = newHighlight[entryIndex]?.trim()
        if (!highlight) return

        const updated = [...(leadership || [])]
        updated[entryIndex] = {
            ...updated[entryIndex],
            highlights: [...(updated[entryIndex].highlights || []), highlight]
        }
        onChange(updated)
        setNewHighlight(prev => ({ ...prev, [entryIndex]: '' }))
    }

    const removeHighlight = (entryIndex: number, highlightIndex: number) => {
        const updated = [...(leadership || [])]
        updated[entryIndex] = {
            ...updated[entryIndex],
            highlights: updated[entryIndex].highlights?.filter((_, i) => i !== highlightIndex) || []
        }
        onChange(updated)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Leadership
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add leadership roles and impact (teams, initiatives, outcomes)
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={addLeadership} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Leadership Role
                    </Button>
                )}
            </div>

            {(leadership?.length || 0) === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No leadership roles added yet</p>
                        {!readOnly && (
                            <Button onClick={addLeadership} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Leadership Role
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {(leadership || []).map((entry, index) => (
                        <Card key={index} className="overflow-hidden">
                            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpand(index)}>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); /* optional reordering */ }}
                                                    className="p-0.5 hover:bg-muted rounded"
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); /* optional reordering */ }}
                                                    className="p-0.5 hover:bg-muted rounded"
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                        <CollapsibleTrigger className="flex-1 flex items-center justify-between">
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    {entry.role || 'Untitled Leadership Role'}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Building2 className="h-3 w-3" />
                                                    {entry.organization || 'Organization'}
                                                    {entry.duration && (
                                                        <>
                                                            <span>•</span>
                                                            <Calendar className="h-3 w-3" />
                                                            {entry.duration}
                                                        </>
                                                    )}
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
                                                onClick={(e) => { e.stopPropagation(); removeLeadership(index) }}
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
                                                <Label>Leadership Role / Title</Label>
                                                <Input
                                                    value={entry.role || ''}
                                                    onChange={(e) => updateLeadership(index, 'role', e.target.value)}
                                                    placeholder="Engineering Manager / Team Lead"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Organization</Label>
                                                <Input
                                                    value={entry.organization || ''}
                                                    onChange={(e) => updateLeadership(index, 'organization', e.target.value)}
                                                    placeholder="Company / Group"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Duration</Label>
                                                <Input
                                                    value={entry.duration || ''}
                                                    onChange={(e) => updateLeadership(index, 'duration', e.target.value)}
                                                    placeholder="Jan 2021 - Present"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={entry.description || ''}
                                                onChange={(e) => updateLeadership(index, 'description', e.target.value)}
                                                placeholder="Scope, team size, responsibilities, outcomes..."
                                                className="min-h-[120px] text-base leading-relaxed"
                                                disabled={readOnly}
                                            />
                                        </div>

                                        {/* Highlights/Impact */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                Key Leadership Impact
                                            </Label>
                                            <div className="space-y-2">
                                                {(entry.highlights || []).map((highlight, hIndex) => (
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
                                                        placeholder="Add an impact (e.g., Scaled team from 4 to 12)"
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
        </div>
    )
}
