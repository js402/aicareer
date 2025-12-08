'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useCVStore } from "@/hooks/useCVStore"
import { useSubscription } from "@/hooks/useSubscription"
import { ArrowLeft, Sparkles, FileText, Loader2, CheckCircle, AlertCircle, Download, Briefcase, GraduationCap, Award, User } from "lucide-react"
import { downloadTextFile } from "@/lib/download-helpers"
import { extractCVMetadata, analyzeCV } from "@/lib/api-client"
import { MissingInfoModal } from "@/components/analysis/MissingInfoModal"
import type { ExtractedCVInfo, AnalyzeCVResponse } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AnalysisPage() {
    const router = useRouter()
    const { content: cvContent, filename, extractedInfo, setExtractedInfo, analysis, setAnalysis, appendSupplementalInfo, clear: clearCV } = useCVStore()
    const { hasProAccess, isLoading: subLoading } = useSubscription()

    const [isMounted, setIsMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isExtracting, setIsExtracting] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState<string>('')

    // Missing info modal state
    const [missingInfoQuestions, setMissingInfoQuestions] = useState<string[]>([])
    const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false)
    const [isProcessingSupplementalInfo, setIsProcessingSupplementalInfo] = useState(false)

    // Check authentication and load data
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            setIsLoading(true)

            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Not authenticated, redirect to auth
                router.push('/auth?redirect=analysis')
                return
            }

            if (!cvContent) {
                // No CV uploaded, redirect to home
                router.push('/')
                return
            }

            // Check subscription status
            if (!hasProAccess && !subLoading) {
                router.push('/pricing')
                return
            }

            setIsMounted(true)
            setIsLoading(false)

            // If we have CV content but no extracted info, start extraction
            if (cvContent && !extractedInfo && hasProAccess) {
                extractMetadata()
            }
        }

        checkAuthAndLoad()
    }, [cvContent, hasProAccess, subLoading, router, extractedInfo])

    const extractMetadata = async () => {
        if (!cvContent || !hasProAccess) return

        setIsExtracting(true)
        setError('')

        try {
            const result = await extractCVMetadata(cvContent)

            if (result.status === 'incomplete' && result.questions) {
                // Show modal for missing info
                setMissingInfoQuestions(result.questions)
                setIsMissingInfoModalOpen(true)

                // Still set extracted info if available
                if (result.extractedInfo) {
                    setExtractedInfo(result.extractedInfo)
                }
            } else if (result.status === 'valid' || result.status === 'cached') {
                if (result.extractedInfo) {
                    setExtractedInfo(result.extractedInfo)
                }
            } else if (result.status === 'invalid') {
                setError(result.message || 'Invalid CV format')
            } else {
                setError('Failed to extract metadata')
            }
        } catch (err) {
            console.error('Extraction error:', err)
            setError('Failed to process your CV')
        } finally {
            setIsExtracting(false)
        }
    }

    const handleAnalyze = async () => {
        if (!cvContent) return

        setIsAnalyzing(true)
        setError('')

        try {
            const result: AnalyzeCVResponse = await analyzeCV(cvContent)

            if (result.status === 'incomplete' && result.questions) {
                // Show modal for missing info
                setMissingInfoQuestions(result.questions)
                setIsMissingInfoModalOpen(true)
            } else if (result.status === 'invalid') {
                setError(result.message || 'Invalid CV format')
            } else if (result.analysis) {
                setAnalysis(result.analysis)
            } else {
                setError('Failed to generate analysis')
            }
        } catch (err) {
            console.error('Analysis error:', err)
            setError(err instanceof Error ? err.message : 'Failed to analyze CV')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleMissingInfoSubmit = async (answers: string[]) => {
        setIsProcessingSupplementalInfo(true)
        setIsMissingInfoModalOpen(false)

        try {
            // Append supplemental info to CV store
            appendSupplementalInfo(missingInfoQuestions, answers)

            // Re-extract with updated content
            await extractMetadata()
        } catch (error) {
            console.error('Error processing supplemental info:', error)
            setError('Failed to process supplemental information.')
        } finally {
            setIsProcessingSupplementalInfo(false)
        }
    }

    const handleDownload = () => {
        if (analysis) {
            downloadTextFile(analysis, `${filename}-analysis.txt`)
        } else {
            downloadTextFile(cvContent, filename)
        }
    }

    const handleNewCV = () => {
        clearCV()
        router.push('/')
    }

    const handleGoToJobMatch = () => {
        router.push('/analysis/job-match')
    }

    const handleGoToCareerGuidance = () => {
        router.push('/career-guidance')
    }

    const formatContactInfo = (contactInfo: string | any) => {
        if (typeof contactInfo === 'string') {
            return contactInfo
        }

        const parts = []
        if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`)
        if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`)
        if (contactInfo.location) parts.push(`Location: ${contactInfo.location}`)
        if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`)
        if (contactInfo.website) parts.push(`Website: ${contactInfo.website}`)

        return parts.join('\n')
    }

    if (!isMounted || isLoading || subLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading analysis...</p>
                    </div>
                </main>
            </div>
        )
    }

    if (!hasProAccess) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-muted-foreground">Redirecting to pricing...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/cv-review')}
                            className="gap-2 mb-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Preview
                        </Button>
                        <h1 className="text-3xl font-bold">CV Analysis Dashboard</h1>
                        <p className="text-muted-foreground">
                            Full analysis for {filename}
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">CV Status</p>
                                    <p className="text-lg font-bold">{extractedInfo ? 'Processed' : 'Processing...'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Subscription</p>
                                    <p className="text-lg font-bold">Pro Plan</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Features</p>
                                    <p className="text-lg font-bold">Full Access</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="mb-6 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">Error</h3>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {isExtracting && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3 py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <p className="text-muted-foreground">Extracting CV metadata...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Analysis Content */}
                <div className="space-y-6">
                    {/* CV Metadata Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Extracted CV Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isExtracting ? (
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

                    {/* AI Analysis Section */}
                    {extractedInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                    AI Career Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!analysis ? (
                                    <div className="space-y-4">
                                        <p className="text-muted-foreground">
                                            Get an AI-powered analysis of your CV with insights on strengths,
                                            career trajectory, and recommendations.
                                        </p>

                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate AI Analysis
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <Tabs defaultValue="analysis">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                                            <TabsTrigger value="raw">Raw Text</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="analysis">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {analysis}
                                                </ReactMarkdown>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="raw">
                                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    {analysis}
                                                </pre>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                )}

                                {analysis && (
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const blob = new Blob([analysis], { type: 'text/plain' })
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = `${filename}-analysis.txt`
                                                document.body.appendChild(a)
                                                a.click()
                                                document.body.removeChild(a)
                                                URL.revokeObjectURL(url)
                                            }}
                                        >
                                            Download Analysis
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(analysis)
                                                alert('Analysis copied to clipboard!')
                                            }}
                                        >
                                            Copy to Clipboard
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Next Steps */}
                {extractedInfo && !isExtracting && (
                    <Card className="mt-6 border-purple-500/20 bg-purple-50/10 dark:bg-purple-950/10">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                Next Steps
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={handleGoToJobMatch}
                                    className="h-auto py-4 text-left justify-start"
                                    variant="outline"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Job Match Analysis</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                See how your CV matches specific job descriptions
                                            </p>
                                        </div>
                                    </div>
                                </Button>

                                <Button
                                    onClick={handleGoToCareerGuidance}
                                    className="h-auto py-4 text-left justify-start"
                                    variant="outline"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <Sparkles className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Career Guidance</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Get personalized career advice and strategic guidance
                                            </p>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    <Button variant="outline" onClick={handleNewCV}>
                        Analyze Another CV
                    </Button>

                    {extractedInfo && (
                        <Button
                            onClick={handleGoToJobMatch}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Start Job Matching
                        </Button>
                    )}
                </div>

                {/* Missing Info Modal */}
                <MissingInfoModal
                    isOpen={isMissingInfoModalOpen}
                    questions={missingInfoQuestions}
                    onSubmit={handleMissingInfoSubmit}
                    onCancel={() => {
                        setIsMissingInfoModalOpen(false)
                        setMissingInfoQuestions([])
                    }}
                    isSubmitting={isProcessingSupplementalInfo}
                />
            </main>
        </div>
    )
}