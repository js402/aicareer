import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, ExternalLink, Download } from "lucide-react"

interface TailoredCV {
    id: string
    version: number
    is_active: boolean
    created_at: string
    tailored_content?: string
}

interface TailoredCVListProps {
    cvs: TailoredCV[]
    submittedCvId?: string
    isGenerating: boolean
    canGenerate: boolean
    onGenerate: () => Promise<void>
    onView: (cv: TailoredCV) => Promise<void>
    onDownload: (cvId: string, version: number) => Promise<void>
    onMarkAsSubmitted: (cvId: string) => Promise<void>
}

export function TailoredCVList({
    cvs,
    submittedCvId,
    isGenerating,
    canGenerate,
    onGenerate,
    onView,
    onDownload,
    onMarkAsSubmitted
}: TailoredCVListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Tailored CVs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={onGenerate}
                    disabled={isGenerating || !canGenerate}
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
                    {cvs?.map((cv) => {
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
                                            onClick={() => onView(cv)}
                                            title="View Content"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onDownload(cv.id, cv.version)}
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
                                        onClick={() => onMarkAsSubmitted(cv.id)}
                                    >
                                        Mark as Submitted
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    {(!cvs || cvs.length === 0) && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No tailored CVs generated yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
