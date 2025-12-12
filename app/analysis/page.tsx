'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useCVStore } from "@/hooks/useCVStore"
import { useSubscription } from "@/hooks/useSubscription"
import { ArrowLeft, Sparkles, FileText, Download, CheckCircle, Edit, AlertCircle } from "lucide-react"
import { downloadTextFile } from "@/lib/download-helpers"
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusAlert } from "@/components/ui/status-alert"
import { useCVOperations } from "@/hooks/useCVOperations"
import { CVMetadataDisplay } from "@/components/analysis/cv-metadata-display"
import { AnalysisResults } from "@/components/analysis/analysis-results"
import { CVEditorModal, validateCV } from "@/components/cv-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AnalysisPage() {
    const router = useRouter()
    const { content: cvContent, filename, extractedInfo, setExtractedInfo, updateExtractedInfo, metadataId, analysis, setAnalysis, appendSupplementalInfo, clear: clearCV } = useCVStore()
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
        }

        checkAuthAndLoad()
    }, [cvContent, hasProAccess, subLoading, router, extractedInfo])

    // Extract metadata when CV content is available but no extracted info exists
    useEffect(() => {
        if (isMounted && cvContent && !extractedInfo && hasProAccess) {
            const extractMetadata = async () => {
                await cvOperations.extractMetadata(cvContent)
            }
            extractMetadata()
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

    const handleSaveCVEdits = async (updatedInfo: typeof extractedInfo) => {
        if (!updatedInfo) return
        
        // Update local state immediately
        updateExtractedInfo(updatedInfo)
        
        // If we have a metadataId, save to the database
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
        return <PageLoader message="Loading analysis..." />
    }

    if (!hasProAccess) {
        return <PageLoader message="Redirecting to pricing..." />
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
                {cvOperations.error && (
                    <StatusAlert
                        variant="error"
                        title="Error"
                        message={cvOperations.error}
                        className="mb-6"
                    />
                )}

                {/* Incomplete CV Alert */}
                {cvValidation && !cvValidation.isComplete && !cvOperations.isLoading && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CV Information Incomplete</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>
                                {cvValidation.criticalMissing.length} required field{cvValidation.criticalMissing.length !== 1 ? 's' : ''} missing. 
                                Complete your profile for accurate analysis.
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setIsEditorOpen(true)}
                                className="ml-4 shrink-0"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Complete Now
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {cvOperations.isLoading && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3 py-8">
                                <LoadingSpinner />
                                <p className="text-muted-foreground">Extracting CV metadata...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Analysis Content */}
                <div className="space-y-6">
                    {/* CV Metadata Card with Edit Button */}
                    <div className="relative">
                        {extractedInfo && !cvOperations.isLoading && (
                            <div className="absolute top-4 right-4 z-10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditorOpen(true)}
                                    className="gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit CV Data
                                </Button>
                            </div>
                        )}
                        <CVMetadataDisplay 
                            extractedInfo={extractedInfo} 
                            isLoading={cvOperations.isLoading}
                        />
                    </div>

                    {/* AI Analysis Section */}
                    {extractedInfo && !cvOperations.isLoading && (
                        <AnalysisResults
                            analysis={analysis}
                            isAnalyzing={isAnalyzing}
                            filename={filename}
                            onAnalyze={handleAnalyze}
                        />
                    )}
                </div>

                {/* Next Steps */}
                {extractedInfo && !cvOperations.isLoading && (
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