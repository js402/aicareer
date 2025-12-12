"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Check } from "lucide-react"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { useFetch } from "@/hooks/useFetch"

interface SubscriptionStatus {
    isPro: boolean
}

export default function PricingPage() {
    const { data: subscription } = useFetch<SubscriptionStatus>(
        '/api/subscription/status',
        { skip: false }
    )
    
    const isPro = subscription?.isPro ?? false

    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for trying out CV analysis",
            features: [
                "Unlimited CV analyses",
                "AI-powered career insights",
                "Smart caching for instant results",
                "Secure encrypted storage",
                "Markdown-formatted analysis"
            ],
            cta: "Get Started",
            href: "/",
            popular: false,
            planType: "free"
        },
        {
            name: "Pro",
            price: "$9.99",
            period: "per month",
            description: "For professionals seeking in-depth career guidance",
            features: [
                "Everything in Free",
                "In-Depth Career Guidance",
                "Strategic career path planning",
                "Market value analysis with salary estimates",
                "Skill gap identification with learning resources",
                "Priority AI processing",
                "Downloadable reports"
            ],
            cta: "Upgrade to Pro",
            href: "/checkout",
            popular: true,
            planType: "pro"
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "contact us",
            description: "Coming soon - for teams and organizations",
            features: [
                "Everything in Pro",
                "Team collaboration (coming soon)",
                "Custom integrations (coming soon)",
                "Dedicated support",
                "Bulk processing (coming soon)",
                "API access (coming soon)"
            ],
            cta: "Contact Sales",
            href: "/about",
            popular: false,
            planType: "enterprise"
        }
    ]

    const getButtonProps = (planType: string) => {
        if (isPro && planType === 'pro') {
            return {
                cta: "Current Plan",
                disabled: true,
                variant: "secondary"
            }
        }

        const plan = plans.find(p => p.planType === planType)
        return {
            cta: plan?.cta || "Get Started",
            disabled: false,
            variant: plan?.popular ? "default" : "outline"
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1">
                <PageHeader
                    title="Simple, Transparent Pricing"
                    description="Choose the plan that's right for you. All plans include our core features."
                >
                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, index) => {
                            const buttonProps = getButtonProps(plan.planType)
                            const isCurrentPlan = isPro && plan.planType === 'pro'

                            return (
                                <Card
                                    key={index}
                                    className={`relative border-2 transition-all duration-300 hover:shadow-xl ${isCurrentPlan
                                        ? 'border-green-500 shadow-lg scale-105'
                                        : plan.popular
                                            ? 'border-blue-500 shadow-lg scale-105'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                                        }`}
                                >
                                    {isCurrentPlan && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                                Your Plan
                                            </span>
                                        </div>
                                    )}
                                    {!isCurrentPlan && plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-8">
                                        <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                                        <div className="mb-2">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground ml-2">/{plan.period}</span>
                                        </div>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-start gap-2">
                                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full"
                                            variant={buttonProps.variant as "default" | "outline" | "secondary"}
                                            size="lg"
                                            disabled={buttonProps.disabled}
                                            asChild={!buttonProps.disabled}
                                        >
                                            {buttonProps.disabled ? (
                                                <span>{buttonProps.cta}</span>
                                            ) : (
                                                <Link href={plan.href}>{buttonProps.cta}</Link>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </PageHeader>

                {/* FAQ Section */}
                <section className="border-t bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <div className="container mx-auto px-4 py-16">
                        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Can I switch plans at any time?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How does billing work?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Pro subscriptions are billed monthly via Stripe. You can cancel anytime and retain access until the end of your billing period.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
