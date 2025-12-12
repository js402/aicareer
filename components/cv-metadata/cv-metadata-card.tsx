import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, FileText, User, Briefcase, GraduationCap, Award, Calendar, BarChart3, Sparkles, Loader2 } from "lucide-react"
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
  onRename
}: CVMetadataCardProps) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
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
              <div className="mt-2">
                <input
                  className="border rounded px-2 py-1 text-xs bg-white dark:bg-slate-900 w-full"
                  placeholder="Name this CV"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
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
              {getContactDisplay()}
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
          <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
                  <AlertDialogTitle>Delete CV Metadata</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this CV metadata? This action cannot be undone.
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
