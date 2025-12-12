import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Mail, Github, Linkedin, Heart } from "lucide-react"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1">
                <PageHeader
                    title="About TechCareer.AI"
                    description="Empowering professionals to reach their full career potential through AI-driven CV analysis"
                />

                {/* Mission Section */}
                <section className="container mx-auto px-4 py-8 max-w-4xl">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="text-2xl">Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                We believe that every professional deserves access to quality
                                career guidance. That&apos;s why we&apos;ve built an AI-powered platform that analyzes your CV and
                                provides personalized, actionable insights to help you advance your career.
                            </p>
                            <p>
                                Whether you&apos;re just starting out, looking to switch roles, or aiming for that next promotion,
                                our intelligent analysis helps you understand your strengths, identify skill gaps, and
                                position yourself for success in the competitive tech industry.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Why We Built This Section */}
                <section className="container mx-auto px-4 py-8 max-w-4xl">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="text-2xl">Why We Built This</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                The idea for TechCareer.AI came from personal experience. We&apos;ve all been there -
                                staring at our CV, wondering if it&apos;s good enough, if we&apos;re highlighting the right skills,
                                if we&apos;re positioning ourselves correctly for the roles we want.
                            </p>
                            <p>
                                Traditional career coaching is expensive and time-consuming. We wanted to democratize
                                access to professional career guidance by leveraging AI to provide instant, personalized
                                insights that would normally cost hundreds of dollars and take days to receive.
                            </p>
                            <p>
                                Our platform combines cutting-edge AI with thoughtful product design
                                to give you the guidance you need, when you need it.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Values Section */}
                <section className="container mx-auto px-4 py-8 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Privacy First</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    Your CV data is yours. We use enterprise-grade encryption and never share
                                    your information with third parties.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Accessibility</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    Professional career guidance shouldn&apos;t be a luxury. We offer a free tier
                                    and affordable pricing for everyone.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Continuous Improvement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    We&apos;re constantly improving our AI models and adding new features based on
                                    user feedback and industry trends.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Transparency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    We&apos;re open about how our AI works and what data we collect. No hidden
                                    algorithms or mysterious black boxes.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="border-t bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <div className="container mx-auto px-4 py-16">
                        <div className="text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                            <p className="text-muted-foreground mb-8">
                                Have questions, feedback, or just want to say hi? We&apos;d love to hear from you!
                            </p>

                            <div className="flex gap-4 justify-center flex-wrap mb-8">
                                <Button variant="outline" size="lg" asChild>
                                    <a href="mailto:hello@techcareer.ai" className="gap-2">
                                        <Mail className="h-5 w-5" />
                                        Email Us
                                    </a>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="gap-2">
                                        <Github className="h-5 w-5" />
                                        GitHub
                                    </a>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="gap-2">
                                        <Linkedin className="h-5 w-5" />
                                        LinkedIn
                                    </a>
                                </Button>
                            </div>

                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for professionals seeking career growth
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
