'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useTimeout, useAutoRedirect } from '@/hooks/useTimeout'

function SuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const isDone = useTimeout(1500)
    const [autoRedirect, setAutoRedirect] = useState(true)
    useAutoRedirect(4000, () => {
        if (autoRedirect) router.push('/analysis')
    })

    if (!isDone) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
                    <p className="text-muted-foreground">Verifying your payment...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-center text-2xl text-green-900 dark:text-green-100">
                    Payment Successful!
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-green-800 dark:text-green-200">
                    Thank you for subscribing to the Pro plan. You now have access to all premium features.
                </p>
                {sessionId && (
                    <p className="text-xs text-muted-foreground">
                        Session ID: {sessionId}
                    </p>
                )}
                <div className="flex gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                    >
                        Go Home
                    </Button>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        onClick={() => router.push('/analysis')}
                    >
                        Start Analyzing
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setAutoRedirect((v) => !v)}
                    >
                        {autoRedirect ? 'Pause Auto-Redirect' : 'Resume Auto-Redirect'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={
                    <Card className="w-full max-w-md">
                        <CardContent className="pt-6 text-center space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" />
                            <p className="text-muted-foreground">Loading...</p>
                        </CardContent>
                    </Card>
                }>
                    <SuccessContent />
                </Suspense>
            </main>
        </div>
    )
}
