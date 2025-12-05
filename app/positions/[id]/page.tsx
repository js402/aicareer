'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ExternalLink, MapPin, Building2, Download, Sparkles, Loader2, Trash2, Printer } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"
import { SkillListCard } from "@/components/analysis/skill-list-card"
import { useCVStore } from "@/hooks/useCVStore"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cleanMarkdown } from "@/lib/markdown"
import { downloadMarkdown } from "@/lib/download-helpers"

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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this position? This action cannot be undone.')) return

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
                    jobDescription: position.job_description
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

    const handlePrint = () => {
        // Create a hidden iframe to print
        const printContent = document.getElementById('cv-preview-content')
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>Tailored CV - ${position?.company_name} - ${position?.position_title}</title>
                    <style>
                        @page {
                            margin: 2cm;
                            size: A4;
                        }
                        body { 
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333;
                            max-width: 210mm;
                            margin: 0 auto;
                            background: white;
                        }
                        /* Reset some default browser styles */
                        * { box-sizing: border-box; }
                        
                        /* Header Styling */
                        h1 { 
                            font-size: 24pt; 
                            font-weight: 700; 
                            margin-bottom: 0.5em; 
                            color: #111;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        
                        h2 { 
                            font-size: 16pt; 
                            font-weight: 600; 
                            margin-top: 1.5em; 
                            margin-bottom: 0.75em; 
                            color: #2c3e50;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        h3 { 
                            font-size: 13pt; 
                            font-weight: 600; 
                            margin-top: 1.2em; 
                            margin-bottom: 0.5em; 
                            color: #444;
                        }
                        
                        /* Content Styling */
                        p { 
                            margin-bottom: 0.8em; 
                            text-align: justify;
                        }
                        
                        ul { 
                            list-style-type: disc; 
                            padding-left: 1.2em; 
                            margin-bottom: 1em; 
                        }
                        
                        li { 
                            margin-bottom: 0.4em; 
                            padding-left: 0.2em;
                        }
                        
                        strong {
                            font-weight: 600;
                            color: #000;
                        }
                        
                        /* Tables */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 1em;
                        }
                        
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        
                        th {
                            background-color: #f2f2f2;
                            font-weight: 600;
                        }
                        
                        /* Blockquotes */
                        blockquote {
                            border-left: 4px solid #ccc;
                            margin: 0 0 1em 0;
                            padding-left: 1em;
                            color: #666;
                            font-style: italic;
                        }
                        
                        /* Code blocks */
                        pre {
                            background-color: #f5f5f5;
                            padding: 10px;
                            border-radius: 4px;
                            overflow-x: auto;
                            margin-bottom: 1em;
                        }
                        
                        code {
                            font-family: 'Courier New', Courier, monospace;
                            background-color: #f5f5f5;
                            padding: 2px 4px;
                            border-radius: 2px;
                            font-size: 0.9em;
                        }
                        
                        pre code {
                            background-color: transparent;
                            padding: 0;
                        }
                        
                        /* Links */
                        a {
                            color: #2563eb;
                            text-decoration: none;
                        }
                        
                        /* Print optimizations */
                        @media print {
                            body { 
                                padding: 0; 
                                margin: 0;
                                width: 100%;
                            }
                            @page {
                                margin: 1.5cm;
                            }
                            a {
                                text-decoration: none;
                                color: #000;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `)
        printWindow.document.close()
        // Wait for resources to load
        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 250)
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
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/positions')}
                        className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Positions
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{position.position_title}</h1>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    {position.company_name}
                                </div>
                                {position.location && (
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {position.location}
                                    </div>
                                )}
                                {position.job_url && (
                                    <a
                                        href={position.job_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center hover:text-blue-600 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Job Post
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select
                                value={position.status}
                                onValueChange={handleStatusChange}
                                disabled={isUpdating}
                            >
                                <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="saved">Saved</SelectItem>
                                    <SelectItem value="applied">Applied</SelectItem>
                                    <SelectItem value="interviewing">Interviewing</SelectItem>
                                    <SelectItem value="offer">Offer Received</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="destructive" size="icon" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

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
                                            <SkillListCard
                                                title="Missing / Weak Areas"
                                                skills={position.missing_skills || []}
                                                variant="missing"
                                            />
                                            <SkillListCard
                                                title="Recommendations"
                                                skills={position.recommendations || []}
                                                variant="recommendations"
                                            />
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
                        {/* Tailored CVs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tailored CVs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={handleGenerateCV}
                                    disabled={isGenerating || !cvContent}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate New Version
                                        </>
                                    )}
                                </Button>

                                <div className="space-y-3">
                                    {position.tailored_cvs?.map((cv) => {
                                        const isSubmitted = cv.id === submittedCvId
                                        return (
                                            <div
                                                key={cv.id}
                                                className={`p-3 rounded-lg border transition-all ${isSubmitted
                                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50'
                                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">Version {cv.version}</span>
                                                            {isSubmitted && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
                                                                    Submitted
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(cv.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleViewCV(cv)}
                                                            title="View Content"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleDownloadCV(cv.id, cv.version)}
                                                            title="Download Markdown"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {!isSubmitted && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-7 text-xs"
                                                        onClick={() => handleMarkAsSubmitted(cv.id)}
                                                    >
                                                        Mark as Submitted
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {(!position.tailored_cvs || position.tailored_cvs.length === 0) && (
                                        <div className="text-center text-sm text-muted-foreground py-4">
                                            No tailored CVs generated yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="Add notes about this application..."
                                    className="min-h-[150px] mb-2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={handleNotesSave}
                                    disabled={isUpdating}
                                >
                                    Save Notes
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* View CV Modal */}
                {isViewModalOpen && viewingCV && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        Tailored CV - Version {viewingCV.version}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Previewing generated content
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrint}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print / PDF
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsViewModalOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950/50">
                                <div className="max-w-[210mm] mx-auto bg-white dark:bg-slate-900 shadow-lg p-[20mm] min-h-[297mm]">
                                    <div id="cv-preview-content" className="prose dark:prose-invert max-w-none">
                                        {viewingCV.tailored_content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {cleanMarkdown(viewingCV.tailored_content)}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <p>No content available for this version.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-2 bg-white dark:bg-slate-900 rounded-b-xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsViewModalOpen(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => handleDownloadCV(viewingCV.id, viewingCV.version)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Markdown
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
