'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { XCircle } from "lucide-react"

export default function CheckoutCancelPage() {
    const router = useRouter()

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                        </div>
                        <CardTitle className="text-center text-2xl text-orange-900 dark:text-orange-100">
                            Checkout Cancelled
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-orange-800 dark:text-orange-200">
                            Your payment was cancelled. No charges were made to your account.
                        </p>
                        <div className="flex gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                            >
                                Go Home
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                asChild
                            >
                                <Link href="/pricing">View Pricing</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
