'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PositionHeader } from "@/components/positions/PositionHeader"
import { TailoredCVList } from "@/components/positions/TailoredCVList"
import { CVViewModal } from "@/components/positions/CVViewModal"
import { NotesCard } from "@/components/positions/NotesCard"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"

import { useCVStore } from "@/hooks/useCVStore"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { downloadMarkdown } from "@/lib/download-helpers"
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

interface TailoredCV {
    id: string
    version: number
    is_active: boolean
    created_at: string
    tailored_content?: string // Fetched on demand or if included
}

interface Position {
    id: string
    company_name: string
    position_title: string
    job_description: string
    job_url?: string
    location?: string
    salary_range?: string
    match_score: number
    matching_skills: string[]
    missing_skills: string[]
    recommendations: string[]
    experience_alignment?: JobMatchResult['experienceAlignment']
    responsibility_alignment?: JobMatchResult['responsibilityAlignment']
    employment_type?: string
    seniority_level?: string
    status: string
    applied_date?: string
    notes?: string
    created_at: string
    tailored_cvs: TailoredCV[]
}

export default function PositionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params)
    useAuthGuard({ redirectTo: `positions/${id}` })
    const router = useRouter()
    const { content: cvContent } = useCVStore()

    const [position, setPosition] = useState<Position | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [notes, setNotes] = useState('')

    // View Modal State
    const [viewingCV, setViewingCV] = useState<TailoredCV | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

    // Delete Confirmation Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    useEffect(() => {
        const fetchPosition = async () => {
            try {
                const response = await fetch(`/api/job-positions/${id}`)
                if (response.ok) {
                    const data = await response.json()
                    setPosition(data)
                    setNotes(data.notes || '')
                }
            } catch (error) {
                console.error('Error fetching position:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPosition()
    }, [id])

    const handleStatusChange = async (newStatus: string) => {
        if (!position) return

        try {
            setIsUpdating(true)
            const response = await fetch(`/api/job-positions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                setPosition({ ...position, status: newStatus })
            }
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleNotesSave = async () => {
        if (!position) return

        try {
            setIsUpdating(true)
            const response = await fetch(`/api/job-positions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            })

            if (response.ok) {
                setPosition({ ...position, notes })
            }
        } catch (error) {
            console.error('Error updating notes:', error)
        } finally {
            setIsUpdating(false)
        }
    }


    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(`/api/job-positions/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                router.push('/positions')
            } else {
                const data = await response.json()
                console.error('Failed to delete position:', data)
                alert('Failed to delete position: ' + (data.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error deleting position:', error)
            alert('An error occurred while deleting the position.')
        } finally {
            setIsDeleteDialogOpen(false)
        }
    }


    const handleGenerateCV = async () => {
        if (!position || !cvContent) return

        try {
            setIsGenerating(true)

            // 1. Generate tailored content
            const tailorRes = await fetch('/api/tailor-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvContent,
                    jobDescription: position.job_description,
                    matchAnalysis: {
                        matchScore: position.match_score,
                        matchingSkills: position.matching_skills,
                        missingSkills: position.missing_skills,
                        recommendations: position.recommendations
                    }
                })
            })

            if (!tailorRes.ok) throw new Error('Failed to generate tailored CV')
            const { tailoredCV } = await tailorRes.json()

            // 2. Save tailored CV
            const saveRes = await fetch('/api/tailored-cvs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_position_id: position.id,
                    cv_content: cvContent,
                    tailored_content: tailoredCV
                })
            })

            if (!saveRes.ok) throw new Error('Failed to save tailored CV')
            const savedCV = await saveRes.json()

            // Update local state
            setPosition({
                ...position,
                tailored_cvs: [savedCV, ...position.tailored_cvs]
            })

        } catch (error) {
            console.error('Error generating tailored CV:', error)
            alert('Failed to generate tailored CV. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownloadCV = async (cvId: string, version: number) => {
        try {
            const response = await fetch(`/api/tailored-cvs/${cvId}`)
            if (response.ok) {
                const data = await response.json()

                // Sanitize filename
                const safeCompanyName = position?.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'company'
                const safePositionTitle = position?.position_title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'position'
                const filename = `${safeCompanyName}_${safePositionTitle}_cv_v${version}.md`

                // Use download helper with cleaning
                downloadMarkdown(data.tailored_content, filename, true)
            }
        } catch (error) {
            console.error('Error downloading CV:', error)
        }
    }

    const handleViewCV = async (cv: TailoredCV) => {
        try {
            // If content is not loaded, fetch it
            let content = cv.tailored_content
            if (!content) {
                const response = await fetch(`/api/tailored-cvs/${cv.id}`)
                if (response.ok) {
                    const data = await response.json()
                    content = data.tailored_content
                }
            }

            if (content) {
                setViewingCV({ ...cv, tailored_content: content })
                setIsViewModalOpen(true)
            }
        } catch (error) {
            console.error('Error viewing CV:', error)
        }
    }

    const handleMarkAsSubmitted = async (cvId: string) => {
        if (!position) return

        try {
            const response = await fetch(`/api/job-positions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submitted_cv_id: cvId, status: 'applied', applied_date: new Date().toISOString() })
            })

            if (response.ok) {
                // Update local state: set submitted_cv_id and status
                // We need to cast or update the type locally if we want strict typing, 
                // but for now we can just update the state object
                setPosition(prev => prev ? ({
                    ...prev,
                    submitted_cv_id: cvId,
                    status: 'applied',
                    applied_date: new Date().toISOString()
                } as any) : null)
            }
        } catch (error) {
            console.error('Error marking CV as submitted:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!position) return null

    // Helper to check if a CV is the submitted one
    // We cast position to any here because we haven't updated the interface yet in this file
    // In a real scenario, we should update the Position interface
    const submittedCvId = (position as any).submitted_cv_id

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
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="analysis">Match Analysis</TabsTrigger>
                                <TabsTrigger value="description">Job Description</TabsTrigger>
                            </TabsList>

                            <TabsContent value="analysis" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-purple-600" />
                                            Match Analysis
                                        </CardTitle>
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
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <TailoredCVList
                            cvs={position.tailored_cvs}
                            submittedCvId={submittedCvId}
                            isGenerating={isGenerating}
                            canGenerate={!!cvContent}
                            onGenerate={handleGenerateCV}
                            onView={handleViewCV}
                            onDownload={handleDownloadCV}
                            onMarkAsSubmitted={handleMarkAsSubmitted}
                        />

                        <NotesCard
                            notes={notes}
                            onNotesChange={setNotes}
                            onSave={handleNotesSave}
                            isUpdating={isUpdating}
                        />
                    </div>
                </div>

                <CVViewModal
                    cv={viewingCV}
                    isOpen={isViewModalOpen}
                    companyName={position.company_name}
                    positionTitle={position.position_title}
                    onClose={() => setIsViewModalOpen(false)}
                    onDownload={handleDownloadCV}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Job Position</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this position? This will permanently delete
                                the job position and all associated tailored CVs. This action cannot be undone.
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
            </main>
        </div>
    )
}
