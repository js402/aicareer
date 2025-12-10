'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Target, TrendingUp, Map, Download, Loader2, Sparkles, Briefcase, Award, Building, Users } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCVStore } from "@/hooks/useCVStore"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Define specific types matching the API response
interface StrategicPath {
    currentPosition: string
    shortTerm: string[]
    midTerm: string[]
    longTerm: string[]
}

interface MarketValue {
    salaryRange: {
        min: number
        max: number
        currency: string
    }
    marketDemand: string
    competitiveAdvantages: string[]
    negotiationTips: string[]
}

interface SkillGapItem {
    skill: string
    priority: "high" | "medium" | "low"
    timeframe: string
    resources: string[]
}

interface SkillGap {
    critical: SkillGapItem[]
    recommended: SkillGapItem[]
}

export interface CareerGuidance {
    strategicPath: StrategicPath
    marketValue: MarketValue
    skillGap: SkillGap
}

export interface PathSuggestion {
    role: string
    vertical: string
    companySize: string
    teamSize: string
    description: string
}

export interface CareerPathSuggestions {
    comfort: PathSuggestion
    growth: PathSuggestion
    challenging: PathSuggestion
}

export default function CareerGuidancePage() {
    const router = useRouter()
    const { hasProAccess } = useSubscription()
    const { content: cvContent, guidance, setGuidance } = useCVStore()
    const [isLoading, setIsLoading] = useState(false)

    const [suggestions, setSuggestions] = useState<CareerPathSuggestions | null>(null)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
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

    const generateSuggestions = useCallback(async (content: string) => {
        setIsLoadingSuggestions(true)
        try {
            const response = await fetch('/api/career-path-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvContent: content }),
            })

            if (!response.ok) throw new Error('Failed to generate suggestions')

            const data = await response.json()
            setSuggestions(data.suggestions)
        } catch (err) {
            console.error('Error generating suggestions:', err)
            // Don't convert to main error, just log or show local error if needed
        } finally {
            setIsLoadingSuggestions(false)
        }
    }, [])

    useEffect(() => {
        if (!hasProAccess) return

        if (!cvContent) {
            router.push('/cv-review') // Or /analysis or /
            return
        }

        // Auto-generate guidance if user has pro access and we don't have it yet
        if (hasProAccess && !guidance) {
            generateGuidance(cvContent)
        }
        if (hasProAccess && !suggestions) {
            generateSuggestions(cvContent)
        }
    }, [hasProAccess, guidance, suggestions, router, cvContent, generateGuidance, generateSuggestions])

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

    // Helper to render currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
    }

    if (!hasProAccess) {
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
                        <TabsList className="grid w-full grid-cols-4">
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
                            <TabsTrigger value="roles" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                Perfect Roles
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
                        <TabsList className="grid w-full grid-cols-4">
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
                            <TabsTrigger value="roles" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                Perfect Roles
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
                                <CardContent className="space-y-6">
                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                                        <h3 className="font-semibold text-lg mb-2">Current Position Assessment</h3>
                                        <p className="text-muted-foreground">{(guidance.strategicPath as StrategicPath).currentPosition}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-purple-700 dark:text-purple-300">Short Term (1-2 Years)</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                                {(guidance.strategicPath as StrategicPath).shortTerm.map((goal, i) => (
                                                    <li key={i}>{goal}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-purple-700 dark:text-purple-300">Mid Term (3-5 Years)</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                                {(guidance.strategicPath as StrategicPath).midTerm.map((goal, i) => (
                                                    <li key={i}>{goal}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-purple-700 dark:text-purple-300">Long Term (5+ Years)</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                                {(guidance.strategicPath as StrategicPath).longTerm.map((goal, i) => (
                                                    <li key={i}>{goal}</li>
                                                ))}
                                            </ul>
                                        </div>
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
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 bg-white dark:bg-slate-950 p-6 rounded-lg border shadow-sm text-center">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Estimated Salary Range</p>
                                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency((guidance.marketValue as MarketValue).salaryRange.min, (guidance.marketValue as MarketValue).salaryRange.currency)} - {formatCurrency((guidance.marketValue as MarketValue).salaryRange.max, (guidance.marketValue as MarketValue).salaryRange.currency)}
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-slate-950 p-6 rounded-lg border shadow-sm">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Market Demand</p>
                                            <p className="font-medium">{(guidance.marketValue as MarketValue).marketDemand}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <Award className="h-4 w-4 text-blue-600" />
                                                Competitive Advantages
                                            </h4>
                                            <ul className="space-y-2">
                                                {(guidance.marketValue as MarketValue).competitiveAdvantages.map((adv, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-blue-500 mt-1">•</span>
                                                        {adv}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-blue-600" />
                                                Negotiation Tips
                                            </h4>
                                            <ul className="space-y-2">
                                                {(guidance.marketValue as MarketValue).negotiationTips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-blue-500 mt-1">•</span>
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
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
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            Critical Skills to Acquire
                                        </h3>
                                        <div className="grid gap-4">
                                            {(guidance.skillGap as SkillGap).critical.map((item, i) => (
                                                <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold">{item.skill}</h4>
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider">{item.timeframe}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium text-foreground">Resources:</span> {item.resources.join(", ")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            Recommended for Growth
                                        </h3>
                                        <div className="grid gap-4">
                                            {(guidance.skillGap as SkillGap).recommended.map((item, i) => (
                                                <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold">{item.skill}</h4>
                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase tracking-wider">{item.timeframe}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium text-foreground">Resources:</span> {item.resources.join(", ")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="roles" className="mt-6">
                            {isLoadingSuggestions ? (
                                <Card>
                                    <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-600" />
                                        <p>Analyzing optimal career paths...</p>
                                    </CardContent>
                                </Card>
                            ) : suggestions ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Comfort Zone */}
                                    <Card className="border-l-4 border-l-blue-400 dark:border-l-blue-500">
                                        <CardHeader className="pb-3">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Comfort Zone</div>
                                            <CardTitle className="text-lg">{suggestions.comfort.role}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <div className="prose prose-xs dark:prose-invert">
                                                <p>{suggestions.comfort.description}</p>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Vertical:</span> {suggestions.comfort.vertical}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Company:</span> {suggestions.comfort.companySize}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Team:</span> {suggestions.comfort.teamSize}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Growth */}
                                    <Card className="border-l-4 border-l-green-500 dark:border-l-green-500 shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Growth & Promotion</div>
                                            <CardTitle className="text-lg">{suggestions.growth.role}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <div className="prose prose-xs dark:prose-invert">
                                                <p>{suggestions.growth.description}</p>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Vertical:</span> {suggestions.growth.vertical}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Company:</span> {suggestions.growth.companySize}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Team:</span> {suggestions.growth.teamSize}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Challenging */}
                                    <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-500">
                                        <CardHeader className="pb-3">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Challenging / Pivot</div>
                                            <CardTitle className="text-lg">{suggestions.challenging.role}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <div className="prose prose-xs dark:prose-invert">
                                                <p>{suggestions.challenging.description}</p>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Vertical:</span> {suggestions.challenging.vertical}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Company:</span> {suggestions.challenging.companySize}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Team:</span> {suggestions.challenging.teamSize}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        Unable to load career suggestions.
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : null}
            </main>
        </div>
    )
}
