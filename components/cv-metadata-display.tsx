'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Briefcase, GraduationCap, Award, AlertCircle, Phone, MapPin, Globe } from "lucide-react"
import type { ExtractedCVInfo } from "@/lib/api-client"

interface CVMetadataDisplayProps {
    extractedInfo: ExtractedCVInfo | null
    isLoading?: boolean
    error?: string
}

export function CVMetadataDisplay({ extractedInfo, isLoading, error }: CVMetadataDisplayProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Extracted Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Extraction Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!extractedInfo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Extracted Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No information extracted yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg font-semibold">{extractedInfo.name || 'Not detected'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Information</label>
                        <div className="space-y-2 mt-2">
                            {typeof extractedInfo.contactInfo === 'string' ? (
                                <p className="text-sm">{extractedInfo.contactInfo || 'Not detected'}</p>
                            ) : (
                                <>
                                    {extractedInfo.contactInfo?.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <span>{extractedInfo.contactInfo.email}</span>
                                        </div>
                                    )}
                                    {extractedInfo.contactInfo?.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span>{extractedInfo.contactInfo.phone}</span>
                                        </div>
                                    )}
                                    {extractedInfo.contactInfo?.location && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span>{extractedInfo.contactInfo.location}</span>
                                        </div>
                                    )}
                                    {extractedInfo.contactInfo?.website && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                            <span>{extractedInfo.contactInfo.website}</span>
                                        </div>
                                    )}
                                    {!extractedInfo.contactInfo?.email &&
                                     !extractedInfo.contactInfo?.phone &&
                                     !extractedInfo.contactInfo?.location &&
                                     !extractedInfo.contactInfo?.website && (
                                        <p className="text-sm text-muted-foreground">Not detected</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Skills ({extractedInfo.skills.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {extractedInfo.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {extractedInfo.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No skills detected</p>
                    )}
                </CardContent>
            </Card>

            {/* Experience */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Experience ({extractedInfo.experience.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {extractedInfo.experience.length > 0 ? (
                        <div className="space-y-4">
                            {extractedInfo.experience.map((exp, index) => (
                                <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                                    <h4 className="font-semibold">{exp.role}</h4>
                                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                                    <p className="text-xs text-muted-foreground">{exp.duration}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No experience detected</p>
                    )}
                </CardContent>
            </Card>

            {/* Education */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education ({extractedInfo.education.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {extractedInfo.education.length > 0 ? (
                        <div className="space-y-4">
                            {extractedInfo.education.map((edu, index) => (
                                <div key={index} className="border-l-2 border-green-200 dark:border-green-800 pl-4">
                                    <h4 className="font-semibold">{edu.degree}</h4>
                                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                    <p className="text-xs text-muted-foreground">{edu.year}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No education detected</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
