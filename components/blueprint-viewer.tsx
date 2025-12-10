'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Linkedin, Globe, Award, Briefcase, GraduationCap, Calendar, BarChart3 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BlueprintEditForm } from "@/components/blueprint-edit-form"
import { Edit } from "lucide-react"

interface BlueprintData {
    personal?: {
        name?: string
        summary?: string
    }
    contact?: {
        email?: string
        phone?: string
        location?: string
        linkedin?: string
        website?: string
    }
    skills?: Array<{
        name: string
        confidence?: number
    }>
    experience?: Array<{
        role: string
        company: string
        duration: string
        description?: string
    }>
    education?: Array<{
        degree: string
        institution: string
        year: string
    }>
}

interface BlueprintViewerProps {
    blueprint: {
        profile_data: BlueprintData
        confidence_score?: number
        updated_at: string
    } | null
    onUpdate?: () => void
}

export function BlueprintViewer({ blueprint, onUpdate }: BlueprintViewerProps) {
    const [skillsOpen, setSkillsOpen] = useState(true)
    const [experienceOpen, setExperienceOpen] = useState(true)
    const [educationOpen, setEducationOpen] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    const handleSave = async (updatedData: BlueprintData) => {
        try {
            const response = await fetch('/api/cv-blueprint', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData: updatedData })
            })

            if (!response.ok) throw new Error('Failed to update blueprint')

            setIsEditing(false)
            onUpdate?.()
        } catch (error) {
            console.error('Error updating blueprint:', error)
            throw error // Let the form handle the error state if needed
        }
    }

    if (!blueprint) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Blueprint Yet</h3>
                        <p className="text-muted-foreground">
                            Upload a CV to create your professional blueprint
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const data = blueprint.profile_data

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                {data.personal?.name || 'Your Professional Blueprint'}
                            </CardTitle>
                            {data.personal?.summary && (
                                <p className="text-muted-foreground mt-3 leading-relaxed">
                                    {data.personal.summary}
                                </p>
                            )}
                        </div>
                        {blueprint.confidence_score && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                        {(blueprint.confidence_score * 100).toFixed(0)}% Confidence
                                    </span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Blueprint
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>

                {/* Contact Information */}
                {data.contact && (
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {data.contact.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{data.contact.email}</span>
                                </div>
                            )}
                            {data.contact.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{data.contact.phone}</span>
                                </div>
                            )}
                            {data.contact.location && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{data.contact.location}</span>
                                </div>
                            )}
                            {data.contact.linkedin && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                                    <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        LinkedIn
                                    </a>
                                </div>
                            )}
                            {data.contact.website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        Website
                                    </a>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <Card>
                    <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
                        <CardHeader className="cursor-pointer" onClick={() => setSkillsOpen(!skillsOpen)}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Skills ({data.skills.length})
                                </CardTitle>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills
                                        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                                        .map((skill, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="px-3 py-1"
                                            >
                                                {skill.name}
                                                {skill.confidence && skill.confidence > 0.7 && (
                                                    <span className="ml-2 text-xs opacity-70">
                                                        {(skill.confidence * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </Badge>
                                        ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Collapsible>
                </Card>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <Card>
                    <Collapsible open={experienceOpen} onOpenChange={setExperienceOpen}>
                        <CardHeader className="cursor-pointer" onClick={() => setExperienceOpen(!experienceOpen)}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    Professional Experience ({data.experience.length})
                                </CardTitle>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.experience.map((exp, index) => (
                                        <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                                            <h4 className="font-semibold">{exp.role}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span>{exp.company}</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{exp.duration}</span>
                                                </div>
                                            </div>
                                            {exp.description && (
                                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Collapsible>
                </Card>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <Card>
                    <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
                        <CardHeader className="cursor-pointer" onClick={() => setEducationOpen(!educationOpen)}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    Education ({data.education.length})
                                </CardTitle>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.education.map((edu, index) => (
                                        <div key={index} className="border-l-2 border-green-200 dark:border-green-800 pl-4">
                                            <h4 className="font-semibold">{edu.degree}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span>{edu.institution}</span>
                                                <span>•</span>
                                                <span>{edu.year}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Collapsible>
                </Card>
            )}

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground text-center">
                Last updated: {new Date(blueprint.updated_at).toLocaleString()}
            </div>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Professional Blueprint</DialogTitle>
                        <DialogDescription>
                            Manually update your blueprint data. These changes will overwrite existing information.
                        </DialogDescription>
                    </DialogHeader>
                    {isEditing && (
                        <BlueprintEditForm
                            initialData={data}
                            onSave={handleSave}
                            onCancel={() => setIsEditing(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
