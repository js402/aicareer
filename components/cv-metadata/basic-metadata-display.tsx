'use client'

import { useEffect, useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, FileText } from "lucide-react"

interface BasicMetadataDisplayProps {
    cvContent: string
}

interface BasicMetadata {
    name?: string
    email?: string
    phone?: string
    location?: string
    experienceCount?: number
    educationCount?: number
    skills?: string[]
    wordCount?: number
    lineCount?: number
}

export function BasicMetadataDisplay({ cvContent }: BasicMetadataDisplayProps) {
    const [metadata, setMetadata] = useState<BasicMetadata | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const extractBasicMetadata = async () => {
            if (!cvContent || cvContent.length < 10) {
                setMetadata({
                    wordCount: 0,
                    lineCount: 0,
                    experienceCount: 0,
                    educationCount: 0
                })
                return
            }

            setIsLoading(true)

            try {
                // Basic statistics
                const lines = cvContent.split('\n')
                const words = cvContent.split(/\s+/).filter(word => word.length > 0)

                // Extract name (simple heuristic - first non-empty line that doesn't look like contact info)
                let name = ''
                for (const line of lines) {
                    const trimmed = line.trim()
                    if (trimmed && trimmed.length > 2 && trimmed.length < 50) {
                        // Check if it doesn't look like an email, URL, or phone
                        if (!trimmed.includes('@') &&
                            !trimmed.includes('http') &&
                            !trimmed.match(/^\d/) &&
                            !trimmed.match(/\d{10,}/)) {
                            name = trimmed
                            break
                        }
                    }
                }

                // Extract email
                const emailMatch = cvContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
                const email = emailMatch ? emailMatch[0] : undefined

                // Extract phone (basic pattern)
                const phoneMatch = cvContent.match(/(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/)
                const phone = phoneMatch ? phoneMatch[0] : undefined

                // Try to extract location (simple pattern)
                const locationMatch = cvContent.match(/(?:based in|lives in|located in|from)\s+([A-Z][a-zA-Z\s,]+[A-Z][a-zA-Z]+)/i)
                const location = locationMatch ? locationMatch[1] : undefined

                // Count experience mentions
                const experienceKeywords = ['experience', 'work', 'employment', 'job', 'role', 'position', 'internship']
                const experienceCount = experienceKeywords.reduce((count, keyword) => {
                    const regex = new RegExp(keyword, 'gi')
                    const matches = cvContent.match(regex)
                    return count + (matches ? matches.length : 0)
                }, 0)

                // Count education mentions
                const educationKeywords = ['education', 'degree', 'university', 'college', 'school', 'bachelor', 'master', 'phd']
                const educationCount = educationKeywords.reduce((count, keyword) => {
                    const regex = new RegExp(keyword, 'gi')
                    const matches = cvContent.match(regex)
                    return count + (matches ? matches.length : 0)
                }, 0)

                // Simple skills detection
                const commonSkills = [
                    'javascript', 'python', 'java', 'react', 'node', 'aws', 'docker',
                    'typescript', 'html', 'css', 'sql', 'git', 'linux', 'agile',
                    'mongodb', 'express', 'angular', 'vue', 'php', 'ruby', 'c++', 'c#',
                    'swift', 'kotlin', 'go', 'rust', 'scala', 'postgresql', 'mysql',
                    'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'graphql', 'rest',
                    'jenkins', 'kubernetes', 'terraform', 'ansible', 'puppet', 'chef'
                ]
                const foundSkills = commonSkills.filter(skill =>
                    cvContent.toLowerCase().includes(skill)
                ).slice(0, 8) // Limit to 8 skills

                setMetadata({
                    name: name || undefined,
                    email,
                    phone,
                    location,
                    experienceCount,
                    educationCount,
                    skills: foundSkills.length > 0 ? foundSkills : undefined,
                    wordCount: words.length,
                    lineCount: lines.length
                })
            } catch (error) {
                console.error('Error extracting basic metadata:', error)
                // Set basic stats even if extraction fails
                const lines = cvContent.split('\n')
                const words = cvContent.split(/\s+/).filter(word => word.length > 0)
                setMetadata({
                    wordCount: words.length,
                    lineCount: lines.length,
                    experienceCount: 0,
                    educationCount: 0
                })
            } finally {
                setIsLoading(false)
            }
        }

        // Add a small delay to prevent rapid re-renders
        const timer = setTimeout(() => {
            extractBasicMetadata()
        }, 100)

        return () => clearTimeout(timer)
    }, [cvContent])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Analyzing CV...</span>
            </div>
        )
    }

    if (!metadata) {
        return (
            <div className="text-sm text-muted-foreground">
                Upload a CV to see basic information
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Basic Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Words</span>
                    </div>
                    <div className="font-medium">{metadata.wordCount || 0}</div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Lines</span>
                    </div>
                    <div className="font-medium">{metadata.lineCount || 0}</div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-2">
                {metadata.name && (
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{metadata.name}</span>
                    </div>
                )}

                <div className="space-y-1">
                    {metadata.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate text-muted-foreground">{metadata.email}</span>
                        </div>
                    )}

                    {metadata.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{metadata.phone}</span>
                        </div>
                    )}

                    {metadata.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{metadata.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sections */}
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
                {metadata.experienceCount !== undefined && metadata.experienceCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{metadata.experienceCount} exp</span>
                    </div>
                )}

                {metadata.educationCount !== undefined && metadata.educationCount > 0 && (
                    <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{metadata.educationCount} edu</span>
                    </div>
                )}
            </div>

            {/* Skills */}
            {metadata.skills && metadata.skills.length > 0 && (
                <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Skills detected</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {metadata.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="pt-2 text-xs text-muted-foreground italic">
                Sign in for detailed analysis and AI insights
            </div>
        </div>
    )
}