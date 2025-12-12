'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useCVStore } from "@/hooks/useCVStore"
import { useCVOperations } from "@/hooks/useCVOperations"
import { supabase } from "@/lib/supabase"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
    const router = useRouter()
    const { content: cvContent, setSyncedCV } = useCVStore()
    const { extractMetadata, isLoading, error } = useCVOperations()
    const [status, setStatus] = useState<'initializing' | 'processing' | 'success' | 'error'>('initializing')
    const processedRef = useRef(false)

    useEffect(() => {
        const checkAuthAndProcess = async () => {
            if (processedRef.current) return

            // 1. Check Auth
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth?redirect=onboarding')
                return
            }

            // 2. Check Content
            if (!cvContent) {
                // Nothing to ingest, maybe they came here by mistake or already synced
                // Redirect to dashboard or metadata list
                router.replace('/cv-metadata')
                return
            }

            // 3. Process
            processedRef.current = true
            setStatus('processing')

            try {
                const result = await extractMetadata(cvContent)

                if (result && result.metadataId) {
                    // 4. Sync & Purge
                    setSyncedCV(result.metadataId)
                    setStatus('success')

                    // Small delay for UX to show success state
                    setTimeout(() => {
                        router.replace('/analysis')
                    }, 1500)
                } else {
                    throw new Error('Failed to save CV to database')
                }
            } catch (err) {
                console.error('Onboarding error:', err)
                setStatus('error')
                processedRef.current = false // Allow retry
            }
        }

        checkAuthAndProcess()
    }, [cvContent, router, extractMetadata, setSyncedCV])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-12 pb-12 text-center space-y-6">
                    {status === 'initializing' || status === 'processing' ? (
                        <>
                            <div className="flex justify-center">
                                <LoadingSpinner size="lg" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold">Setting up your profile...</h2>
                                <p className="text-muted-foreground text-sm">
                                    Securely saving your CV to your account.
                                </p>
                            </div>
                        </>
                    ) : status === 'success' ? (
                        <>
                            <div className="flex justify-center">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold">All set!</h2>
                                <p className="text-muted-foreground text-sm">
                                    Redirecting you to your analysis...
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold">Something went wrong</h2>
                                <p className="text-muted-foreground text-sm">
                                    {error || 'Failed to process your CV.'}
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center pt-2">
                                <Button onClick={() => router.push('/cv-review')} variant="outline">
                                    Go Back
                                </Button>
                                <Button onClick={() => {
                                    processedRef.current = false
                                    setStatus('initializing')
                                }}>
                                    Try Again
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
