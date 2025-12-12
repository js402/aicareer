'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    Award, Plus, Trash2, ChevronDown, ChevronUp,
    Building2, Calendar
} from "lucide-react"
import type { CertificationEntry } from "@/lib/api-client"
import type { CVValidationResult } from "../cv-validation"

interface CertificationsSectionProps {
    certifications: CertificationEntry[]
    onChange: (certifications: CertificationEntry[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

// Common certification suggestions
const CERTIFICATION_SUGGESTIONS = [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { name: 'AWS Certified Developer', issuer: 'Amazon Web Services' },
    { name: 'Google Cloud Professional', issuer: 'Google' },
    { name: 'Azure Solutions Architect', issuer: 'Microsoft' },
    { name: 'Certified Kubernetes Administrator', issuer: 'CNCF' },
    { name: 'PMP (Project Management Professional)', issuer: 'PMI' },
    { name: 'Scrum Master (CSM)', issuer: 'Scrum Alliance' },
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'CISSP', issuer: 'ISC²' },
]

export function CertificationsSection({
    certifications,
    onChange,
    readOnly = false,
    validation: _validation
}: CertificationsSectionProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))
    const [showSuggestions, setShowSuggestions] = useState(false)

    const toggleExpand = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    const addCertification = (cert?: { name: string; issuer: string }) => {
        const newCert: CertificationEntry = {
            name: cert?.name || '',
            issuer: cert?.issuer || '',
            year: ''
        }
        onChange([...certifications, newCert])
        setExpandedItems(prev => new Set([...prev, certifications.length]))
        setShowSuggestions(false)
    }

    const updateCertification = (index: number, field: keyof CertificationEntry, value: string) => {
        const updated = [...certifications]
        updated[index] = { ...updated[index], [field]: value }
        onChange(updated)
    }

    const removeCertification = (index: number) => {
        onChange(certifications.filter((_, i) => i !== index))
    }

    const moveCertification = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === certifications.length - 1)
        ) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        const updated = [...certifications]
        const [removed] = updated.splice(index, 1)
        updated.splice(newIndex, 0, removed)
        onChange(updated)
    }

    // Filter out already added certifications from suggestions
    const availableSuggestions = CERTIFICATION_SUGGESTIONS.filter(
        suggestion => !certifications.some(cert => cert.name === suggestion.name)
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add professional certifications and credentials
                    </p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setShowSuggestions(!showSuggestions)} 
                            size="sm" 
                            variant="outline"
                        >
                            Suggestions
                        </Button>
                        <Button onClick={() => addCertification()} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Certification
                        </Button>
                    </div>
                )}
            </div>

            {/* Certification Suggestions */}
            {!readOnly && showSuggestions && availableSuggestions.length > 0 && (
                <Card className="border-dashed">
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                            Click to add a common certification:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.map((suggestion, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCertification(suggestion)}
                                    className="text-xs"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {suggestion.name}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {certifications.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Award className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No certifications added yet</p>
                        {!readOnly && (
                            <Button onClick={() => addCertification()} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Certification
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {certifications.map((cert, index) => (
                        <Card key={index} className="overflow-hidden">
                            <Collapsible open={expandedItems.has(index)} onOpenChange={() => toggleExpand(index)}>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {!readOnly && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveCertification(index, 'up') }}
                                                    disabled={index === 0}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveCertification(index, 'down') }}
                                                    disabled={index === certifications.length - 1}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                        
                                        <CollapsibleTrigger className="flex-1 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Award className="h-5 w-5 text-amber-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">
                                                        {cert.name || 'Untitled Certification'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Building2 className="h-3 w-3" />
                                                        {cert.issuer || 'Issuer'}
                                                        {cert.year && (
                                                            <>
                                                                <span>•</span>
                                                                <Calendar className="h-3 w-3" />
                                                                {cert.year}
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
                                                onClick={(e) => { e.stopPropagation(); removeCertification(index) }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>

                                <CollapsibleContent>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Certification Name</Label>
                                                <Input
                                                    value={cert.name}
                                                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                                    placeholder="AWS Solutions Architect"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Issuing Organization</Label>
                                                <Input
                                                    value={cert.issuer}
                                                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                                                    placeholder="Amazon Web Services"
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Year Obtained</Label>
                                                <Input
                                                    value={cert.year}
                                                    onChange={(e) => updateCertification(index, 'year', e.target.value)}
                                                    placeholder="2023"
                                                    disabled={readOnly}
                                                />
                                            </div>
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
