'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, Download, Eye, Info, Lock, Sparkles } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useCVStore } from "@/hooks/useCVStore"
import { downloadTextFile } from "@/lib/download-helpers"
import { BasicMetadataDisplay } from "@/components/cv-metadata/basic-metadata-display"
import { supabase } from "@/lib/supabase"
import type { User } from '@supabase/supabase-js'

import { useCVDetail } from "@/hooks/useCVDetail"
import { useAuthCheck } from "@/hooks/useAuthActions"

export default function CVReviewPage() {
    const router = useRouter()
    const { content: cvContent, filename, metadataId, clear: clearCV, setCV } = useCVStore()
    const [user, setUser] = useState<User | null>(null)
    const { mutate: checkAuth } = useAuthCheck()

    // Hydrate from DB if missing content but we have an ID (persisted)
    const { isLoading: isHydrating } = useCVDetail(
        !cvContent && metadataId ? metadataId : null,
        {
            onSuccess: (data) => {
                if (data.metadata.cv_content) {
                    // Update store with fetched content 
                    // (Note: partialize config prevents this from sticking in localStorage)
                    setCV(data.metadata.cv_content, data.metadata.display_name)
                }
            }
        }
    )

    useEffect(() => {
        // Wait for hydration attempt
        if (!cvContent && !metadataId) {
            router.push('/')
            return
        }

        // Check current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [cvContent, metadataId, router])

    const handleBack = () => {
        clearCV()
        router.push('/')
    }

    const handleDownload = () => {
        downloadTextFile(cvContent, filename)
    }

    const handleContinueToAnalysis = async () => {
        try {
            // Check authentication status
            const authStatus = await checkAuth({ redirect: 'analysis' })

            if (authStatus.authenticated) {
                // User is authenticated
                if (cvContent && !metadataId) {
                    // If we have content but no DB ID, we need to sync
                    router.push('/onboarding')
                } else {
                    // Already synced or no content (shouldn't happen here), proceed
                    router.push('/analysis')
                }
            } else {
                // User needs to sign in
                router.push(authStatus.redirectUrl.replace('analysis', 'onboarding'))
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            // Fallback to auth page
            router.push('/auth?redirect=onboarding')
        }
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
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{filename}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {cvContent.length} characters • {cvContent.split('\n').length} lines
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BasicMetadataDisplay cvContent={cvContent} />

                            {/* Authentication Reminder - Only show if not authenticated */}
                            {!user && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-sm text-yellow-500 dark:text-yellow-400">
                                        <Lock className="h-4 w-4" />
                                        <span className="font-medium">Sign in for full analysis</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Full metadata extraction and AI analysis require authentication
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CV Content Tabs */}
                    <Card className="lg:col-span-2 flex flex-col overflow-hidden border-border shadow-sm">
                        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                            <div className="border-b border-border px-6 py-4 bg-muted/30">
                                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                                    <TabsTrigger value="preview" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </TabsTrigger>
                                    <TabsTrigger value="raw" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Raw Text
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <CardContent className="flex-1 p-0 min-h-[600px] relative bg-card">
                                <TabsContent value="preview" className="absolute inset-0 m-0 h-full w-full">
                                    <div className="h-full w-full overflow-auto p-8">
                                        <div className="prose dark:prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                                                {cvContent}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="raw" className="absolute inset-0 m-0 h-full w-full">
                                    <div className="h-full w-full overflow-auto p-8 bg-muted/20">
                                        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                                            {cvContent}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>

                {/* Preview Only Notice - Only show if not authenticated */}
                {!user && (
                    <Card className="mt-6 border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Info className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Preview Mode - This is a free preview of your CV
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sign in to unlock full analysis, career guidance, and job matching features
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    <Button variant="outline" onClick={handleBack}>
                        Upload Different CV
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleContinueToAnalysis}
                        className="gap-2"
                    >
                        <Sparkles className="h-4 w-4" />
                        Continue to Full Analysis
                    </Button>
                </div>
            </main>
        </div>
    )
}