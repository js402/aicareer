'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, X } from "lucide-react"

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

interface BlueprintEditFormProps {
    initialData: BlueprintData
    onSave: (data: BlueprintData) => Promise<void>
    onCancel: () => void
}

export function BlueprintEditForm({ initialData, onSave, onCancel }: BlueprintEditFormProps) {
    const [formData, setFormData] = useState<BlueprintData>(JSON.parse(JSON.stringify(initialData)))
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
        } catch (error) {
            console.error('Failed to save blueprint:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const updatePersonal = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            personal: { ...prev.personal, [field]: value }
        }))
    }

    const updateContact = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            contact: { ...prev.contact, [field]: value }
        }))
    }

    // Skills Helpers
    const addSkill = () => {
        setFormData(prev => ({
            ...prev,
            skills: [...(prev.skills || []), { name: '', confidence: 1 }]
        }))
    }

    const removeSkill = (index: number) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.filter((_, i) => i !== index)
        }))
    }

    const updateSkill = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }))
    }

    // Experience Helpers
    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experience: [...(prev.experience || []), { role: '', company: '', duration: '' }]
        }))
    }

    const removeExperience = (index: number) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience?.filter((_, i) => i !== index)
        }))
    }

    const updateExperience = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience?.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }))
    }

    // Education Helpers
    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...(prev.education || []), { degree: '', institution: '', year: '' }]
        }))
    }

    const removeEducation = (index: number) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education?.filter((_, i) => i !== index)
        }))
    }

    const updateEducation = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education?.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.personal?.name || ''}
                                onChange={(e) => updatePersonal('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="summary">Professional Summary</Label>
                            <Textarea
                                id="summary"
                                value={formData.personal?.summary || ''}
                                onChange={(e) => updatePersonal('summary', e.target.value)}
                                className="h-24"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.contact?.email || ''}
                                onChange={(e) => updateContact('email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.contact?.phone || ''}
                                onChange={(e) => updateContact('phone', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.contact?.location || ''}
                                onChange={(e) => updateContact('location', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <Input
                                id="linkedin"
                                value={formData.contact?.linkedin || ''}
                                onChange={(e) => updateContact('linkedin', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                                id="website"
                                value={formData.contact?.website || ''}
                                onChange={(e) => updateContact('website', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Skills</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formData.skills?.map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                <Input
                                    value={skill.name}
                                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                    placeholder="Skill name"
                                    className="border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSkill(index)}
                                    className="text-red-500 hover:text-red-600 px-2 h-auto"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Experience */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Experience</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {formData.experience?.map((exp, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExperience(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role Title</Label>
                                    <Input
                                        value={exp.role}
                                        onChange={(e) => updateExperience(index, 'role', e.target.value)}
                                        placeholder="e.g. Senior Developer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input
                                        value={exp.company}
                                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                        placeholder="e.g. Tech Corp"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Duration</Label>
                                    <Input
                                        value={exp.duration}
                                        onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                        placeholder="e.g. Jan 2020 - Present"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={exp.description || ''}
                                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Education */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Education</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {formData.education?.map((edu, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducation(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Degree</Label>
                                    <Input
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                        placeholder="e.g. BS Computer Science"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Institution</Label>
                                    <Input
                                        value={edu.institution}
                                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                        placeholder="e.g. University of Example"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Year/Duration</Label>
                                    <Input
                                        value={edu.year}
                                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                        placeholder="e.g. 2018-2022"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 sticky bottom-4 bg-background p-4 border-t rounded-lg shadow-lg">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
