import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Award, Briefcase, GraduationCap } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { ExtractedCVInfo } from "@/lib/api-client"

interface CVMetadataDisplayProps {
    extractedInfo: ExtractedCVInfo | null
    isLoading?: boolean
}

const formatContactInfo = (contactInfo: any): string => {
    if (typeof contactInfo === 'string') {
        return contactInfo
    }
    const parts: string[] = []
    if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`)
    if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`)
    if (contactInfo.location) parts.push(`Location: ${contactInfo.location}`)
    if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`)
    if (contactInfo.github) parts.push(`GitHub: ${contactInfo.github}`)
    if (contactInfo.website) parts.push(`Website: ${contactInfo.website}`)
    return parts.join('\n') || 'Not specified'
}

export function CVMetadataDisplay({ extractedInfo, isLoading }: CVMetadataDisplayProps) {
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
                        <LoadingSpinner />
                        <span className="text-muted-foreground ml-2">Extracting metadata...</span>
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
                        {/* Summary */}
                        {extractedInfo.summary && (
                            <div className="pt-4 border-t">
                                <div className="font-medium mb-1">Professional Summary</div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {extractedInfo.summary}
                                </p>
                            </div>
                        )}

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
                                            +{extractedInfo.education.length - 3} more degrees
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Projects & Certifications */}
                        {(extractedInfo.projects?.length > 0 || extractedInfo.certifications?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                {extractedInfo.projects?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Projects</span>
                                            <Badge variant="outline">
                                                {extractedInfo.projects.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {extractedInfo.projects.slice(0, 3).map((proj, index) => (
                                                <div key={index} className="text-sm">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {proj.name}
                                                        {proj.link && (
                                                            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
                                                                Link
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs line-clamp-2">{proj.description}</div>
                                                    {proj.technologies && proj.technologies.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {proj.technologies.slice(0, 3).map((tech, i) => (
                                                                <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {extractedInfo.projects.length > 3 && (
                                                <div className="text-sm text-muted-foreground">
                                                    +{extractedInfo.projects.length - 3} more projects
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {extractedInfo.certifications?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Award className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Certifications</span>
                                            <Badge variant="outline">
                                                {extractedInfo.certifications.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {extractedInfo.certifications.slice(0, 3).map((cert, index) => (
                                                <div key={index} className="text-sm">
                                                    <div className="font-medium">{cert.name}</div>
                                                    <div className="text-muted-foreground">{cert.issuer}</div>
                                                    <div className="text-xs text-muted-foreground">{cert.year}</div>
                                                </div>
                                            ))}
                                            {extractedInfo.certifications.length > 3 && (
                                                <div className="text-sm text-muted-foreground">
                                                    +{extractedInfo.certifications.length - 3} more certifications
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Languages */}
                        {extractedInfo.languages?.length > 0 && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">Languages:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {extractedInfo.languages.map((lang, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-2 opacity-20" />
                        <p className="ml-2">
                            No metadata extracted yet. Upload a valid CV to begin.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
