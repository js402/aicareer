'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, FileText, User, Briefcase, GraduationCap, Award, Calendar, BarChart3, Plus } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { useSubscription } from "@/hooks/useSubscription"
import { getUserCVMetadata, updateCVMetadata, deleteCVMetadata } from "@/lib/api-client"
import { CVMetadataEditForm } from "@/components/cv-metadata-edit-form"
import type { CVMetadataResponse, ExtractedCVInfo } from "@/lib/api-client"

export default function CVMetadataPage() {
    const router = useRouter()
    const { hasProAccess } = useSubscription()
    const [metadata, setMetadata] = useState<CVMetadataResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [successMessage, setSuccessMessage] = useState<string>('')
    const [editingMetadata, setEditingMetadata] = useState<CVMetadataResponse | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    useEffect(() => {
        checkAuthAndLoadMetadata()
    }, [])

    const checkAuthAndLoadMetadata = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth?redirect=cv-metadata')
                return
            }

            await loadMetadata()
        } catch (error) {
            console.error('Auth check failed:', error)
            setError('Failed to load metadata')
        } finally {
            setIsLoading(false)
        }
    }

    const loadMetadata = async () => {
        try {
            const result = await getUserCVMetadata()
            setMetadata(result.metadata)
        } catch (error) {
            console.error('Failed to load metadata:', error)
            setError('Failed to load CV metadata')
        }
    }

    const handleEdit = (item: CVMetadataResponse) => {
        setEditingMetadata(item)
        setIsEditDialogOpen(true)
    }

    const handleEditSave = async (updatedInfo: ExtractedCVInfo) => {
        if (!editingMetadata) return

        try {
            await updateCVMetadata(editingMetadata.id, updatedInfo)
            await loadMetadata() // Refresh the list
            setIsEditDialogOpen(false)
            setEditingMetadata(null)
            setError('')
            setSuccessMessage('CV metadata updated successfully!')
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Failed to update metadata:', error)
            setError('Failed to update metadata. Please try again.')
            setSuccessMessage('')
        }
    }

    const handleDelete = async (metadataId: string) => {
        setIsDeleting(metadataId)
        try {
            await deleteCVMetadata(metadataId)
            await loadMetadata() // Refresh the list
            setError('')
            setSuccessMessage('CV metadata deleted successfully!')
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Failed to delete metadata:', error)
            setError('Failed to delete metadata. Please try again.')
            setSuccessMessage('')
        } finally {
            setIsDeleting(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your CV metadata...</p>
                    </div>
                </main>
            </div>
        )
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
                {successMessage && (
                    <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-300">Success</p>
                                    <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {error && (
                    <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-red-700 dark:text-red-300">Error</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata List */}
                {metadata.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No CV Metadata Found</h3>
                                <p className="text-muted-foreground mb-6">
                                    You haven't uploaded any CVs yet. Upload a CV to get started with metadata management.
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
                            <Card key={item.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg line-clamp-1">
                                                    {item.extracted_info.name || 'Unnamed CV'}
                                                </CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={getStatusColor(item.extraction_status)}>
                                                        {item.extraction_status}
                                                    </Badge>
                                                    {item.confidence_score && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <BarChart3 className="h-3 w-3" />
                                                            {(item.confidence_score * 100).toFixed(0)}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Personal Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Contact:</span>
                                            <span className="text-muted-foreground truncate">
                                                {typeof item.extracted_info.contactInfo === 'string'
                                                    ? (item.extracted_info.contactInfo || 'Not available')
                                                    : (item.extracted_info.contactInfo?.email ||
                                                       item.extracted_info.contactInfo?.phone ||
                                                       item.extracted_info.contactInfo?.location ||
                                                       'Not available')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <Award className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Skills:</span>
                                            <span className="text-muted-foreground">
                                                {item.extracted_info.skills.length} skills
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Experience:</span>
                                            <span className="text-muted-foreground">
                                                {item.extracted_info.experience.length} roles
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Education:</span>
                                            <span className="text-muted-foreground">
                                                {item.extracted_info.education.length} degrees
                                            </span>
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            Created {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Dialog open={isEditDialogOpen && editingMetadata?.id === item.id} onOpenChange={setIsEditDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(item)}
                                                    className="flex-1"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit CV Metadata</DialogTitle>
                                                </DialogHeader>
                                                {editingMetadata && (
                                                    <CVMetadataEditForm
                                                        metadata={editingMetadata}
                                                        onSave={handleEditSave}
                                                        onCancel={() => {
                                                            setIsEditDialogOpen(false)
                                                            setEditingMetadata(null)
                                                        }}
                                                    />
                                                )}
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete CV Metadata</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the metadata for "{item.extracted_info.name || 'this CV'}".
                                                        This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                    disabled={isDeleting === item.id}
                                                >
                                                    {isDeleting === item.id ? 'Deleting...' : 'Delete'}
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
