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
    Briefcase, Loader2, User, GraduationCap,
    Award, Globe, FolderOpen
} from "lucide-react"
import { downloadTextFile } from "@/lib/download-helpers"
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusAlert } from "@/components/ui/status-alert"
import { useCVOperations } from "@/hooks/useCVOperations"
import { CVEditorModal, validateCV } from "@/components/cv-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    const [generateError, setGenerateError] = useState<string | null>(null)

    // Validate CV data to check completeness
    const cvValidation = useMemo(() => {
        return extractedInfo ? validateCV(extractedInfo) : null
    }, [extractedInfo])

    // Check if we can generate analysis (have either raw content or extracted info)
    const canGenerateAnalysis = useMemo(() => {
        // We can analyze if we have extracted info (preferred) or raw CV content
        // We can analyze if we have extracted info (preferred) or just metadata ID (implies valid CV)
        return !!extractedInfo || !!metadataId
    }, [cvContent, extractedInfo])

    // Check authentication and load data
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            setIsLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/auth?redirect=analysis')
                return
            }

            if (!metadataId) {
                // Determine if we should redirect to onboarding or home
                // For now, if no ID and no content, go home. 
                // If content exists but no ID, they skipped onboarding? -> Redirect to onboarding
                if (cvContent) {
                    router.push('/onboarding')
                    return
                }
                router.push('/')
                return
            }

            if (!hasProAccess && !subLoading) {
                router.push('/pricing')
                return
            }

            // If analysis already exists, go directly to report
            if (analysis) {
                router.replace('/analysis/report')
                return
            }

            setIsMounted(true)
            setIsLoading(false)
        }

        checkAuthAndLoad()
    }, [cvContent, hasProAccess, subLoading, router, analysis])

    // Extract metadata when CV content is available but no extracted info exists
    useEffect(() => {
        if (isMounted && cvContent && !extractedInfo && hasProAccess) {
            cvOperations.extractMetadata(cvContent)
        }
    }, [isMounted, cvContent, extractedInfo, hasProAccess, cvOperations])

    // Rehydrate from DB if we have ID but no data (e.g. fresh login/reload)
    useEffect(() => {
        if (isMounted && metadataId && !extractedInfo && !cvOperations.isLoading) {
            // We use a specific fetcher or the existing extract-metadata (which handles cache)
            // But simpler might be to use retrieve-analysis logic or just wait for user to click
            // Actually, we want to auto-load.
            // Let's use `checkAuthAndLoad` to trigger a fetch if needed, 
            // but `useCVOperations` has `loadAnalysisFromMetadata` which takes a hash.
            // We have the ID, not the hash. 
            // Ideally we should have a `getCV(id)` method. 
            // For now, let's assume the component will handle missing data by asking to "Edit Profile" 
            // or similar, OR we should implement a fetch by ID. 
            // Given the current hooks, `retrieve-analysis` is by hash.
            // Let's use the `cv-metadata` API to fetch by ID.
            const fetchCV = async () => {
                try {
                    const res = await fetch(`/api/cv-metadata/${metadataId}`)
                    if (res.ok) {
                        const data = await res.json()
                        // Update store without clearing ID
                        updateExtractedInfo(data.extracted_info)
                        // If we stored content in DB, we could fetch it too if we wanted to display "Raw CV"
                        // But the requirement is "use selected CV from DB".
                    }
                } catch (e) {
                    console.error("Failed to rehydrate CV", e)
                }
            }
            fetchCV()
        }
    }, [isMounted, metadataId, extractedInfo, cvOperations.isLoading, updateExtractedInfo])

    // Auto-open editor only if validation fails AND we have data
    useEffect(() => {
        if (cvValidation && !cvValidation.isComplete && !hasAutoOpenedEditor && !cvOperations.isLoading && extractedInfo) {
            setIsEditorOpen(true)
            setHasAutoOpenedEditor(true)
        }
    }, [cvValidation, hasAutoOpenedEditor, cvOperations.isLoading, extractedInfo])

    const handleAnalyze = async () => {
        if (!canGenerateAnalysis) {
            setGenerateError('No CV data available. Please upload a CV first.')
            return
        }

        setIsAnalyzing(true)
        setGenerateError(null)

        try {
            // Pass both cvContent and extractedInfo - API will use what's available
            const result = await cvOperations.analyzeCV(cvContent || undefined, extractedInfo || undefined)
            if (result?.analysis) {
                router.push('/analysis/report')
            } else if (cvOperations.error) {
                setGenerateError(cvOperations.error)
            } else {
                setGenerateError('Failed to generate analysis. Please try again.')
            }
        } catch (error) {
            setGenerateError(error instanceof Error ? error.message : 'An unexpected error occurred')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleDownload = () => {
        downloadTextFile(cvContent, filename)
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
        return <PageLoader message="Loading profile..." />
    }

    if (!hasProAccess) {
        return <PageLoader message="Redirecting to pricing..." />
    }

    const contactInfo = extractedInfo?.contactInfo
    const hasContactObj = contactInfo && typeof contactInfo === 'object'

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/cv-metadata')}
                            className="gap-2 mb-2 -ml-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to My CVs
                        </Button>
                        <h1 className="text-2xl font-bold">Profile Preview</h1>
                        <p className="text-muted-foreground text-sm">
                            {filename && <span className="font-medium">{filename}</span>}
                            {extractedInfo?.name && <span> · {extractedInfo.name}</span>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download CV
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

                {/* Main Content */}
                {extractedInfo && !cvOperations.isLoading && (
                    <div className="space-y-12">
                        {/* Hero Section - Primary CTA */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-6 md:p-8 text-white shadow-2xl">
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                                    <Sparkles className="h-8 w-8 text-purple-100" />
                                </div>

                                <div className="space-y-3 max-w-2xl">
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-100">
                                        Generate AI Career Analysis
                                    </h2>
                                    <p className="text-purple-100 text-base md:text-lg leading-relaxed">
                                        Review your extracted profile below, then generate a comprehensive AI analysis to identify strengths, career paths, and improvement opportunities.
                                    </p>
                                </div>

                                {generateError && (
                                    <Alert variant="destructive" className="max-w-md bg-red-500/10 border-red-500/20 text-white backdrop-blur-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Analysis Failed</AlertTitle>
                                        <AlertDescription>{generateError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col items-center gap-3 w-full">
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !canGenerateAnalysis}
                                        size="lg"
                                        className="h-14 px-8 text-base font-bold bg-white text-purple-600 hover:bg-purple-50 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] rounded-full border-4 border-white/20 bg-clip-padding"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Analyzing Profile...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-5 w-5" />
                                                Generate Full Analysis
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs font-medium text-purple-200/80 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Powered by AI • Takes ~30 seconds
                                    </p>
                                </div>
                            </div>

                            {/* Decorative background elements */}
                            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl mix-blend-overlay" />
                            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl mix-blend-overlay" />
                        </div>

                        {/* CV Overview Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <User className="h-6 w-6 text-purple-600" />
                                            Extracted Profile Data
                                        </h3>
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                            AI Extracted
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-2xl">
                                        Review and correct any errors before generating your analysis. This data was automatically extracted from <span className="font-medium">{filename || 'your CV'}</span>.
                                    </p>
                                </div>
                                <Button onClick={() => setIsEditorOpen(true)} className="gap-2 shadow-sm">
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </div>

                            {/* Profile Header Card */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-semibold">{extractedInfo.name || "Candidate"}</h4>
                                                {extractedInfo.seniorityLevel && (
                                                    <Badge variant="outline" className="capitalize">{extractedInfo.seniorityLevel}</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                {extractedInfo.yearsOfExperience !== undefined && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Briefcase className="h-4 w-4" />
                                                        {extractedInfo.yearsOfExperience} years exp.
                                                    </span>
                                                )}
                                                {hasContactObj && (contactInfo as any).location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Globe className="h-4 w-4" />
                                                        {(contactInfo as any).location}
                                                    </span>
                                                )}
                                                {hasContactObj && (contactInfo as any).email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-4 h-4 flex items-center justify-center font-bold">@</span>
                                                        {(contactInfo as any).email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {hasContactObj && (contactInfo as any).linkedin && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={(contactInfo as any).linkedin} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                        <Globe className="h-4 w-4" />
                                                        LinkedIn
                                                    </a>
                                                </Button>
                                            )}
                                            {hasContactObj && (contactInfo as any).github && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={(contactInfo as any).github} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                        <FolderOpen className="h-4 w-4" />
                                                        GitHub
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [&>*:last-child:nth-child(odd)]:md:col-span-2">
                                {/* Skills */}
                                <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Award className="h-4 w-4 text-purple-500" />
                                            Skills
                                            <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">{extractedInfo.skills?.length || 0}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {extractedInfo.skills?.slice(0, 12).map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs font-normal bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">{skill}</Badge>
                                            ))}
                                            {(extractedInfo.skills?.length || 0) > 12 && (
                                                <Badge variant="outline" className="text-xs border-dashed">
                                                    +{extractedInfo.skills!.length - 12} more
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Experience */}
                                <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Briefcase className="h-4 w-4 text-purple-500" />
                                            Experience
                                            <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">{extractedInfo.experience?.length || 0}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        {extractedInfo.experience?.slice(0, 3).map((exp, i) => (
                                            <div key={i} className="text-sm group">
                                                <div className="font-medium truncate group-hover:text-purple-600 transition-colors">{exp.role}</div>
                                                <div className="text-muted-foreground text-xs truncate">{exp.company}</div>
                                                <div className="text-muted-foreground text-xs mt-0.5">{exp.duration}</div>
                                            </div>
                                        ))}
                                        {(extractedInfo.experience?.length || 0) > 3 && (
                                            <p className="text-xs text-muted-foreground pt-2 border-t border-slate-100 dark:border-slate-800">
                                                +{extractedInfo.experience!.length - 3} more roles
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Education */}
                                <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <GraduationCap className="h-4 w-4 text-purple-500" />
                                            Education
                                            <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">{extractedInfo.education?.length || 0}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        {extractedInfo.education?.slice(0, 2).map((edu, i) => (
                                            <div key={i} className="text-sm group">
                                                <div className="font-medium truncate group-hover:text-purple-600 transition-colors">{edu.degree}</div>
                                                <div className="text-muted-foreground text-xs truncate">{edu.institution}</div>
                                                <div className="text-muted-foreground text-xs mt-0.5">{edu.year}</div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Projects (if any) */}
                                {extractedInfo.projects && extractedInfo.projects.length > 0 && (
                                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <FolderOpen className="h-4 w-4 text-purple-500" />
                                                Projects
                                                <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">{extractedInfo.projects.length}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-4">
                                            {extractedInfo.projects.slice(0, 3).map((proj, i) => (
                                                <div key={i} className="text-sm">
                                                    <div className="font-medium truncate">{proj.name}</div>
                                                    {proj.technologies && proj.technologies.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {proj.technologies.slice(0, 3).map((tech, j) => (
                                                                <span key={j} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{tech}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Leadership (if any) */}
                                {extractedInfo.leadership && extractedInfo.leadership.length > 0 && (
                                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Award className="h-4 w-4 text-purple-500" />
                                                Leadership
                                                <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">{extractedInfo.leadership.length}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-4">
                                            {extractedInfo.leadership.slice(0, 3).map((lead, i) => (
                                                <div key={i} className="text-sm">
                                                    <div className="font-medium truncate">{lead.role}</div>
                                                    <div className="text-muted-foreground text-xs truncate">{lead.organization}</div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Languages (if any) */}
                                {extractedInfo.languages && extractedInfo.languages.length > 0 && (
                                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Globe className="h-4 w-4 text-purple-500" />
                                                Languages
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {extractedInfo.languages.map((lang, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs font-normal">{lang}</Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
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
