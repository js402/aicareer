'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Plus, X, AlertCircle } from "lucide-react"
import type { ContactInfo, SeniorityLevel } from "@/lib/api-client"
import type { CVValidationResult } from "../cv-validation"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface PersonalInfoSectionProps {
    name: string
    contactInfo: string | ContactInfo
    summary: string
    seniorityLevel?: SeniorityLevel
    yearsOfExperience?: number
    industries: string[]
    onChange: (field: string, value: unknown) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

const SENIORITY_OPTIONS: { value: SeniorityLevel; label: string }[] = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'principal', label: 'Principal' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' },
]

function FieldWrapper({ 
    children, 
    fieldId, 
    validation,
    className
}: { 
    children: React.ReactNode
    fieldId: string
    validation?: CVValidationResult
    className?: string
}) {
    const missingField = validation?.criticalMissing.find(f => f.field === fieldId) ||
                         validation?.sections.flatMap(s => s.missingFields).find(f => f.field === fieldId)
    
    const isMissing = missingField?.isMissing && missingField?.severity === 'error'
    const isWarning = missingField?.isMissing && missingField?.severity === 'warning'
    
    return (
        <div className={cn(
            "space-y-2 rounded-lg transition-colors",
            isMissing && "bg-red-50 dark:bg-red-950/20 p-3 -m-3 border border-red-200 dark:border-red-900",
            isWarning && "bg-amber-50 dark:bg-amber-950/20 p-3 -m-3 border border-amber-200 dark:border-amber-900",
            className
        )}>
            {children}
            {missingField?.isMissing && (
                <p className={cn(
                    "text-xs flex items-center gap-1",
                    isMissing && "text-red-600 dark:text-red-400",
                    isWarning && "text-amber-600 dark:text-amber-400"
                )}>
                    <AlertCircle className="h-3 w-3" />
                    {missingField.message}
                </p>
            )}
        </div>
    )
}

export function PersonalInfoSection({
    name,
    contactInfo,
    summary,
    seniorityLevel,
    yearsOfExperience,
    industries,
    onChange,
    readOnly = false,
    validation
}: PersonalInfoSectionProps) {
    const [newIndustry, setNewIndustry] = useState('')

    // Parse contact info if it's a string
    const contact: ContactInfo = typeof contactInfo === 'string' 
        ? { raw: contactInfo }
        : contactInfo || {}

    const updateContact = (field: keyof ContactInfo, value: string) => {
        onChange('contactInfo', { ...contact, [field]: value })
    }

    const addIndustry = () => {
        if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
            onChange('industries', [...industries, newIndustry.trim()])
            setNewIndustry('')
        }
    }

    const removeIndustry = (index: number) => {
        onChange('industries', industries.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper fieldId="name" validation={validation}>
                        <Label htmlFor="name" className="flex items-center gap-1">
                            Full Name
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="John Doe"
                            disabled={readOnly}
                            className={cn(!name && "border-red-300 dark:border-red-800")}
                        />
                    </FieldWrapper>

                    <FieldWrapper fieldId="seniorityLevel" validation={validation}>
                        <Label htmlFor="seniority">Seniority Level</Label>
                        <Select
                            value={seniorityLevel || ''}
                            onValueChange={(value) => onChange('seniorityLevel', value as SeniorityLevel)}
                            disabled={readOnly}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select seniority level" />
                            </SelectTrigger>
                            <SelectContent>
                                {SENIORITY_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldWrapper>

                    <div className="space-y-2">
                        <Label htmlFor="years">Years of Experience</Label>
                        <Input
                            id="years"
                            type="number"
                            min={0}
                            max={50}
                            value={yearsOfExperience || ''}
                            onChange={(e) => onChange('yearsOfExperience', parseInt(e.target.value) || undefined)}
                            placeholder="5"
                            disabled={readOnly}
                        />
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper fieldId="contactInfo.email" validation={validation}>
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => updateContact('email', e.target.value)}
                            placeholder="john@example.com"
                            disabled={readOnly}
                            className={cn(!contact.email && "border-red-300 dark:border-red-800")}
                        />
                    </FieldWrapper>

                    <FieldWrapper fieldId="contactInfo.phone" validation={validation}>
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={contact.phone || ''}
                            onChange={(e) => updateContact('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            disabled={readOnly}
                        />
                    </FieldWrapper>

                    <FieldWrapper fieldId="contactInfo.location" validation={validation}>
                        <Label htmlFor="location" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                        </Label>
                        <Input
                            id="location"
                            value={contact.location || ''}
                            onChange={(e) => updateContact('location', e.target.value)}
                            placeholder="San Francisco, CA"
                            disabled={readOnly}
                        />
                    </FieldWrapper>

                    <FieldWrapper fieldId="contactInfo.linkedin" validation={validation}>
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                        </Label>
                        <Input
                            id="linkedin"
                            value={contact.linkedin || ''}
                            onChange={(e) => updateContact('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/johndoe"
                            disabled={readOnly}
                        />
                    </FieldWrapper>

                    <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            GitHub
                        </Label>
                        <Input
                            id="github"
                            value={contact.github || ''}
                            onChange={(e) => updateContact('github', e.target.value)}
                            placeholder="github.com/johndoe"
                            disabled={readOnly}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                        </Label>
                        <Input
                            id="website"
                            value={contact.website || ''}
                            onChange={(e) => updateContact('website', e.target.value)}
                            placeholder="johndoe.com"
                            disabled={readOnly}
                        />
                    </div>
                </div>
            </div>

            {/* Professional Summary */}
            <FieldWrapper fieldId="summary" validation={validation} className="space-y-4">
                <h3 className="text-lg font-medium">Professional Summary</h3>
                <Textarea
                    value={summary}
                    onChange={(e) => onChange('summary', e.target.value)}
                    placeholder="A brief professional summary highlighting your key strengths and career objectives..."
                    className="min-h-[120px]"
                    disabled={readOnly}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{summary.length} characters</span>
                    <span className={cn(
                        summary.length < 50 && "text-amber-600",
                        summary.length >= 50 && summary.length <= 500 && "text-green-600",
                        summary.length > 500 && "text-amber-600"
                    )}>
                        {summary.length < 50 ? 'Too short - add more detail' : 
                         summary.length > 500 ? 'Consider shortening' : 
                         'Good length'}
                    </span>
                </div>
            </FieldWrapper>

            {/* Industries */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Industries</h3>
                <p className="text-sm text-muted-foreground">
                    Add industries you have experience in or are targeting
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                    {industries.map((industry, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1">
                            {industry}
                            {!readOnly && (
                                <button
                                    onClick={() => removeIndustry(index)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    {industries.length === 0 && (
                        <span className="text-sm text-muted-foreground italic">No industries added yet</span>
                    )}
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        <Input
                            value={newIndustry}
                            onChange={(e) => setNewIndustry(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                            placeholder="Add industry (e.g., FinTech, Healthcare)"
                            className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addIndustry}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
