'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, FileText, ArrowLeft, Building2, MapPin, DollarSign, CheckCircle2, Edit } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useCVStore } from "@/hooks/useCVStore"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { PremiumBadge } from "@/components/analysis/premium-badge"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"
import { JobMatchAnalysis } from "@/components/analysis/JobMatchAnalysis"
import { ErrorAlert } from "@/components/analysis/error-alert"
import { Input } from "@/components/ui/input"
import { useFetch } from "@/hooks/useFetch"
import { CVEditorModal } from "@/components/cv-editor"
import type { ExtractedCVInfo } from "@/lib/api-client"
import { useEvaluateJobMatch, type JobMatchResult } from "@/hooks/useJobMatch"
import { usePositionActions } from "@/hooks/usePositionActions"
import { useUpdateCVMetadataAction } from "@/hooks/useCVMetadata"
import { useCVDetail } from "@/hooks/useCVDetail"
import { PageLoader } from '@/components/ui/loading-spinner'


interface CVMetadata {
    id: string
    display_name?: string
    filename?: string
    confidence_score?: number
    created_at: string
}

interface CVMetadataResponse {
    metadata: CVMetadata[]
}

export default function JobMatchPage() {
    const router = useRouter()
    const { content: cvContent, jobDescription, setJobDescription } = useCVStore()

    // State for match result
    const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null)
    const [matchError, setMatchError] = useState('')
    const [trackError, setTrackError] = useState('')
    const [selectedCvId, setSelectedCvId] = useState<string>('')
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [selectedCvInfo, setSelectedCvInfo] = useState<ExtractedCVInfo | null>(null)

    // Local state for editing metadata before saving
    const [editedMetadata, setEditedMetadata] = useState({
        company_name: '',
        position_title: '',
        location: '',
        salary_range: '',
        employment_type: '',
        seniority_level: ''
    })

    // Hooks
    const { data: cvResponse } = useFetch<CVMetadataResponse>('/api/cv-metadata')
    const cvList = cvResponse?.metadata || []

    const { mutate: evaluateMatch, isLoading: isMatching } = useEvaluateJobMatch({
        onSuccess: (data) => {
            setMatchResult(data)
            setEditedMetadata({
                company_name: data.metadata.company_name || '',
                position_title: data.metadata.position_title || '',
                location: data.metadata.location || '',
                salary_range: data.metadata.salary_range || '',
                employment_type: data.metadata.employment_type || '',
                seniority_level: data.metadata.seniority_level || ''
            })
        },
        onError: (err) => setMatchError(err.message)
    })

    const { createPosition, isLoading: isSaving } = usePositionActions()
    const { mutate: updateMetadata } = useUpdateCVMetadataAction()

    // Fetch selected CV info using useCVDetail instead of manual fetch
    useCVDetail(selectedCvId || null, {
        onSuccess: (data) => {
            if (data.metadata?.extracted_info) {
                setSelectedCvInfo(data.metadata.extracted_info)
            }
        }
    })

    // Compute suggested CV
    const suggestedCvId = useMemo(() => {
        const best = [...cvList].sort((a, b) =>
            (b.confidence_score ?? 0) - (a.confidence_score ?? 0) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        return best?.id || ''
    }, [cvList])

    // Auto-select suggested CV
    useEffect(() => {
        if (suggestedCvId && !selectedCvId) {
            setSelectedCvId(suggestedCvId)
        }
    }, [suggestedCvId, selectedCvId])

    useAuthGuard({ redirectTo: 'analysis/job-match' })

    const handleSaveCVEdits = async (updatedInfo: ExtractedCVInfo) => {
        if (!selectedCvId) return

        try {
            await updateMetadata({ id: selectedCvId, extractedInfo: updatedInfo })
            setSelectedCvInfo(updatedInfo)
        } catch (error) {
            console.error('Error saving CV edits:', error)
        }
    }

    const handleJobMatch = async () => {
        if (!jobDescription.trim()) return
        setMatchResult(null)
        setMatchError('')
        evaluateMatch({
            jobDescription,
            cvMetadataId: selectedCvId || suggestedCvId
        })
    }

    const handleTrackApplication = async () => {
        if (!matchResult) return

        const cvMetadataId = selectedCvId || suggestedCvId
        if (!cvMetadataId) {
            setTrackError('No CV selected. Please select a CV to track this application.')
            return
        }

        setTrackError('')

        try {
            const newPosition = await createPosition({
                company_name: editedMetadata.company_name,
                position_title: editedMetadata.position_title,
                location: editedMetadata.location,
                salary_range: editedMetadata.salary_range,
                job_description: jobDescription,
                match_score: matchResult.matchScore,
                matching_skills: matchResult.matchingSkills,
                missing_skills: matchResult.missingSkills,
                recommendations: matchResult.recommendations,
                experience_alignment: matchResult.experienceAlignment,
                responsibility_alignment: matchResult.responsibilityAlignment,
                employment_type: editedMetadata.employment_type || null,
                seniority_level: editedMetadata.seniority_level || null,
                cv_metadata_id: cvMetadataId
            })

            if (newPosition) {
                router.push(`/positions/${newPosition.id}`)
            }
        } catch (error) {
            setTrackError(error instanceof Error ? error.message : 'Failed to save position')
        }
    }

    // Show empty state if user has no CVs uploaded
    if (cvList.length === 0) {
        // If we have local content but no DB entries, we need to sync
        if (cvContent) {
            router.push('/onboarding')
            return <PageLoader message="Syncing your CV..." />
        }

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
                        Back
                    </Button>
                    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">No CV Found</CardTitle>
                            <p className="text-muted-foreground mt-2">
                                You need to upload a CV before you can analyze job matches.
                            </p>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <Button
                                onClick={() => router.push('/')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Upload CV
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

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
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Base CV</label>
                                            <Select value={selectedCvId} onValueChange={setSelectedCvId}>
                                                <SelectTrigger className="bg-white dark:bg-slate-950">
                                                    <SelectValue placeholder={suggestedCvId ? 'Suggested CV selected' : 'Select a CV'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cvList.map((cv) => (
                                                        <SelectItem key={cv.id} value={cv.id}>
                                                            {(cv.display_name || cv.filename || 'CV')} • {(cv.confidence_score ? `${Math.round(cv.confidence_score * 100)}%` : 'Unrated')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="flex gap-2 mt-2">
                                                {suggestedCvId && selectedCvId !== suggestedCvId && (
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedCvId(suggestedCvId)}>
                                                        Use Suggested CV
                                                    </Button>
                                                )}
                                                {selectedCvId && selectedCvInfo && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsEditorOpen(true)}
                                                        className="gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Edit CV
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Job Description</label>
                                            <textarea
                                                className="w-full min-h-[200px] p-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                                placeholder="Paste the full job description here..."
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                            />
                                        </div>
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
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Employment Type</label>
                                                        <Select
                                                            value={editedMetadata.employment_type}
                                                            onValueChange={(value) => setEditedMetadata({ ...editedMetadata, employment_type: value })}
                                                        >
                                                            <SelectTrigger className="bg-white dark:bg-slate-900">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="full-time">Full-time</SelectItem>
                                                                <SelectItem value="part-time">Part-time</SelectItem>
                                                                <SelectItem value="contract">Contract</SelectItem>
                                                                <SelectItem value="freelance">Freelance</SelectItem>
                                                                <SelectItem value="internship">Internship</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Seniority Level</label>
                                                        <Select
                                                            value={editedMetadata.seniority_level}
                                                            onValueChange={(value) => setEditedMetadata({ ...editedMetadata, seniority_level: value })}
                                                        >
                                                            <SelectTrigger className="bg-white dark:bg-slate-900">
                                                                <SelectValue placeholder="Select level" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="entry">Entry</SelectItem>
                                                                <SelectItem value="junior">Junior</SelectItem>
                                                                <SelectItem value="mid">Mid</SelectItem>
                                                                <SelectItem value="senior">Senior</SelectItem>
                                                                <SelectItem value="lead">Lead</SelectItem>
                                                                <SelectItem value="principal">Principal</SelectItem>
                                                                <SelectItem value="executive">Executive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {trackError && (
                                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                                                <p className="text-sm text-red-600 dark:text-red-400">{trackError}</p>
                                            </div>
                                        )}

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

                                    <JobMatchAnalysis result={matchResult} />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* CV Editor Modal */}
                {selectedCvInfo && (
                    <CVEditorModal
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        initialData={selectedCvInfo}
                        onSave={handleSaveCVEdits}
                        title="Edit CV Before Matching"
                        description="Update your CV information to improve job match accuracy"
                    />
                )}
            </main>
        </div>
    )
}