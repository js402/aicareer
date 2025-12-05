'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, Download, FileText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { analyzeCV } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCVStore } from "@/hooks/useCVStore"
import { downloadTextFile } from "@/lib/download-helpers"
import { MissingInfoModal } from "@/components/analysis/MissingInfoModal"

export default function AnalysisPage() {
    const router = useRouter()
    const { content: cvContent, filename, analysis, setAnalysis, clear: clearCV } = useCVStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState<string>('')
    const [fromCache, setFromCache] = useState<boolean>(false)
    const [cachedAt, setCachedAt] = useState<string | undefined>()

    const [missingInfoQuestions, setMissingInfoQuestions] = useState<string[]>([])
    const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false)
    const [isResubmitting, setIsResubmitting] = useState(false)

    const startAnalysis = useCallback(async (content: string) => {
        setIsAnalyzing(true)
        setError('')

        try {
            const result = await analyzeCV(content)

            if (result.status === 'incomplete' && result.questions) {
                setMissingInfoQuestions(result.questions)
                setIsMissingInfoModalOpen(true)
                setIsAnalyzing(false) // Stop loading indicator while user answers
                return
            }

            if (result.status === 'invalid') {
                setError(result.message || 'Invalid CV format')
                return
            }

            setAnalysis(result.analysis)
            setFromCache(result.fromCache)
            setCachedAt(result.cachedAt)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze CV')
        } finally {
            if (!isMissingInfoModalOpen) {
                setIsAnalyzing(false)
            }
        }
    }, [setAnalysis, isMissingInfoModalOpen])

    const handleMissingInfoSubmit = async (answers: string[]) => {
        setIsResubmitting(true)
        setIsMissingInfoModalOpen(false)
        setIsAnalyzing(true)

        // Combine original content with answers
        const additionalContext = `\n\nADDITIONAL USER CONTEXT:\n${answers.map((a, i) => `Q: ${missingInfoQuestions[i]}\nA: ${a}`).join('\n')}`
        const augmentedContent = cvContent + additionalContext

        try {
            // We pass the augmented content as a "custom prompt" or just append it to the CV content
            // Since the API takes cvContent, we'll just send the augmented content as the CV
            // But we should probably update the store too? Or just use it for this request?
            // Let's just send it for this request.
            const result = await analyzeCV(augmentedContent)

            // If it's still incomplete, we might want to loop, but for now let's assume it's good or just show what we got
            if (result.status === 'invalid') {
                setError(result.message || 'Invalid CV format')
            } else {
                setAnalysis(result.analysis)
                setFromCache(result.fromCache)
                setCachedAt(result.cachedAt)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze CV')
        } finally {
            setIsResubmitting(false)
            setIsAnalyzing(false)
        }
    }

    const checkAuthAndLoadCV = useCallback(async () => {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            // Not authenticated, redirect to auth with redirect to analysis
            router.push('/auth?redirect=analysis')
            return
        }

        if (!cvContent) {
            // No CV uploaded, redirect to home
            router.push('/')
            return
        }

        // If we already have analysis, we don't necessarily need to re-run it, 
        // but the user might expect it. The original code ran it every time.
        // We'll keep the behavior but fix the race condition.
        if (!analysis) {
            try {
                await startAnalysis(cvContent)
            } finally {
                setIsLoading(false)
            }
        } else {
            setIsLoading(false)
        }

    }, [router, cvContent, analysis, startAnalysis])

    useEffect(() => {
        checkAuthAndLoadCV()
    }, [checkAuthAndLoadCV])

    const handleDownload = () => {
        downloadTextFile(analysis, `${filename}-analysis.txt`)
    }

    const handleNewCV = () => {
        clearCV()
        router.push('/')
    }

    if (isLoading) {
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

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">CV Analysis</h1>
                    <p className="text-muted-foreground">
                        AI-powered career guidance for {filename}
                    </p>
                </div>

                {/* Analysis Status */}
                {isAnalyzing && (
                    <Card className="mb-6 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="font-semibold">Analyzing your CV...</p>
                                    <p className="text-sm text-muted-foreground">
                                        Checking cache and generating insights
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Cache Status Indicator */}
                {fromCache && analysis && (
                    <Card className="mb-6 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-300">Cached Result</p>
                                    <p className="text-sm text-muted-foreground">
                                        This CV was previously analyzed{cachedAt && ` on ${new Date(cachedAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {error && (
                    <Card className="mb-6 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-red-600 dark:text-red-400">Analysis Failed</p>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => startAnalysis(cvContent)}
                                className="mt-4"
                                variant="outline"
                            >
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <>
                        <Card>
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                                            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <CardTitle className="text-xl">Career Analysis</CardTitle>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownload}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                    >
                                        {analysis}
                                    </ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Match Analysis Navigation */}
                        <Card className="mt-8 border-none shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative group cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => router.push('/analysis/job-match')}>
                            <div className="absolute top-0 right-0 p-4">
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm">
                                    <Sparkles className="h-3 w-3" />
                                    PREMIUM
                                </div>
                            </div>

                            <CardContent className="p-8 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Job Match Analysis</h3>
                                        <p className="text-muted-foreground">
                                            See how well your CV matches a specific job description.
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:translate-x-2 transition-transform duration-300">
                                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    <Button onClick={() => router.push('/career-guidance')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get Career Guidance
                    </Button>
                    <Button variant="outline" onClick={handleNewCV}>
                        Analyze Another CV
                    </Button>
                </div>

                {/* Missing Info Modal */}
                <MissingInfoModal
                    isOpen={isMissingInfoModalOpen}
                    questions={missingInfoQuestions}
                    onSubmit={handleMissingInfoSubmit}
                    onCancel={() => {
                        setIsMissingInfoModalOpen(false)
                        handleNewCV()
                    }}
                    isSubmitting={isResubmitting}
                />
            </main>
        </div>
    )
}

