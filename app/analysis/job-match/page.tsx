'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, FileText, ArrowLeft, Building2, MapPin, DollarSign, CheckCircle2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useCVStore } from "@/hooks/useCVStore"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { PremiumBadge } from "@/components/analysis/premium-badge"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"
import { SkillListCard } from "@/components/analysis/skill-list-card"
import { ErrorAlert } from "@/components/analysis/error-alert"
import { Input } from "@/components/ui/input"

export default function JobMatchPage() {
    const router = useRouter()
    const { content: cvContent, jobDescription, setJobDescription } = useCVStore()

    const [matchResult, setMatchResult] = useState<{
        matchScore: number
        matchingSkills: string[]
        missingSkills: string[]
        recommendations: string[]
        metadata: {
            company_name: string
            position_title: string
            location: string
            salary_range: string
        }
        fromCache?: boolean
        cachedAt?: string
    } | null>(null)
    const [isMatching, setIsMatching] = useState(false)
    const [matchError, setMatchError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Local state for editing metadata before saving
    const [editedMetadata, setEditedMetadata] = useState({
        company_name: '',
        position_title: '',
        location: '',
        salary_range: ''
    })

    useAuthGuard({ redirectTo: 'analysis/job-match', requireCV: true, cvContent })

    const handleJobMatch = async () => {
        if (!jobDescription.trim()) return

        setIsMatching(true)
        setMatchError('')
        setMatchResult(null)

        try {
            const response = await fetch('/api/evaluate-job-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvContent,
                    jobDescription
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to evaluate job match')
            }

            const data = await response.json()
            setMatchResult(data)
            setEditedMetadata(data.metadata)
        } catch (err) {
            setMatchError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsMatching(false)
        }
    }

    const handleTrackApplication = async () => {
        if (!matchResult) return
        setIsSaving(true)

        try {
            const response = await fetch('/api/job-positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: editedMetadata.company_name,
                    position_title: editedMetadata.position_title,
                    location: editedMetadata.location,
                    salary_range: editedMetadata.salary_range,
                    job_description: jobDescription,
                    match_score: matchResult.matchScore,
                    matching_skills: matchResult.matchingSkills,
                    missing_skills: matchResult.missingSkills,
                    recommendations: matchResult.recommendations
                })
            })

            if (response.ok) {
                const newPosition = await response.json()
                router.push(`/positions/${newPosition.id}`)
            }
        } catch (error) {
            console.error('Error saving position:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!cvContent) return null

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Analysis
                </Button>

                <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                        <PremiumBadge />
                    </div>

                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <FileText className="h-6 w-6" />
                            </div>
                            Job Match Analysis
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Paste a job description to see how well your CV matches the requirements.
                        </p>
                    </CardHeader>

                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {!matchResult && (
                                <>
                                    <div className="relative">
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                            Job Description
                                        </label>
                                        <textarea
                                            className="w-full min-h-[200px] p-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                            placeholder="Paste the full job description here..."
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                        <p className="text-xs text-muted-foreground text-center sm:text-left">
                                            We&apos;ll analyze skills, experience, and keywords to give you a match score.
                                        </p>
                                        <Button
                                            onClick={handleJobMatch}
                                            disabled={isMatching || !jobDescription.trim()}
                                            className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                                            size="lg"
                                        >
                                            {isMatching ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    Evaluate Match
                                                    <Sparkles className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {matchError && <ErrorAlert error={matchError} />}

                            {matchResult && (
                                <div className="mt-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    {/* Score Section */}
                                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 relative">
                                        {matchResult.fromCache && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-900/50">
                                                <Sparkles className="h-3 w-3" />
                                                Cached Result
                                            </div>
                                        )}
                                        <MatchScoreCircle score={matchResult.matchScore} />

                                        <div className="w-full max-w-lg mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-blue-500" />
                                                Application Details
                                            </h3>
                                            <div className="grid gap-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Company</label>
                                                        <Input
                                                            value={editedMetadata.company_name}
                                                            onChange={(e) => setEditedMetadata({ ...editedMetadata, company_name: e.target.value })}
                                                            className="bg-white dark:bg-slate-900"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Position</label>
                                                        <Input
                                                            value={editedMetadata.position_title}
                                                            onChange={(e) => setEditedMetadata({ ...editedMetadata, position_title: e.target.value })}
                                                            className="bg-white dark:bg-slate-900"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Location</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={editedMetadata.location}
                                                                onChange={(e) => setEditedMetadata({ ...editedMetadata, location: e.target.value })}
                                                                className="pl-9 bg-white dark:bg-slate-900"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Salary</label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={editedMetadata.salary_range}
                                                                onChange={(e) => setEditedMetadata({ ...editedMetadata, salary_range: e.target.value })}
                                                                className="pl-9 bg-white dark:bg-slate-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-lg">
                                            <Button
                                                onClick={handleTrackApplication}
                                                disabled={isSaving}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                                                size="lg"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Track Application
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setMatchResult(null)}
                                                className="flex-1"
                                            >
                                                Analyze Another
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <SkillListCard
                                            title="Matching Skills"
                                            skills={matchResult.matchingSkills}
                                            variant="matching"
                                        />

                                        <SkillListCard
                                            title="Missing / Weak Areas"
                                            skills={matchResult.missingSkills}
                                            variant="missing"
                                        />
                                    </div>

                                    <SkillListCard
                                        title="Recommendations"
                                        skills={matchResult.recommendations}
                                        variant="recommendations"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
