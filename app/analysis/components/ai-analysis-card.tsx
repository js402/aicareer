'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Target, TrendingUp, AlertTriangle, Map, Award, FileText } from "lucide-react"
import { analyzeCV } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseAnalysisSections } from "@/lib/analysis-utils"

interface AIAnalysisCardProps {
    cvContent: string
}

const getSectionIcon = (title: string) => {
    const t = title.toLowerCase()
    if (t.includes('executive') || t.includes('summary')) return Target
    if (t.includes('strength')) return Award
    if (t.includes('improvement') || t.includes('weakness')) return AlertTriangle
    if (t.includes('trajectory') || t.includes('path')) return TrendingUp
    if (t.includes('market') || t.includes('position')) return Map
    return FileText
}

export function AIAnalysisCard({ cvContent }: AIAnalysisCardProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<string>('')
    const [analysisError, setAnalysisError] = useState<string>('')

    const handleAnalyze = async () => {
        if (!cvContent) return

        setIsAnalyzing(true)
        setAnalysisError('')

        try {
            const result = await analyzeCV(cvContent)
            setAnalysis(result.analysis || '')
        } catch (err) {
            console.error('Analysis error:', err)
            setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze CV')
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
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
                            <div className="grid gap-6">
                                {parseAnalysisSections(analysis).map((section, index) => {
                                    const Icon = getSectionIcon(section.title)
                                    return (
                                        <Card key={index} className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400">
                                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-3">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    {section.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                <div className="prose dark:prose-invert max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {section.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                                {analysis && parseAnalysisSections(analysis).length === 0 && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {analysis}
                                                </ReactMarkdown>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
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

                {analysisError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                        {analysisError}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
