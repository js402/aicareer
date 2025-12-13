import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, FileText, User, Briefcase, GraduationCap, Award, Calendar, Sparkles, Loader2, Eye, Download, Palette } from "lucide-react"
import { useRouter } from "next/navigation"
import type { CVMetadataResponse } from "@/lib/api-client"
import { useState } from "react"

interface CVMetadataCardProps {
  item: CVMetadataResponse
  isLoadingAnalysis: boolean
  isDeleting: boolean
  onEdit: (item: CVMetadataResponse) => void
  onDelete: (id: string) => void
  onLoadAnalysis: (item: CVMetadataResponse) => void
  onRename: (id: string, name: string) => Promise<void>
  onViewContent?: (item: CVMetadataResponse) => void
  onDownload?: (item: CVMetadataResponse) => void
  onDesignLayout?: (item: CVMetadataResponse) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function CVMetadataCard({
  item,
  isLoadingAnalysis,
  isDeleting,
  onEdit,
  onDelete,
  onLoadAnalysis,
  onRename,
  onViewContent,
  onDownload,
  onDesignLayout
}: CVMetadataCardProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState((item as any).display_name || '')

  const handleRename = async () => {
    if (displayName !== (item as any).display_name) {
      await onRename(item.id, displayName)
    }
  }

  const getContactDisplay = () => {
    const contact = item.extracted_info.contactInfo
    if (typeof contact === 'string') return contact || 'Not available'
    return contact?.email || contact?.phone || contact?.location || 'Not available'
  }

  const extractedInfo = item.extracted_info
  const seniorityLevel = extractedInfo.seniorityLevel || 'professional'
  const yearsExp = extractedInfo.yearsOfExperience
  const isTailored = (item as any).source_type === 'tailored'

  return (
    <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-300 hover:shadow-lg">
      {/* Top accent bar - different color for tailored CVs */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isTailored 
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
        : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`} />
      
      <CardContent className="p-6 pt-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${isTailored 
            ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30' 
            : 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30'}`}>
            <FileText className={`h-6 w-6 ${isTailored ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">
              {extractedInfo.name || 'Unnamed CV'}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {isTailored && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-medium">
                  Tailored
                </Badge>
              )}
              <Badge className={`${getStatusColor(item.extraction_status)} text-xs font-medium`}>
                {item.extraction_status}
              </Badge>
              {seniorityLevel && (
                <Badge variant="outline" className="text-xs capitalize">
                  {seniorityLevel}
                </Badge>
              )}
              {yearsExp !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {yearsExp}+ years
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Skills</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extractedInfo.skills?.length || 0}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Experience</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extractedInfo.experience?.length || 0}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Education</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extractedInfo.education?.length || 0}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Projects</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extractedInfo.projects?.length || 0}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{getContactDisplay()}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>Added {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* View Content and Download - only for tailored CVs or CVs with content */}
          {(isTailored || (item as any).cv_content) && (
            <div className="flex gap-2">
              {onViewContent && (
                <Button
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => onViewContent(item)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => onDownload(item)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          )}

          {/* Analysis button - only for uploaded CVs */}
          {!isTailored && (
            <Button
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
              onClick={() => onLoadAnalysis(item)}
              disabled={isLoadingAnalysis}
            >
              {isLoadingAnalysis ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Analysis
                </>
              )}
            </Button>
          )}

          {/* Design Layout button */}
          <Button
            variant="outline"
            className="w-full h-10 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900 dark:hover:border-blue-800 dark:hover:bg-blue-950 text-blue-600 hover:text-blue-700"
            onClick={() => onDesignLayout ? onDesignLayout(item) : router.push(`/cv-editor?id=${item.id}`)}
          >
            <Palette className="h-4 w-4 mr-2" />
            Design & Print
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onEdit(item)}
              className="flex-1 h-10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 h-10 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:hover:border-red-800 dark:hover:bg-red-950"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete CV</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this CV? This action cannot be undone and all associated analysis data will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
