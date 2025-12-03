'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Sparkles, Map, Target, TrendingUp, Loader2, Lock, Download } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'

interface CareerGuidance {
    strategicPath: string
    marketValue: string
    skillGap: string
}

export default function CareerGuidancePage() {
    const router = useRouter()
    const { hasProAccess, isLoading: subLoading } = useSubscription()
    const [cvContent, setCvContent] = useState<string>('')
    const [guidance, setGuidance] = useState<CareerGuidance | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        // Load CV content from sessionStorage
        const content = sessionStorage.getItem('cvContent')
        if (!content) {
            router.push('/cv-review')
            return
        }
        setCvContent(content)

        // Auto-generate guidance if user has pro access
        if (hasProAccess && !guidance) {
            generateGuidance(content)
        }
    }, [hasProAccess, guidance, router])

    const generateGuidance = async (content: string) => {
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
    }

    const downloadGuidance = () => {
        if (!guidance) return

        const content = `
CAREER GUIDANCE REPORT
======================

STRATEGIC CAREER PATH
---------------------
${guidance.strategicPath}

MARKET VALUE ANALYSIS
---------------------
${guidance.marketValue}

SKILL GAP ROADMAP
-----------------
${guidance.skillGap}
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

    // Show upgrade prompt for non-pro users
    if (!hasProAccess) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="mb-4 gap-2 pl-0 hover:pl-2 transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Analysis
                        </Button>
                    </div>

                    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                        <CardContent className="pt-12 pb-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                                <Lock className="h-8 w-8 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Pro Feature</h2>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                Advanced career guidance with strategic planning, market value analysis, and skill gap roadmaps is available for Pro subscribers.
                            </p>
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                asChild
                            >
                                <Link href="/pricing">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Upgrade to Pro
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
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
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="md:col-span-2 border-purple-500/20">
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
                    </div>
                ) : guidance ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="md:col-span-2 border-purple-500/20 bg-purple-50/10 dark:bg-purple-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-purple-600" />
                                    Strategic Career Path
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{guidance.strategicPath}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Market Value Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{guidance.marketValue}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-500/20 bg-green-50/10 dark:bg-green-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Map className="h-5 w-5 text-green-600" />
                                    Skill Gap Roadmap
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{guidance.skillGap}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </main>
        </div>
    )
}
