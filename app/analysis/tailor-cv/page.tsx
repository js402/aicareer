'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, ArrowLeft, Copy, Download, Check, Edit } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useCVStore } from "@/hooks/useCVStore"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { PremiumBadge } from "@/components/analysis/premium-badge"
import { ErrorAlert } from "@/components/analysis/error-alert"
import { CVEditorModal } from "@/components/cv-editor"
import type { ExtractedCVInfo } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function TailorCVPage() {
    const router = useRouter()
    const { content: cvContent, jobDescription, extractedInfo, updateExtractedInfo, metadataId } = useCVStore()

    const [tailoredCV, setTailoredCV] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    useAuthGuard({
        redirectTo: 'analysis/tailor-cv',
        requireCV: true,
        cvContent: cvContent && jobDescription ? cvContent : undefined
    })

    const generateTailoredCV = async () => {
        setIsGenerating(true)
        setError('')

        try {
            const response = await fetch('/api/tailor-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription
                    // cvContent is now fetched from blueprint by the API
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to tailor CV')
            }

            const data = await response.json()
            setTailoredCV(data.tailoredCV)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(tailoredCV)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([tailoredCV], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tailored-cv.md'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

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

    if (!cvContent || !jobDescription) return null

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Match Analysis
                </Button>

                <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                        <PremiumBadge />
                    </div>

                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            Tailor Your CV
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Generate a version of your CV specifically optimized for this job description.
                        </p>
                    </CardHeader>

                    <CardContent className="p-6">
                        {!tailoredCV && !isGenerating && (
                            <div className="text-center py-12">
                                <div className="mb-6 inline-flex p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Ready to Optimize</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                    We&apos;ll rewrite your CV to highlight the skills and experience most relevant to the job description you provided.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {extractedInfo && (
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setIsEditorOpen(true)}
                                            className="gap-2"
                                        >
                                            <Edit className="h-5 w-5" />
                                            Edit CV First
                                        </Button>
                                    )}
                                    <Button
                                        onClick={generateTailoredCV}
                                        size="lg"
                                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
                                    >
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Tailored CV
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="text-center py-12">
                                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Tailoring your CV...</h3>
                                <p className="text-muted-foreground">
                                    This usually takes about 30 seconds. We&apos;re optimizing your content for the best match.
                                </p>
                            </div>
                        )}

                        {error && <ErrorAlert error={error} />}

                        {tailoredCV && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">Your Tailored CV</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleCopy}>
                                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleDownload}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert mx-auto break-words p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            pre: ({ ...props }) => <pre className="whitespace-pre-wrap break-words p-4 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-x-hidden" {...props} />,
                                            code: ({ ...props }) => <code className="whitespace-pre-wrap break-words" {...props} />
                                        }}
                                    >
                                        {tailoredCV}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CV Editor Modal */}
                {extractedInfo && (
                    <CVEditorModal
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        initialData={extractedInfo}
                        onSave={handleSaveCVEdits}
                        title="Edit CV Before Tailoring"
                        description="Fine-tune your CV data to get a better tailored result"
                    />
                )}
            </main>
        </div>
    )
}
