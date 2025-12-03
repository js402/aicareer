import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Check } from "lucide-react"

export default function PricingPage() {
    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for getting started with CV analysis",
            features: [
                "1 CV analysis per month",
                "Basic career insights",
                "Email support",
                "Smart caching",
                "Secure data storage"
            ],
            cta: "Get Started",
            href: "/",
            popular: false
        },
        {
            name: "Pro",
            price: "$9.99",
            period: "per month",
            description: "For professionals serious about their career",
            features: [
                "Unlimited CV analyses",
                "Advanced career insights",
                "Priority support",
                "Smart caching",
                "Secure data storage",
                "Career trajectory analysis",
                "Skill gap identification",
                "Market value estimation"
            ],
            cta: "Start Free Trial",
            href: "/checkout",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "contact us",
            description: "For teams and organizations",
            features: [
                "Everything in Pro",
                "Team collaboration",
                "Custom integrations",
                "Dedicated support",
                "SLA guarantee",
                "Custom AI models",
                "Bulk processing",
                "API access"
            ],
            cta: "Contact Sales",
            href: "/about",
            popular: false
        }
    ]

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="container mx-auto px-4 py-16 md:py-24">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Choose the plan that&apos;s right for you. All plans include our core features.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, index) => (
                            <Card
                                key={index}
                                className={`relative border-2 transition-all duration-300 hover:shadow-xl ${plan.popular
                                    ? 'border-blue-500 shadow-lg scale-105'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                                    }`}
                            >
                                {plan.popular && (
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
                                        variant={plan.popular ? "default" : "outline"}
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={plan.href}>{plan.cta}</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

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
                                    <CardTitle className="text-lg">Is there a free trial?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes! The Pro plan includes a 14-day free trial. No credit card required.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t py-6">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; 2024 TechCareer.AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
