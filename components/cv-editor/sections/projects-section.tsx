'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    FolderOpen, Plus, Trash2, ChevronDown, ChevronUp,
    Link as LinkIcon, Code
} from "lucide-react"
import type { ProjectEntry } from "@/lib/api-client"
import type { CVValidationResult } from "../cv-validation"

interface ProjectsSectionProps {
    projects: ProjectEntry[]
    onChange: (projects: ProjectEntry[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

export function ProjectsSection({
    projects,
    onChange,
    readOnly = false,
    validation: _validation
}: ProjectsSectionProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))
    const [newTech, setNewTech] = useState<{ [key: number]: string }>({})

    const toggleExpand = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    const addProject = () => {
        const newProj: ProjectEntry = {
            name: '',
            description: '',
            technologies: [],
            link: '',
            duration: ''
        }
        onChange([...projects, newProj])
        setExpandedItems(prev => new Set([...prev, projects.length]))
    }

    const updateProject = (index: number, field: keyof ProjectEntry, value: unknown) => {
        const updated = [...projects]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const removeProject = (index: number) => {
        onChange(projects.filter((_, i) => i !== index))
    }

    const addTechnology = (projIndex: number) => {
        const tech = newTech[projIndex]?.trim()
        if (!tech) return

        const updated = [...projects]
        updated[projIndex] = {
            ...updated[projIndex],
            technologies: [...(updated[projIndex].technologies || []), tech]
        }
        onChange(updated)
        setNewTech(prev => ({ ...prev, [projIndex]: '' }))
    }

    const removeTechnology = (projIndex: number, techIndex: number) => {
        const updated = [...projects]
        updated[projIndex] = {
            ...updated[projIndex],
            technologies: updated[projIndex].technologies?.filter((_, i) => i !== techIndex) || []
        }
        onChange(updated)
    }

    const moveProject = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === projects.length - 1)
        ) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        const updated = [...projects]
        const [removed] = updated.splice(index, 1)
        updated.splice(newIndex, 0, removed)
        onChange(updated)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Projects
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Showcase personal or professional projects that demonstrate your skills
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={addProject} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                    </Button>
                )}
            </div>

            {projects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No projects added yet</p>
                        {!readOnly && (
                            <Button onClick={addProject} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Project
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {projects.map((project, index) => (
                        <Card key={index} className="overflow-hidden">
                            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpand(index)}>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveProject(index, 'up') }}
                                                    disabled={index === 0}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveProject(index, 'down') }}
                                                    disabled={index === projects.length - 1}
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
                                                        {project.name || 'Untitled Project'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        {project.technologies?.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Code className="h-3 w-3" />
                                                                {project.technologies.slice(0, 3).join(', ')}
                                                                {project.technologies.length > 3 && ` +${project.technologies.length - 3}`}
                                                            </span>
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
                                                onClick={(e) => { e.stopPropagation(); removeProject(index) }}
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
                                                <Label>Project Name</Label>
                                                <Input
                                                    value={project.name}
                                                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                                                    placeholder="My Awesome Project"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Duration (Optional)</Label>
                                                <Input
                                                    value={project.duration || ''}
                                                    onChange={(e) => updateProject(index, 'duration', e.target.value)}
                                                    placeholder="Jan 2023 - Mar 2023"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="flex items-center gap-2">
                                                    <LinkIcon className="h-4 w-4" />
                                                    Project Link (Optional)
                                                </Label>
                                                <Input
                                                    value={project.link || ''}
                                                    onChange={(e) => updateProject(index, 'link', e.target.value)}
                                                    placeholder="https://github.com/username/project"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={project.description || ''}
                                                onChange={(e) => updateProject(index, 'description', e.target.value)}
                                                placeholder="Describe what the project does, your role, and key achievements..."
                                                className="min-h-[120px] text-base leading-relaxed"
                                                disabled={readOnly}
                                            />
                                        </div>

                                        {/* Technologies */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Code className="h-4 w-4" />
                                                Technologies Used
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {(project.technologies || []).map((tech, tIndex) => (
                                                    <Badge key={tIndex} variant="secondary" className="flex items-center gap-1">
                                                        {tech}
                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => removeTechnology(index, tIndex)}
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
                                                        value={newTech[index] || ''}
                                                        onChange={(e) => setNewTech(prev => ({ ...prev, [index]: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology(index))}
                                                        placeholder="Add technology (e.g., React, Node.js)"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addTechnology(index)}
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
                        <strong>Pro tip:</strong> Include projects that demonstrate skills relevant to your target roles. 
                        Personal projects, open source contributions, and hackathon projects all count!
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
