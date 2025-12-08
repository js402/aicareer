'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Sparkles, Map, Target, TrendingUp, Loader2, Download } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCVStore } from "@/hooks/useCVStore"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Define more specific types for the guidance content
type GuidanceContent = string

// Exporting to satisfy linter if needed, or just remove if not used elsewhere
export interface CareerGuidance {
    strategicPath: GuidanceContent
    marketValue: GuidanceContent
    skillGap: GuidanceContent
}

export default function CareerGuidancePage() {
    const router = useRouter()
    const { hasProAccess, isLoading: subLoading } = useSubscription()
    const { content: cvContent, guidance, setGuidance } = useCVStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>('')

    const generateGuidance = useCallback(async (content: string) => {
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/career-guidance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cvContent: content }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to generate guidance')
            }

            const data = await response.json()
            setGuidance(data.guidance)
        } catch (err) {
            console.error('Error generating guidance:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate career guidance')
        } finally {
            setIsLoading(false)
        }
    }, [setGuidance])

    useEffect(() => {
        if (subLoading) return
        if (!hasProAccess) return

        if (!cvContent) {
            router.push('/cv-review') // Or /analysis or /
            return
        }

        // Auto-generate guidance if user has pro access and we don't have it yet
        if (hasProAccess && !guidance) {
            generateGuidance(cvContent)
        }
    }, [hasProAccess, guidance, router, subLoading, cvContent, generateGuidance])

    const downloadGuidance = () => {
        if (!guidance) return

        // Simple stringification for download, could be improved
        const content = `
CAREER GUIDANCE REPORT
======================

STRATEGIC CAREER PATH
---------------------
${JSON.stringify(guidance.strategicPath, null, 2)}

MARKET VALUE ANALYSIS
---------------------
${JSON.stringify(guidance.marketValue, null, 2)}

SKILL GAP ROADMAP
-----------------
${JSON.stringify(guidance.skillGap, null, 2)}
        `.trim()

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'career-guidance.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Show loading state while checking subscription
    if (subLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </main>
            </div>
        )
    }

    // Redirect non-pro users to pricing page
    if (!hasProAccess) {
        router.push('/pricing')
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 gap-2 pl-0 hover:pl-2 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Analysis
                    </Button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="h-8 w-8 text-purple-600" />
                                In-Depth Career Guidance
                            </h1>
                            <p className="text-muted-foreground">
                                Advanced career planning and strategic advice based on your profile
                            </p>
                        </div>
                        {guidance && (
                            <Button
                                variant="outline"
                                onClick={downloadGuidance}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        )}
                    </div>
                </div>

                {error && (
                    <Card className="mb-6 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <Tabs defaultValue="strategic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="strategic" className="gap-2">
                                <Target className="h-4 w-4" />
                                Strategic Path
                            </TabsTrigger>
                            <TabsTrigger value="market" className="gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Market Value
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="gap-2">
                                <Map className="h-4 w-4" />
                                Skill Gap
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="strategic" className="mt-6">
                            <Card className="border-purple-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-purple-600" />
                                        Strategic Career Path
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-40 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Generating insights...
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="market" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                        Market Value Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="skills" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Map className="h-5 w-5 text-green-600" />
                                        Skill Gap Roadmap
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : guidance ? (
                    <Tabs defaultValue="strategic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="strategic" className="gap-2">
                                <Target className="h-4 w-4" />
                                Strategic Path
                            </TabsTrigger>
                            <TabsTrigger value="market" className="gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Market Value
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="gap-2">
                                <Map className="h-4 w-4" />
                                Skill Gap
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="strategic" className="mt-6">
                            <Card className="border-purple-500/20 bg-purple-50/10 dark:bg-purple-950/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-purple-600" />
                                        Strategic Career Path
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {String(guidance.strategicPath || '')}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="market" className="mt-6">
                            <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                        Market Value Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {String(guidance.marketValue || '')}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="skills" className="mt-6">
                            <Card className="border-green-500/20 bg-green-50/10 dark:bg-green-950/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Map className="h-5 w-5 text-green-600" />
                                        Skill Gap Roadmap
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {String(guidance.skillGap || '')}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : null}
            </main>
        </div>
    )
}
