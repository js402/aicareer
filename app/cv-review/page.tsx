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

export default function CVReviewPage() {
    const router = useRouter()
    const { content: cvContent, filename, clear: clearCV } = useCVStore()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Check if no CV content, redirect to home
        if (!cvContent) {
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
    }, [cvContent, router])

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
            const response = await fetch('/api/auth/check?redirect=analysis')
            const authStatus = await response.json()

            if (authStatus.authenticated) {
                // User is authenticated, proceed to analysis
                router.push('/analysis')
            } else {
                // User needs to sign in
                router.push(authStatus.redirectUrl)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            // Fallback to auth page
            router.push('/auth?redirect=analysis')
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
                                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
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
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b">
                            <Tabs defaultValue="preview" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="preview" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </TabsTrigger>
                                    <TabsTrigger value="raw" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Raw Text
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="preview" className="mt-4">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                                            {cvContent}
                                        </pre>
                                    </div>
                                </TabsContent>

                                <TabsContent value="raw" className="mt-4">
                                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                                        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700 dark:text-slate-300">
                                            {cvContent}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardHeader>
                    </Card>
                </div>

                {/* Preview Only Notice - Only show if not authenticated */}
                {!user && (
                    <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
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
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        Continue to Full Analysis
                    </Button>
                </div>
            </main>
        </div>
    )
}