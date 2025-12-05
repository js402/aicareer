'use client'

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, MapPin, Building2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Position {
    id: string
    company_name: string
    position_title: string
    job_url?: string
    location?: string
    status: string
}

interface PositionHeaderProps {
    position: Position
    onStatusChange: (status: string) => Promise<void>
    onDelete: () => void
    isUpdating: boolean
}

export function PositionHeader({
    position,
    onStatusChange,
    onDelete,
    isUpdating
}: PositionHeaderProps) {
    const router = useRouter()

    return (
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
                        onValueChange={onStatusChange}
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

                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
