'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, Download, FileText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { analyzeCV } from "@/lib/api-client"

export default function AnalysisPage() {
    const router = useRouter()
    const [cvContent, setCvContent] = useState<string>('')
    const [filename, setFilename] = useState<string>('')
    const [analysis, setAnalysis] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState<string>('')
    const [fromCache, setFromCache] = useState<boolean>(false)
    const [cachedAt, setCachedAt] = useState<string | undefined>()

    useEffect(() => {
        checkAuthAndLoadCV()
    }, [])

    const checkAuthAndLoadCV = async () => {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            // Not authenticated, redirect to auth
            router.push('/auth')
            return
        }

        // Retrieve CV content from sessionStorage
        const content = sessionStorage.getItem('cvContent')
        const name = sessionStorage.getItem('cvFilename')

        if (!content) {
            // No CV uploaded, redirect to home
            router.push('/')
            return
        }

        setCvContent(content)
        setFilename(name || 'CV')
        setIsLoading(false)

        // Automatically start analysis
        startAnalysis(content)
    }

    const startAnalysis = async (content: string) => {
        setIsAnalyzing(true)
        setError('')

        try {
            // Get current user session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) {
                throw new Error('User not authenticated')
            }

            const result = await analyzeCV(content, session.user.id)
            setAnalysis(result.analysis)
            setFromCache(result.fromCache)
            setCachedAt(result.cachedAt)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze CV')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleDownload = () => {
        const blob = new Blob([analysis], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}-analysis.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleNewCV = () => {
        sessionStorage.removeItem('cvContent')
        sessionStorage.removeItem('cvFilename')
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
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {analysis}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    <Button variant="outline" onClick={handleNewCV}>
                        Analyze Another CV
                    </Button>
                </div>
            </main>
        </div>
    )
}
