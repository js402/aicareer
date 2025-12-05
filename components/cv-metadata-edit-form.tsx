'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Save, X } from "lucide-react"
import type { CVMetadataResponse, ExtractedCVInfo } from "@/lib/api-client"

interface ContactInfo {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
}

interface ExtractedCVInfoExtended extends Omit<ExtractedCVInfo, 'contactInfo'> {
    contactInfo: ContactInfo
}

interface CVMetadataEditFormProps {
    metadata: CVMetadataResponse
    onSave: (updatedInfo: ExtractedCVInfoExtended) => Promise<void>
    onCancel: () => void
}

interface Experience {
    role: string
    company: string
    duration: string
}

interface Education {
    degree: string
    institution: string
    year: string
}

export function CVMetadataEditForm({ metadata, onSave, onCancel }: CVMetadataEditFormProps) {
    const [isSaving, setIsSaving] = useState(false)

    // Parse contactInfo if it's a string, otherwise assume it's already structured
    const parseContactInfo = (contactInfo: any): ContactInfo => {
        if (typeof contactInfo === 'string') {
            // Try to parse common patterns
            const email = contactInfo.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || ''
            const phone = contactInfo.match(/[\+]?[\d\s\-\(\)]{10,}/)?.[0] || ''
            return { email, phone, location: contactInfo.replace(email, '').replace(phone, '').trim() }
        }
        return contactInfo || {}
    }

    const [formData, setFormData] = useState<ExtractedCVInfoExtended>({
        ...metadata.extracted_info,
        contactInfo: parseContactInfo(metadata.extracted_info.contactInfo)
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(formData)
        } catch (error) {
            console.error('Save failed:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const updateField = (field: keyof ExtractedCVInfoExtended, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateContactField = (field: keyof ContactInfo, value: string) => {
        setFormData(prev => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, [field]: value }
        }))
    }

    const addSkill = () => {
        updateField('skills', [...formData.skills, ''])
    }

    const updateSkill = (index: number, value: string) => {
        const newSkills = [...formData.skills]
        newSkills[index] = value
        updateField('skills', newSkills)
    }

    const removeSkill = (index: number) => {
        updateField('skills', formData.skills.filter((_, i) => i !== index))
    }

    const addExperience = () => {
        updateField('experience', [...formData.experience, { role: '', company: '', duration: '' }])
    }

    const updateExperience = (index: number, field: keyof Experience, value: string) => {
        const newExperience = [...formData.experience]
        newExperience[index] = { ...newExperience[index], [field]: value }
        updateField('experience', newExperience)
    }

    const removeExperience = (index: number) => {
        updateField('experience', formData.experience.filter((_, i) => i !== index))
    }

    const addEducation = () => {
        updateField('education', [...formData.education, { degree: '', institution: '', year: '' }])
    }

    const updateEducation = (index: number, field: keyof Education, value: string) => {
        const newEducation = [...formData.education]
        newEducation[index] = { ...newEducation[index], [field]: value }
        updateField('education', newEducation)
    }

    const removeEducation = (index: number) => {
        updateField('education', formData.education.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Edit CV Information</h2>
                    <p className="text-muted-foreground mt-1">Update your extracted CV data</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Tabbed Form */}
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Experience
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Education
                    </TabsTrigger>
                </TabsList>

                {/* Personal Tab */}
                <TabsContent value="personal" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="Enter your full name"
                                    className="text-lg"
                                />
                            </div>

                            {/* Skills Section */}
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium">Skills ({formData.skills.length})</Label>
                                    <Button variant="outline" size="sm" onClick={addSkill}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Skill
                                    </Button>
                                </div>

                                {formData.skills.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No skills added yet. Click "Add Skill" to get started.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {formData.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    value={skill}
                                                    onChange={(e) => updateSkill(index, e.target.value)}
                                                    placeholder="Enter a skill"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeSkill(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.contactInfo.email || ''}
                                        onChange={(e) => updateContactField('email', e.target.value)}
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={formData.contactInfo.phone || ''}
                                        onChange={(e) => updateContactField('phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={formData.contactInfo.location || ''}
                                        onChange={(e) => updateContactField('location', e.target.value)}
                                        placeholder="City, State/Country"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.contactInfo.linkedin || ''}
                                        onChange={(e) => updateContactField('linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="website">Personal Website / Portfolio</Label>
                                    <Input
                                        id="website"
                                        value={formData.contactInfo.website || ''}
                                        onChange={(e) => updateContactField('website', e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Work Experience ({formData.experience.length})
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={addExperience}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Experience
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {formData.experience.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    No experience added yet. Click "Add Experience" to get started.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {formData.experience.map((exp, index) => (
                                        <Card key={index} className="border-l-4 border-l-blue-500">
                                            <CardContent className="pt-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Job Title</Label>
                                                        <Input
                                                            value={exp.role}
                                                            onChange={(e) => updateExperience(index, 'role', e.target.value)}
                                                            placeholder="e.g. Software Engineer"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Company</Label>
                                                        <Input
                                                            value={exp.company}
                                                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                            placeholder="e.g. Google Inc."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Duration</Label>
                                                        <Input
                                                            value={exp.duration}
                                                            onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                                            placeholder="e.g. 2020 - 2023"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeExperience(index)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Education ({formData.education.length})
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={addEducation}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Education
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {formData.education.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    No education added yet. Click "Add Education" to get started.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {formData.education.map((edu, index) => (
                                        <Card key={index} className="border-l-4 border-l-green-500">
                                            <CardContent className="pt-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Degree</Label>
                                                        <Input
                                                            value={edu.degree}
                                                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                            placeholder="e.g. Bachelor of Science"
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
                                                    <div className="space-y-2">
                                                        <Label>Year</Label>
                                                        <Input
                                                            value={edu.year}
                                                            onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                                            placeholder="e.g. 2020"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeEducation(index)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
