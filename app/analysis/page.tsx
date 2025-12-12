'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useCVStore } from "@/hooks/useCVStore"
import { useSubscription } from "@/hooks/useSubscription"
import { 
    ArrowLeft, Sparkles, Download, Edit, AlertCircle,
    Briefcase, Target, ChevronRight, Loader2, User, GraduationCap,
    Award, Globe, FolderOpen
} from "lucide-react"
import { downloadTextFile } from "@/lib/download-helpers"
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusAlert } from "@/components/ui/status-alert"
import { useCVOperations } from "@/hooks/useCVOperations"
import { CVEditorModal, validateCV } from "@/components/cv-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AnalysisPage() {
    const router = useRouter()
    const { content: cvContent, filename, extractedInfo, updateExtractedInfo, metadataId, analysis, clear: clearCV } = useCVStore()
    const { hasProAccess, isLoading: subLoading } = useSubscription()
    const cvOperations = useCVOperations()

    const [isMounted, setIsMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [hasAutoOpenedEditor, setHasAutoOpenedEditor] = useState(false)

    // Validate CV data to check completeness
    const cvValidation = useMemo(() => {
        return extractedInfo ? validateCV(extractedInfo) : null
    }, [extractedInfo])

    // Check authentication and load data
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            setIsLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/auth?redirect=analysis')
                return
            }

            if (!cvContent) {
                router.push('/')
                return
            }

            if (!hasProAccess && !subLoading) {
                router.push('/pricing')
                return
            }

            setIsMounted(true)
            setIsLoading(false)
        }

        checkAuthAndLoad()
    }, [cvContent, hasProAccess, subLoading, router])

    // Extract metadata when CV content is available but no extracted info exists
    useEffect(() => {
        if (isMounted && cvContent && !extractedInfo && hasProAccess) {
            cvOperations.extractMetadata(cvContent)
        }
    }, [isMounted, cvContent, extractedInfo, hasProAccess, cvOperations])

    // Auto-open editor if CV is incomplete (after extraction completes)
    useEffect(() => {
        if (cvValidation && !cvValidation.isComplete && !hasAutoOpenedEditor && !cvOperations.isLoading) {
            setIsEditorOpen(true)
            setHasAutoOpenedEditor(true)
        }
    }, [cvValidation, hasAutoOpenedEditor, cvOperations.isLoading])

    const handleAnalyze = async () => {
        if (!cvContent) return
        setIsAnalyzing(true)
        await cvOperations.analyzeCV(cvContent)
        setIsAnalyzing(false)
    }

    const handleDownload = () => {
        if (analysis) {
            downloadTextFile(analysis, `${filename}-analysis.txt`)
        } else {
            downloadTextFile(cvContent, filename)
        }
    }

    const handleSaveCVEdits = async (updatedInfo: typeof extractedInfo) => {
        if (!updatedInfo) return
        updateExtractedInfo(updatedInfo)
        
        if (metadataId) {
            try {
                const response = await fetch(`/api/cv-metadata/${metadataId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ extractedInfo: updatedInfo })
                })
                if (!response.ok) {
                    console.error('Failed to save CV edits to database')
                }
            } catch (error) {
                console.error('Error saving CV edits:', error)
            }
        }
    }

    if (!isMounted || isLoading || subLoading) {
        return <PageLoader message="Loading analysis..." />
    }

    if (!hasProAccess) {
        return <PageLoader message="Redirecting to pricing..." />
    }

    const contactInfo = extractedInfo?.contactInfo
    const hasContactObj = contactInfo && typeof contactInfo === 'object'

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/cv-review')}
                            className="gap-2 mb-2 -ml-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">{extractedInfo?.name || filename}</h1>
                        <p className="text-muted-foreground text-sm">
                            {hasContactObj && (contactInfo as any).email}
                            {hasContactObj && (contactInfo as any).location && ` · ${(contactInfo as any).location}`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {cvOperations.error && (
                    <StatusAlert variant="error" title="Error" message={cvOperations.error} className="mb-6" />
                )}

                {/* Incomplete CV Alert */}
                {cvValidation && !cvValidation.isComplete && !cvOperations.isLoading && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Complete Your Profile</AlertTitle>
                        <AlertDescription>
                            {cvValidation.criticalMissing.length} required field{cvValidation.criticalMissing.length !== 1 ? 's' : ''} missing for accurate analysis.
                            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setIsEditorOpen(true)}>
                                Complete now →
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {cvOperations.isLoading && (
                    <Card className="mb-6">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <LoadingSpinner />
                                <p className="text-muted-foreground">Extracting CV information...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Grid */}
                {extractedInfo && !cvOperations.isLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - CV Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* AI Analysis Card - Primary CTA */}
                            <Card className={analysis ? "border-green-200 dark:border-green-900" : "border-purple-200 dark:border-purple-900"}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Sparkles className="h-5 w-5 text-purple-600" />
                                        AI Career Analysis
                                    </CardTitle>
                                    {!analysis && (
                                        <CardDescription>
                                            Get personalized insights on your strengths, career trajectory, and recommendations.
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {!analysis ? (
                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                            size="lg"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Analyzing your CV...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate AI Analysis
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="prose dark:prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {analysis}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Next Steps - Only show after analysis */}
                            {analysis && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card 
                                        className="cursor-pointer hover:border-blue-400 transition-colors"
                                        onClick={() => router.push('/analysis/job-match')}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">Job Match Analysis</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        See how your CV matches specific job descriptions
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card 
                                        className="cursor-pointer hover:border-purple-400 transition-colors"
                                        onClick={() => router.push('/career-guidance')}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                                                    <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">Career Guidance</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Get personalized career advice and strategy
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        {/* Right Column - CV Overview Sidebar */}
                        <div className="space-y-4">
                            {/* Profile Summary */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    {extractedInfo.seniorityLevel && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Level</span>
                                            <span className="font-medium">{extractedInfo.seniorityLevel}</span>
                                        </div>
                                    )}
                                    {extractedInfo.yearsOfExperience && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Experience</span>
                                            <span className="font-medium">{extractedInfo.yearsOfExperience} years</span>
                                        </div>
                                    )}
                                    {hasContactObj && (contactInfo as any).linkedin && (
                                        <a 
                                            href={(contactInfo as any).linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline block truncate"
                                        >
                                            LinkedIn Profile
                                        </a>
                                    )}
                                    {hasContactObj && (contactInfo as any).github && (
                                        <a 
                                            href={(contactInfo as any).github} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline block truncate"
                                        >
                                            GitHub Profile
                                        </a>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Skills */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Skills
                                        <Badge variant="secondary" className="ml-auto">{extractedInfo.skills?.length || 0}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-1">
                                        {extractedInfo.skills?.slice(0, 12).map((skill, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                                        ))}
                                        {(extractedInfo.skills?.length || 0) > 12 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{extractedInfo.skills!.length - 12} more
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Experience */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Experience
                                        <Badge variant="secondary" className="ml-auto">{extractedInfo.experience?.length || 0}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {extractedInfo.experience?.slice(0, 3).map((exp, i) => (
                                        <div key={i} className="text-sm">
                                            <div className="font-medium truncate">{exp.role}</div>
                                            <div className="text-muted-foreground text-xs truncate">{exp.company}</div>
                                            <div className="text-muted-foreground text-xs">{exp.duration}</div>
                                        </div>
                                    ))}
                                    {(extractedInfo.experience?.length || 0) > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            +{extractedInfo.experience!.length - 3} more roles
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Education */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        Education
                                        <Badge variant="secondary" className="ml-auto">{extractedInfo.education?.length || 0}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {extractedInfo.education?.slice(0, 2).map((edu, i) => (
                                        <div key={i} className="text-sm">
                                            <div className="font-medium truncate">{edu.degree}</div>
                                            <div className="text-muted-foreground text-xs truncate">{edu.institution}</div>
                                            <div className="text-muted-foreground text-xs">{edu.year}</div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Projects (if any) */}
                            {extractedInfo.projects && extractedInfo.projects.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4" />
                                            Projects
                                            <Badge variant="secondary" className="ml-auto">{extractedInfo.projects.length}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {extractedInfo.projects.slice(0, 3).map((proj, i) => (
                                            <div key={i} className="text-sm">
                                                <div className="font-medium truncate">{proj.name}</div>
                                                {proj.technologies && proj.technologies.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {proj.technologies.slice(0, 3).map((tech, j) => (
                                                            <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{tech}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Languages (if any) */}
                            {extractedInfo.languages && extractedInfo.languages.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            Languages
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1">
                                            {extractedInfo.languages.map((lang, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* CV Editor Modal */}
                {extractedInfo && (
                    <CVEditorModal
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        initialData={extractedInfo}
                        onSave={handleSaveCVEdits}
                        title={cvValidation && !cvValidation.isComplete ? "Complete Your CV" : "Edit CV Data"}
                        description={cvValidation && !cvValidation.isComplete 
                            ? "Please fill in the missing required fields to enable full analysis"
                            : "Update your CV information before analysis or job matching"
                        }
                    />
                )}
            </main>
        </div>
    )
}
