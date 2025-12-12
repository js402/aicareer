'use client'

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Lightbulb, AlertCircle } from "lucide-react"

interface SummarySectionProps {
    summary: string
    onChange: (summary: string) => void
    readOnly?: boolean
}

const SUMMARY_TIPS = [
    "Start with your current role or professional identity",
    "Highlight 2-3 key skills or areas of expertise",
    "Mention years of experience in your field",
    "Include a notable achievement if possible",
    "Keep it concise: 2-4 sentences max"
]

const SUMMARY_EXAMPLES = [
    "Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture. Led teams that delivered products serving 10M+ users.",
    "Product Manager with a passion for data-driven decision making. 5 years of experience launching B2B SaaS products from 0 to 1. Strong technical background with the ability to bridge business and engineering teams.",
    "DevOps Engineer specializing in cloud infrastructure and CI/CD automation. AWS Certified with expertise in Kubernetes and Terraform. Reduced deployment time by 80% and infrastructure costs by 40% at previous role."
]

export function SummarySection({
    summary,
    onChange,
    readOnly = false
}: SummarySectionProps) {
    const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
    const charCount = summary.length
    
    const getWordCountStatus = () => {
        if (wordCount === 0) return { status: 'empty', message: 'Add a professional summary' }
        if (wordCount < 20) return { status: 'short', message: 'Consider adding more detail' }
        if (wordCount > 100) return { status: 'long', message: 'Consider shortening for impact' }
        return { status: 'good', message: 'Good length!' }
    }

    const status = getWordCountStatus()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Professional Summary
                </h3>
                <p className="text-sm text-muted-foreground">
                    A brief overview of your professional background and key strengths
                </p>
            </div>

            {/* Main Editor */}
            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="summary">Summary</Label>
                            <div className="flex items-center gap-2">
                                <Badge 
                                    variant={
                                        status.status === 'good' ? 'default' :
                                        status.status === 'empty' ? 'secondary' :
                                        'outline'
                                    }
                                    className={
                                        status.status === 'short' ? 'text-amber-600 border-amber-300' :
                                        status.status === 'long' ? 'text-amber-600 border-amber-300' :
                                        ''
                                    }
                                >
                                    {wordCount} words
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {status.message}
                                </span>
                            </div>
                        </div>
                        <Textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Write a compelling professional summary that highlights your expertise, experience, and what makes you unique..."
                            className="min-h-[150px] resize-none"
                            disabled={readOnly}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {charCount} characters • Recommended: 50-100 words
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Writing Tips */}
            {!readOnly && (
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                                    Tips for a Great Summary
                                </p>
                                <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                                    {SUMMARY_TIPS.map((tip, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-amber-500">•</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Examples */}
            {!readOnly && (
                <Card>
                    <CardContent className="py-4">
                        <p className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Example Summaries
                        </p>
                        <div className="space-y-3">
                            {SUMMARY_EXAMPLES.map((example, index) => (
                                <div 
                                    key={index}
                                    className="p-3 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors"
                                    onClick={() => {
                                        if (!readOnly && !summary) {
                                            onChange(example)
                                        }
                                    }}
                                >
                                    <p className="text-muted-foreground italic">&quot;{example}&quot;</p>
                                    {!summary && (
                                        <p className="text-xs text-primary mt-2">Click to use as template</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning for empty summary */}
            {!readOnly && summary.length === 0 && (
                <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="py-3">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-4 w-4" />
                            <p className="text-sm">
                                A professional summary is highly recommended. It&apos;s often the first thing recruiters read.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
