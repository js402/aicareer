'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award } from "lucide-react"
import type { ExtractedCVInfo } from "@/lib/api-client"

interface ExtractedMetadataCardProps {
    extractedInfo: ExtractedCVInfo | null
    isLoading: boolean
    error: string
}

export function ExtractedMetadataCard({ extractedInfo, isLoading, error }: ExtractedMetadataCardProps) {
    const formatContactInfo = (contactInfo: string | any) => {
        if (typeof contactInfo === 'string') {
            return contactInfo
        }

        const parts = []
        if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`)
        if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`)
        if (contactInfo.location) parts.push(`Location: ${contactInfo.location}`)
        if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`)

        return parts.join('\n')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Extracted CV Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-muted-foreground">Extracting metadata...</span>
                    </div>
                ) : extractedInfo ? (
                    <div className="space-y-4">
                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Name:</span>
                                    <span>{extractedInfo.name || 'Not specified'}</span>
                                </div>

                                {extractedInfo.contactInfo && (
                                    <div className="space-y-1 pl-6">
                                        <pre className="text-sm whitespace-pre-wrap font-sans">
                                            {formatContactInfo(extractedInfo.contactInfo)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Skills:</span>
                                    <Badge variant="outline">
                                        {extractedInfo.skills.length} skills
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {extractedInfo.skills.slice(0, 10).map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {extractedInfo.skills.length > 10 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{extractedInfo.skills.length - 10} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Experience & Education */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Experience</span>
                                    <Badge variant="outline">
                                        {extractedInfo.experience.length} roles
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {extractedInfo.experience.slice(0, 3).map((exp, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="font-medium">{exp.role}</div>
                                            <div className="text-muted-foreground">{exp.company}</div>
                                            <div className="text-xs text-muted-foreground">{exp.duration}</div>
                                        </div>
                                    ))}
                                    {extractedInfo.experience.length > 3 && (
                                        <div className="text-sm text-muted-foreground">
                                            +{extractedInfo.experience.length - 3} more experiences
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Education</span>
                                    <Badge variant="outline">
                                        {extractedInfo.education.length} degrees
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {extractedInfo.education.slice(0, 3).map((edu, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="font-medium">{edu.degree}</div>
                                            <div className="text-muted-foreground">{edu.institution}</div>
                                            <div className="text-xs text-muted-foreground">{edu.year}</div>
                                        </div>
                                    ))}
                                    {extractedInfo.education.length > 3 && (
                                        <div className="text-sm text-muted-foreground">
                                            +{extractedInfo.education.length - 3} more education entries
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No metadata extracted yet. {error || 'Upload a valid CV to begin.'}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
