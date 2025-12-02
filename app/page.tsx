import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Zap, Target } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { CVUpload } from "@/components/cv-upload"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center mx-auto px-4">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Accelerate Your Tech Career
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mx-auto">
              AI-powered guidance tailored to your experience. Upload your CV to get started.
            </p>
          </div>
        </section>

        {/* Main Upload Section - Hero Action */}
        <section className="container pb-8 md:pb-12 lg:pb-24 mx-auto px-4 max-w-3xl">
          <CVUpload />
        </section>

        {/* Features Section */}
        <section className="container pb-8 md:pb-12 lg:pb-24 mx-auto px-4 max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized insights from advanced AI trained on thousands of successful tech careers
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Tailored Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Receive customized recommendations based on your unique skills and experience
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-green-500/10 dark:bg-green-500/20">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-lg">Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  Get actionable career advice in seconds, not days or weeks
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
