import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Building2, MapPin, ArrowRight, Trash2 } from "lucide-react"
import { StatusBadge } from "./status-badge"

interface PositionCardProps {
    position: {
        id: string
        company_name: string
        position_title: string
        location?: string
        match_score?: number
        status: string
        created_at: string
    }
    onDelete?: (id: string) => void
}

export function PositionCard({ position, onDelete }: PositionCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 50) return 'text-amber-600 dark:text-amber-400'
        return 'text-red-600 dark:text-red-400'
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold mb-1">
                            {position.position_title}
                        </CardTitle>
                        <div className="flex items-center text-muted-foreground text-sm">
                            <Building2 className="h-3 w-3 mr-1" />
                            {position.company_name}
                        </div>
                    </div>
                    <StatusBadge status={position.status} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-end">
                    <div className="space-y-2 text-sm text-muted-foreground">
                        {position.location && (
                            <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2" />
                                {position.location}
                            </div>
                        )}
                        <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-2" />
                            Added {new Date(position.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        {position.match_score !== undefined && (
                            <div className="flex flex-col items-end">
                                <span className={`text-2xl font-bold ${getScoreColor(position.match_score)}`}>
                                    {position.match_score}%
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Match</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {onDelete && (
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onDelete(position.id)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/positions/${position.id}`}>
                                    View Details
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
