'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"

export default function CVReviewPage() {
    const router = useRouter()
    const [cvContent, setCvContent] = useState<string>('')
    const [filename, setFilename] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Retrieve CV content from sessionStorage
        const content = sessionStorage.getItem('cvContent')
        const name = sessionStorage.getItem('cvFilename')

        if (!content) {
            // No CV uploaded, redirect to home
            router.push('/')
            return
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCvContent(content)
        setFilename(name || 'CV')
        setIsLoading(false)
    }, [router])

    const handleBack = () => {
        // Clear session storage and go back
        sessionStorage.removeItem('cvContent')
        sessionStorage.removeItem('cvFilename')
        router.push('/')
    }

    const handleDownload = () => {
        const blob = new Blob([cvContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleContinue = async () => {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
            // User is logged in, go directly to analysis
            router.push('/analysis')
        } else {
            // User not logged in, go to auth page
            router.push('/auth')
        }
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

                {/* CV Preview Card */}
                <Card>
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{filename}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {cvContent.length} characters • {cvContent.split('\n').length} lines
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-mono text-sm bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[600px]">
                                {cvContent}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-end">
                    <Button variant="outline" onClick={handleBack}>
                        Upload Different CV
                    </Button>
                    <Button size="lg" onClick={handleContinue}>
                        Continue to Analysis
                    </Button>
                </div>
            </main>
        </div>
    )
}

