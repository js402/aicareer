'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, RefreshCw, ExternalLink, Lock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PositionHeader } from "@/components/positions/PositionHeader"
import { NotesCard } from "@/components/positions/NotesCard"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { useSubscription } from "@/hooks/useSubscription"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"
import { EmailGenerator } from "@/components/positions/EmailGenerator"
import { useAsyncAction } from "@/hooks/useFetch"
import { useCVMetadataList } from "@/hooks/useCVMetadata"
import { usePosition } from "@/hooks/usePosition"
import {
    updateJobPosition,
    deleteJobPosition,
    evaluateJobMatch,
    tailorCV
} from "@/lib/api-client"

import { useCVStore } from "@/hooks/useCVStore"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { JobMatchAnalysis, JobMatchResult } from "@/components/analysis/JobMatchAnalysis"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"



// CV Metadata interface for the dropdown
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

export default function PositionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    const { isLoading: authLoading, isAuthenticated } = useAuthGuard({ redirectTo: `positions/${id}` })
    const router = useRouter()
    const { metadataId: storeCvMetadataId, extractedInfo } = useCVStore()
    const { hasProAccess } = useSubscription()

    const [notes, setNotes] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    // Delete Confirmation Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Re-analyze with different CV Dialog State
    const [isReanalyzeDialogOpen, setIsReanalyzeDialogOpen] = useState(false)
    const [selectedNewCvId, setSelectedNewCvId] = useState<string>('')
    const [isReanalyzing, setIsReanalyzing] = useState(false)

    // Fetch CV list for re-analyze dropdown and tailored CV generation
    const { data: cvResponse } = useCVMetadataList({ skip: authLoading })
    const cvList = cvResponse?.metadata || []
    // Filter to only show uploaded CVs (not tailored ones)
    const uploadedCvList = cvList.filter(cv => !(cv as any).source_type || (cv as any).source_type === 'uploaded')

    // Fetch position - skip while auth is loading (redirect will happen if not authenticated)
    const { data: position, isLoading: positionLoading, error: fetchError, refetch } = usePosition(
        id,
        {
            skip: authLoading,
            onSuccess: (data) => setNotes(data.notes || '')
        }
    )

    // Mutation hooks for status and notes updates
    const { mutate: updateStatus, isLoading: isUpdating } = useAsyncAction(
        async (payload: { status: string }) => updateJobPosition(id, payload)
    )

    const { mutate: updateNotes, isLoading: isUpdatingNotes } = useAsyncAction(
        async (payload: { notes: string }) => updateJobPosition(id, payload)
    )

    // Mutation for delete
    const { mutate: deletePositionAction, isLoading: isDeleting } = useAsyncAction(
        async () => deleteJobPosition(id)
    )

    // Mutation for generating tailored CV
    const { mutate: tailorCVAction, isLoading: isTailoring } = useAsyncAction(
        tailorCV
    )

    const handleStatusChange = useCallback(async (newStatus: string) => {
        if (!position) return

        try {
            await updateStatus({ status: newStatus })
            await refetch()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }, [position, updateStatus, refetch])

    const handleNotesSave = useCallback(async () => {
        if (!position) return

        try {
            await updateNotes({ notes })
            await refetch()
        } catch (error) {
            console.error('Error updating notes:', error)
        }
    }, [position, notes, updateNotes, refetch])


    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            await deletePositionAction(undefined)
            router.push('/positions')
        } catch (error) {
            console.error('Error deleting position:', error)
            alert('An error occurred while deleting the position.')
        } finally {
            setIsDeleteDialogOpen(false)
        }
    }

    const handleReanalyzeClick = () => {
        setSelectedNewCvId('')
        setIsReanalyzeDialogOpen(true)
    }

    const handleReanalyzeConfirm = async () => {
        if (!position || !selectedNewCvId) return

        try {
            setIsReanalyzing(true)

            // Call job match API with the new CV to get updated analysis
            const matchResult = await evaluateJobMatch({
                cvMetadataId: selectedNewCvId,
                jobDescription: position.job_description
            })

            // Update the position with new analysis results and new CV reference
            await updateJobPosition(id, {
                cv_metadata_id: selectedNewCvId,
                match_score: matchResult.matchScore,
                matching_skills: matchResult.matchingSkills,
                missing_skills: matchResult.missingSkills,
                recommendations: matchResult.recommendations,
                experience_alignment: matchResult.experienceAlignment,
                responsibility_alignment: matchResult.responsibilityAlignment
            })

            await refetch()
            setIsReanalyzeDialogOpen(false)
        } catch (error) {
            console.error('Error re-analyzing position:', error)
            alert('Failed to re-analyze position. Please try again.')
        } finally {
            setIsReanalyzing(false)
        }
    }


    const handleGenerateCV = async () => {
        // Use the CV that was used to create this position's match analysis
        const cvMetadataId = position?.cv_metadata_id || storeCvMetadataId
        if (!position || !cvMetadataId) return

        try {
            setIsGenerating(true)

            // Generate tailored CV - it will be saved automatically to cv_metadata
            await tailorCVAction({
                cvMetadataId,
                jobDescription: position.job_description,
                jobPositionId: position.id,
                companyName: position.company_name,
                positionTitle: position.position_title,
                matchAnalysis: {
                    matchScore: position.match_score,
                    matchingSkills: position.matching_skills,
                    missingSkills: position.missing_skills,
                    recommendations: position.recommendations
                }
            })

            // Show success message and offer to view in CVs page
            alert('Tailored CV generated successfully! You can view and download it from the "My CVs" page.')
        } catch (error) {
            console.error('Error generating tailored CV:', error)
            alert('Failed to generate tailored CV. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    // Combined loading state
    const isLoading = authLoading || positionLoading

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (fetchError) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load position</h2>
                        <p className="text-muted-foreground mb-4">{fetchError.message}</p>
                        <button
                            onClick={() => router.push('/positions')}
                            className="text-blue-600 hover:underline"
                        >
                            ← Back to positions
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    if (!position) return null

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <PositionHeader
                    position={position}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteClick}
                    isUpdating={isUpdating}
                />

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="analysis" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8">
                                <TabsTrigger value="analysis">Match Analysis</TabsTrigger>
                                <TabsTrigger value="description">Job Description</TabsTrigger>
                                <TabsTrigger value="email">Application Email</TabsTrigger>
                            </TabsList>

                            <TabsContent value="analysis" className="mt-0">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-purple-600" />
                                            Match Analysis
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReanalyzeClick}
                                            disabled={cvList.length === 0}
                                            className="gap-2"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Re-analyze with Different CV
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                                            <MatchScoreCircle score={position.match_score} />
                                            <div className="flex-1 space-y-4 w-full">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                            {position.matching_skills?.length || 0}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Matching Skills</div>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                            {position.missing_skills?.length || 0}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Missing Skills</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <JobMatchAnalysis result={{
                                                matchScore: position.match_score,
                                                matchingSkills: position.matching_skills || [],
                                                missingSkills: position.missing_skills || [],
                                                recommendations: position.recommendations || [],
                                                experienceAlignment: position.experience_alignment,
                                                responsibilityAlignment: position.responsibility_alignment,
                                                metadata: {
                                                    company_name: position.company_name,
                                                    position_title: position.position_title,
                                                    location: position.location || '',
                                                    salary_range: position.salary_range || '',
                                                    employment_type: position.employment_type || null,
                                                    seniority_level: position.seniority_level || null
                                                }
                                            }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="description" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Job Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose dark:prose-invert max-w-none text-sm">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {position.job_description}
                                            </ReactMarkdown>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="email" className="mt-0">
                                <EmailGenerator
                                    jobDescription={position.job_description}
                                    cvMetadataId={position.cv_metadata_id || storeCvMetadataId}
                                    companyName={position.company_name}
                                    positionTitle={position.position_title}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Generate Tailored CV Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tailored CV</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate a CV tailored specifically for this position based on your skills and the job requirements.
                                </p>
                                <Button
                                    className={`w-full ${!hasProAccess ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                    onClick={!hasProAccess ? () => router.push(`/pricing?redirect=/positions/${id}`) : handleGenerateCV}
                                    disabled={isGenerating || !(position.cv_metadata_id || storeCvMetadataId)}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : !hasProAccess ? (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Upgrade to Tailor CV
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Tailored CV
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push('/cv-metadata')}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View My CVs
                                </Button>
                            </CardContent>
                        </Card>

                        <NotesCard
                            notes={notes}
                            onNotesChange={setNotes}
                            onSave={handleNotesSave}
                            isUpdating={isUpdating}
                        />
                    </div>
                </div>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job Position</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this position? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={isReanalyzeDialogOpen} onOpenChange={setIsReanalyzeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Re-analyze with Different CV</DialogTitle>
                            <DialogDescription>
                                Select a different CV to re-run the match analysis for this position.
                                This will update the match score, skills, and recommendations.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                Select CV
                            </label>
                            <Select value={selectedNewCvId} onValueChange={setSelectedNewCvId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a CV" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cvList.map((cv) => (
                                        <SelectItem
                                            key={cv.id}
                                            value={cv.id}
                                        >
                                            {cv.display_name || cv.filename || 'CV'}
                                            {cv.confidence_score ? ` • ${Math.round(cv.confidence_score * 100)}%` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {position.cv_metadata_id && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Last analyzed with: {cvList.find(cv => cv.id === position.cv_metadata_id)?.display_name ||
                                        cvList.find(cv => cv.id === position.cv_metadata_id)?.filename || 'Unknown CV'}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsReanalyzeDialogOpen(false)}
                                disabled={isReanalyzing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReanalyzeConfirm}
                                disabled={!selectedNewCvId || isReanalyzing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isReanalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Re-analyzing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Re-analyze
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
