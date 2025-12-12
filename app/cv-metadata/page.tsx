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
                    setExtractedInfo(item.extracted_info)
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
            if (data.analysis) {
                setAnalysis(data.analysis)
            }
            setExtractedInfo(item.extracted_info)

            router.push('/analysis')

        } catch (error) {
            console.error('Failed to load analysis:', error)
            loadingState.setError('An error occurred while loading the CV.')
        } finally {
            setLoadingAnalysisHash(null)
        }
    }

    if (isLoading) {
        return <PageLoader message="Loading your CV metadata..." />
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">CV Metadata Management</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage and edit your extracted CV information
                            </p>
                        </div>
                    </div>

                    {hasProAccess && (
                        <Button onClick={() => router.push('/')} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Upload New CV
                        </Button>
                    )}
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

                {/* Individual CV Metadata Section */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold">Your CV Uploads</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage your uploaded CV files and their extracted metadata
                    </p>
                </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metadata.map((item) => (
                            <CVMetadataCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onLoadAnalysis={handleLoadAnalysis}
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
            </main>
        </div>
    )
}
