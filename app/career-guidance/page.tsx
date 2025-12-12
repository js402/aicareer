'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Target, TrendingUp, Map, Download, Loader2, Sparkles, Briefcase, Edit } from "lucide-react"
import { useSubscription } from '@/hooks/useSubscription'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCVStore } from "@/hooks/useCVStore"
import { useMutation } from "@/hooks/useFetch"
import { PageLoader } from "@/components/ui/loading-spinner"
import { StatusAlert } from "@/components/ui/status-alert"
import { useLoadingState } from "@/hooks/useLoadingState"
import { StrategicPathTab } from "@/components/career-guidance/strategic-path-tab"
import { MarketValueTab } from "@/components/career-guidance/market-value-tab"
import { SkillGapTab } from "@/components/career-guidance/skill-gap-tab"
import { CareerRolesTab, type CareerPathSuggestions } from "@/components/career-guidance/career-roles-tab"
import { CVEditorModal } from "@/components/cv-editor"
import type { ExtractedCVInfo } from "@/lib/api-client"
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

export default function CareerGuidancePage() {
    const router = useRouter()
    const { hasProAccess } = useSubscription()
    const { content: cvContent, guidance, setGuidance, extractedInfo, updateExtractedInfo, metadataId } = useCVStore()
    const loadingState = useLoadingState()

    const [suggestions, setSuggestions] = useState<CareerPathSuggestions | null>(null)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    const { mutate: postGuidance } = useMutation<{ cvContent: string }, { guidance: any }>(
        '/api/career-guidance',
        'POST',
        {
            onSuccess: (data) => setGuidance(data.guidance),
            onError: (err) => loadingState.setError(err.message)
        }
    )

    const generateGuidance = useCallback(async (content: string) => {
        await loadingState.execute(
            async () => {
                await postGuidance({ cvContent: content })
            },
            {
                errorMessage: 'Failed to generate career guidance'
            }
        )
    }, [postGuidance, loadingState])

    const { mutate: postSuggestions } = useMutation<{ cvContent: string }, { suggestions: any }>(
        '/api/career-path-suggestions',
        'POST',
        {
            onSuccess: (data) => setSuggestions(data.suggestions),
            onError: (err) => console.error('Error generating suggestions:', err)
        }
    )

    const generateSuggestions = useCallback(async (content: string) => {
        setIsLoadingSuggestions(true)
        try {
            await postSuggestions({ cvContent: content })
        } finally {
            setIsLoadingSuggestions(false)
        }
    }, [postSuggestions])

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

    const handleSaveCVEdits = async (updatedInfo: ExtractedCVInfo) => {
        // Update local state
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
        return <PageLoader message="Checking subscription..." />
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
                        <div className="flex gap-2">
                            {extractedInfo && (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditorOpen(true)}
                                    className="gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit CV
                                </Button>
                            )}
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
                </div>

                {/* Error State */}
                {loadingState.error && (
                    <StatusAlert
                        variant="error"
                        title="Error"
                        message={loadingState.error}
                        className="mb-6"
                    />
                )}

                {loadingState.isLoading ? (
                    <PageLoader message="Generating your career guidance..." />
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
                            <StrategicPathTab strategicPath={guidance.strategicPath as StrategicPath} />
                        </TabsContent>

                        <TabsContent value="market" className="mt-6">
                            <MarketValueTab marketValue={guidance.marketValue as MarketValue} />
                        </TabsContent>

                        <TabsContent value="skills" className="mt-6">
                            <SkillGapTab skillGap={guidance.skillGap as SkillGap} />
                        </TabsContent>

                        <TabsContent value="roles" className="mt-6">
                            <CareerRolesTab suggestions={suggestions} isLoading={isLoadingSuggestions} />
                        </TabsContent>
                    </Tabs>
                ) : null}

                {/* CV Editor Modal */}
                {extractedInfo && (
                    <CVEditorModal
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        initialData={extractedInfo}
                        onSave={handleSaveCVEdits}
                        title="Edit CV Profile"
                        description="Update your CV to get more accurate career guidance"
                    />
                )}
            </main>
        </div>
    )
}
