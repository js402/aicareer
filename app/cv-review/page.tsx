'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, Download, Eye, Info } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useCVStore } from "@/hooks/useCVStore"
import { useSubscription } from "@/hooks/useSubscription"
import { downloadTextFile } from "@/lib/download-helpers"
import { extractCVMetadata, processCVIntoBlueprint } from "@/lib/api-client"
import { hashCV } from "@/lib/cv-cache"
import { CVMetadataDisplay } from "@/components/cv-metadata-display"
import type { ExtractedCVInfo } from "@/lib/api-client"

export default function CVReviewPage() {
    const router = useRouter()
    const { content: cvContent, filename, extractedInfo, setExtractedInfo, clear: clearCV } = useCVStore()
    const { hasProAccess } = useSubscription()
    const [isMounted, setIsMounted] = useState(false)
    const [isExtractingMetadata, setIsExtractingMetadata] = useState(false)
    const [metadataError, setMetadataError] = useState<string>('')
    const [extractionAttempted, setExtractionAttempted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (isMounted && !cvContent) {
            router.push('/')
        }
    }, [isMounted, cvContent, router])

    // Reset extraction attempt when CV content changes
    useEffect(() => {
        if (cvContent) {
            setExtractionAttempted(false)
        }
    }, [cvContent])

    // Extract metadata when CV content is available
    useEffect(() => {
        const extractMetadata = async () => {
            if (!cvContent || extractedInfo || isExtractingMetadata || extractionAttempted) return

            setIsExtractingMetadata(true)
            setExtractionAttempted(true)
            setMetadataError('')

            // Generate hash for this CV
            const cvHash = await hashCV(cvContent)

            try {
                const result = await extractCVMetadata(cvContent)
                if (result.status === 'valid' && result.extractedInfo) {
                    setExtractedInfo(result.extractedInfo)

                    // Process CV into blueprint for learning
                    try {
                        await processCVIntoBlueprint(result.extractedInfo, cvHash)
                        console.log('CV successfully processed into blueprint')
                    } catch (blueprintError) {
                        console.warn('Failed to process CV into blueprint:', blueprintError)
                        // Don't fail the whole process if blueprint processing fails
                    }
                } else if (result.status === 'incomplete') {
                    // Still save partial info for incomplete CVs
                    if (result.extractedInfo) {
                        setExtractedInfo(result.extractedInfo)

                        // Still try to process into blueprint even if incomplete
                        try {
                            await processCVIntoBlueprint(result.extractedInfo, cvHash)
                        } catch (blueprintError) {
                            console.warn('Failed to process incomplete CV into blueprint:', blueprintError)
                        }
                    }
                    setMetadataError('CV appears to be incomplete. Some information may be missing, but you can still proceed with analysis.')
                } else if (result.status === 'invalid') {
                    // For invalid CVs, show error but allow user to proceed (full analysis will validate again)
                    setMetadataError(result.message || 'This doesn\'t appear to be a valid CV, but you can still try analysis.')
                    // Still set empty extracted info to prevent re-attempts
                    setExtractedInfo({
                        name: '',
                        contactInfo: '',
                        experience: [],
                        skills: [],
                        education: []
                    })
                }
            } catch (error) {
                console.error('Error extracting metadata:', error)
                setMetadataError('Failed to extract CV information. You can still proceed with analysis.')
                // Set empty extracted info to prevent infinite retries
                setExtractedInfo({
                    name: '',
                    contactInfo: '',
                    experience: [],
                    skills: [],
                    education: []
                })
            } finally {
                setIsExtractingMetadata(false)
            }
        }

        if (isMounted && cvContent && !extractedInfo && !extractionAttempted) {
            extractMetadata()
        }
    }, [cvContent, extractedInfo, isMounted, setExtractedInfo, extractionAttempted])

    const handleBack = () => {
        // Clear store and go back
        clearCV()
        setExtractionAttempted(false) // Reset extraction attempt flag
        router.push('/')
    }

    const handleDownload = () => {
        downloadTextFile(cvContent, filename)
    }

    const handleContinue = async () => {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
            // User is logged in, go directly to analysis
            router.push('/analysis')
        } else {
            // User not logged in, go to auth page with redirect parameter
            router.push('/auth?redirect=analysis')
        }
    }

    if (!isMounted) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
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
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Upload
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                </div>

                {/* CV Information Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* File Info Card */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{filename}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {cvContent.length} characters • {cvContent.split('\n').length} lines
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CVMetadataDisplay
                                extractedInfo={extractedInfo}
                                isLoading={isExtractingMetadata}
                                error={metadataError}
                            />
                        </CardContent>
                    </Card>

                    {/* CV Content Tabs */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b">
                            <Tabs defaultValue="preview" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="preview" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </TabsTrigger>
                                    <TabsTrigger value="raw" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Raw Text
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="preview" className="mt-4">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <pre className="whitespace-pre-wrap font-mono text-sm bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                                            {cvContent}
                                        </pre>
                                    </div>
                                </TabsContent>

                                <TabsContent value="raw" className="mt-4">
                                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {cvContent}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardHeader>
                    </Card>
                </div>

                {/* Metadata Status */}
                {extractedInfo && !metadataError && (
                    <Card className="mt-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <Info className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Successfully extracted CV information. Ready for analysis!
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    {hasProAccess && (
                        <Button variant="outline" onClick={handleBack}>
                            Upload Different CV
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={isExtractingMetadata}
                    >
                        {isExtractingMetadata ? 'Extracting...' : 'Continue to Analysis'}
                    </Button>
                </div>
            </main>
        </div>
    )
}
