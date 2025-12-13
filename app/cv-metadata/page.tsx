'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, FileText, Plus } from "lucide-react"
import { useCVStore } from "@/hooks/useCVStore"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useSubscription } from "@/hooks/useSubscription"
import { useCVMetadataList } from "@/hooks/useCVMetadata"
import { CVEditorModal } from "@/components/cv-editor"
import { PageLoader } from "@/components/ui/loading-spinner"
import { StatusAlert } from "@/components/ui/status-alert"
import { useModalState } from "@/hooks/useModalState"
import { useLoadingState } from "@/hooks/useLoadingState"
import { CVMetadataCard } from "@/components/cv-metadata/cv-metadata-card"
import { CVViewModal } from "@/components/positions/CVViewModal"
import { downloadMarkdown } from "@/lib/download-helpers"
import { renderExtractedInfoToMarkdown } from "@/lib/cv-formatter"
import type { CVMetadataResponse, ExtractedCVInfo } from "@/lib/api-client"

export default function CVMetadataPage() {
    const router = useRouter()
    const { hasProAccess } = useSubscription()
    const { setCV, setAnalysis, setExtractedInfo, clear } = useCVStore()
    const [metadata, setMetadata] = useState<CVMetadataResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const loadingState = useLoadingState()
    const editModal = useModalState<CVMetadataResponse>()
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [loadingAnalysisHash, setLoadingAnalysisHash] = useState<string | null>(null)
    
    // View modal state - uses CVMetadataResponse directly
    const [viewingCV, setViewingCV] = useState<CVMetadataResponse | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

    const { data: listResponse, isLoading: listLoading, error: listError, refetch } = useCVMetadataList()
    const loadMetadata = useCallback(async () => {
        if (listResponse?.metadata) {
            setMetadata(listResponse.metadata)
        }
    }, [listResponse])

    const checkAuthAndLoadMetadata = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth?redirect=cv-metadata')
                return
            }

            await loadMetadata()
        } catch (error) {
            console.error('Auth check failed:', error)
            loadingState.setError('Failed to load metadata')
        } finally {
            setIsLoading(false)
        }
    }, [router, loadMetadata])

    useEffect(() => {
        checkAuthAndLoadMetadata()
    }, [checkAuthAndLoadMetadata])

    const getRenderableContent = useCallback((item: CVMetadataResponse) => {
        const content = item.cv_content?.trim()
        if (content) return content

        try {
            return renderExtractedInfoToMarkdown(item.extracted_info)
        } catch (err) {
            console.error('Failed to render CV content for preview', err)
            return ''
        }
    }, [])



    const handleEdit = (item: CVMetadataResponse) => {
        editModal.open(item)
    }

    const handleEditSave = async (updatedInfo: ExtractedCVInfo) => {
        if (!editModal.item) return

        await loadingState.execute(
            async () => {
                const response = await fetch(`/api/cv-metadata/${editModal.item!.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ extractedInfo: updatedInfo })
                })
                if (!response.ok) throw new Error('Failed to update metadata')
                await refetch()
                editModal.close()
            },
            {
                successMessage: 'CV metadata updated successfully!',
                errorMessage: 'Failed to update metadata. Please try again.'
            }
        )
    }

    const handleDelete = async (metadataId: string) => {
        setIsDeleting(metadataId)
        await loadingState.execute(
            async () => {
                const response = await fetch(`/api/cv-metadata/${metadataId}`, {
                    method: 'DELETE'
                })
                if (!response.ok) throw new Error('Failed to delete metadata')
                await refetch()
            },
            {
                successMessage: 'CV metadata deleted successfully!',
                errorMessage: 'Failed to delete metadata. Please try again.'
            }
        )
        setIsDeleting(null)
    }

    const handleLoadAnalysis = async (item: CVMetadataResponse) => {
        setLoadingAnalysisHash(item.cv_hash)
        try {
            // Fetch stored analysis
            const response = await fetch(`/api/retrieve-analysis?hash=${item.cv_hash}`)

            if (!response.ok) {
                if (response.status === 404) {
                    // No stored CV content found - we still have metadata, so navigate to analysis
                    // The analysis page will work with the extracted info we have
                    clear()
                    // Use a placeholder for CV content - the extracted info is what matters
                    const cvName = item.extracted_info?.name || 'Unknown'
                    setCV(`[CV content for ${cvName}]`, `${cvName}_CV`)
                    setExtractedInfo(item.extracted_info, item.id)
                    // No analysis yet - user can generate it on the analysis page
                    router.push('/analysis')
                    return
                } else {
                    loadingState.setError('Failed to retrieve CV data.')
                    return
                }
            }

            const data = await response.json()

            // Populate store and navigate
            clear()
            setCV(data.cvContent, data.filename || 'Stored CV')
            setExtractedInfo(item.extracted_info, item.id)
            
            // If analysis exists, go directly to report page
            if (data.analysis) {
                setAnalysis(data.analysis)
                router.push('/analysis/report')
            } else {
                router.push('/analysis')
            }

        } catch (error) {
            console.error('Failed to load analysis:', error)
            loadingState.setError('An error occurred while loading the CV.')
        } finally {
            setLoadingAnalysisHash(null)
        }
    }

    const handleViewContent = (item: CVMetadataResponse) => {
        const content = getRenderableContent(item)
        if (content) {
            setViewingCV({ ...item, cv_content: content })
            setIsViewModalOpen(true)
        } else {
            loadingState.setError('No content available for this CV.')
        }
    }

    const handleDownload = (item: CVMetadataResponse) => {
        const content = getRenderableContent(item)
        if (content) {
            const displayName = item.display_name || item.extracted_info?.name || 'CV'
            const safeName = displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const filename = `${safeName}.md`
            downloadMarkdown(content, filename, true)
        } else {
            loadingState.setError('No content available for download.')
        }
    }

    const handleDownloadFromModal = async (cvId: string, version: number) => {
        const item = metadata.find(m => m.id === cvId)
        if (item) {
            handleDownload(item)
        }
    }

    if (isLoading) {
        return <PageLoader message="Loading your CV metadata..." />
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="gap-2 mb-6 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                    
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My CVs</h1>
                            <p className="text-muted-foreground mt-2 text-base">
                                Manage your uploaded CVs and view AI-powered career insights
                            </p>
                        </div>

                        {hasProAccess && (
                            <Button onClick={() => router.push('/')} className="gap-2 bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4" />
                                Upload New CV
                            </Button>
                        )}
                    </div>
                </div>

                {/* Success Message */}
                {loadingState.success && (
                    <StatusAlert
                        variant="success"
                        title="Success"
                        message={loadingState.success}
                        className="mb-6"
                    />
                )}

                {/* Error State */}
                {loadingState.error && (
                    <StatusAlert
                        variant="error"
                        title="Error"
                        message={loadingState.error}
                        className="mb-6"
                    />
                )}

                {/* Metadata List */}
                {metadata.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No CV Metadata Found</h3>
                                <p className="text-muted-foreground mb-6">
                                    You haven&apos;t uploaded any CVs yet. Upload a CV to get started with metadata management.
                                </p>
                                {hasProAccess ? (
                                    <Button onClick={() => router.push('/')}>
                                        Upload Your First CV
                                    </Button>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            CV metadata management is available with Pro subscription
                                        </p>
                                        <Button onClick={() => router.push('/pricing')} variant="outline">
                                            Upgrade to Pro
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {metadata.map((item) => (
                            <CVMetadataCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onLoadAnalysis={handleLoadAnalysis}
                                onViewContent={handleViewContent}
                                onDownload={handleDownload}
                                onRename={async (id: string, name: string) => {
                                    try {
                                        const response = await fetch(`/api/cv-metadata/${id}/rename`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ displayName: name })
                                        })
                                        if (!response.ok) throw new Error('Failed to rename')
                                        const updatedMeta = await response.json()
                                        setMetadata((prev) => prev.map((x) => x.id === id ? updatedMeta.metadata : x))
                                    } catch (err) {
                                        console.error('Failed to rename:', err)
                                        throw err
                                    }
                                }}
                                isDeleting={isDeleting === item.id}
                                isLoadingAnalysis={loadingAnalysisHash === item.cv_hash}
                            />
                        ))}
                    </div>
                )}

                {/* Edit CV Modal */}
                {editModal.item && (
                    <CVEditorModal
                        open={editModal.isOpen}
                        onOpenChange={(open) => !open && editModal.close()}
                        initialData={editModal.item.extracted_info}
                        onSave={handleEditSave}
                        title="Edit CV"
                        description="Update your CV information and professional profile"
                        variant="sheet"
                        side="right"
                    />
                )}

                {/* View CV Modal */}
                {viewingCV && (
                    <CVViewModal
                        isOpen={isViewModalOpen}
                        onClose={() => {
                            setIsViewModalOpen(false)
                            setViewingCV(null)
                        }}
                        cv={{
                            id: viewingCV.id,
                            version: 1,
                            tailored_content: viewingCV.cv_content
                        }}
                        companyName={viewingCV.display_name || undefined}
                        positionTitle={viewingCV.extracted_info?.name || undefined}
                        onDownload={async () => {
                            if (viewingCV.cv_content) {
                                const displayName = viewingCV.display_name || viewingCV.extracted_info?.name || 'CV'
                                const safeName = displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
                                downloadMarkdown(viewingCV.cv_content, `${safeName}.md`, true)
                            }
                        }}
                    />
                )}
            </main>
        </div>
    )
}
