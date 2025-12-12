'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, ShieldCheck, Loader2, CreditCard, CheckCircle } from "lucide-react"
import { useCreateCheckoutSession } from '@/hooks/useCheckout'

export default function CheckoutPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const { mutate: createSession } = useCreateCheckoutSession()

    const handleCheckout = async () => {
        setIsLoading(true)
        setError('')

        try {
            const result = await createSession({
                priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1234567890',
            })
            const { sessionUrl, error: apiError } = result || {}
            if (apiError) throw new Error(apiError)
            if (!sessionUrl) throw new Error('No checkout URL received')
            window.location.href = sessionUrl
        } catch (err) {
            console.error('Checkout error:', err)
            setError(err instanceof Error ? err.message : 'Checkout failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        asChild
                        className="gap-2 mb-4"
                    >
                        <Link href="/pricing">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Pricing
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Subscribe to Pro Plan</h1>
                    <p className="text-muted-foreground mt-2">
                        Unlock unlimited CV analyses and advanced career insights
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Plan Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pro Plan Features</CardTitle>
                                <CardDescription>Everything you need to accelerate your tech career</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {[
                                        'Unlimited CV analyses',
                                        'Advanced career insights',
                                        'Priority support',
                                        'Career trajectory analysis',
                                        'Skill gap identification',
                                        'Market value estimation',
                                    ].map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="p-1 rounded-full bg-green-500/10">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Secure Payment</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Your payment is processed securely by Stripe. We never store your card details.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {error && (
                            <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
                                <CardContent className="pt-6">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">Pro Plan</h3>
                                        <p className="text-sm text-muted-foreground">Monthly subscription</p>
                                    </div>
                                    <p className="font-semibold">$9.99</p>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>$9.99</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                </div>
                                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>$9.99/mo</span>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    size="lg"
                                    onClick={handleCheckout}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Redirecting to Stripe...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Continue to Payment
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Cancel anytime. No hidden fees.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
