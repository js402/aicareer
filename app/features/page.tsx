import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Sparkles, Shield, Zap, Database, Clock, TrendingUp } from "lucide-react"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"

export default function FeaturesPage() {
    const features = [
        {
            icon: Sparkles,
            title: "AI-Powered Analysis",
            description: "Get intelligent career guidance powered by advanced AI that analyzes your CV structure, experience, and skills."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your CV data is encrypted and protected with enterprise-grade security. We never share your information."
        },
        {
            icon: Database,
            title: "Instant Re-runs",
            description: "Re-run analyses instantly on your saved CV — no waiting."
        },
        {
            icon: Clock,
            title: "Save Time",
            description: "No more hours of self-doubt. Get professional career insights in seconds, not days."
        },
        {
            icon: TrendingUp,
            title: "Career Optimization",
            description: "Receive actionable recommendations to boost your career trajectory and market value."
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Upload your CV and get comprehensive analysis in seconds."
        }
    ]

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1">
                <PageHeader
                    title="Powerful Features for Your Career"
                    description="Everything you need to unlock your full career potential with AI-driven insights"
                >
                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Card key={index} className="border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg">
                                    <CardHeader>
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 w-fit mb-4">
                                            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </PageHeader>

                {/* CTA Section */}
                <section className="border-t bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <div className="container mx-auto px-4 py-16 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Transform Your Career?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Start analyzing your CV and get personalized career insights today
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Button size="lg" asChild>
                                <Link href="/">Get Started Free</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/pricing">View Pricing</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
