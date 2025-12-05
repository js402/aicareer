'use client'

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, TrendingUp, FileText, Target } from "lucide-react"
import { getUserCVBlueprint } from "@/lib/api-client"

interface BlueprintStatusProps {
    compact?: boolean
    showProgress?: boolean
}

export function BlueprintStatus({ compact = false, showProgress = true }: BlueprintStatusProps) {
    const [blueprint, setBlueprint] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadBlueprint = async () => {
            try {
                const result = await getUserCVBlueprint()
                setBlueprint(result.blueprint)
            } catch (error) {
                console.error('Failed to load blueprint:', error)
            } finally {
                setLoading(false)
            }
        }

        loadBlueprint()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground animate-pulse" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        )
    }

    if (!blueprint) {
        return compact ? (
            <Badge variant="outline" className="gap-1 text-xs">
                <Brain className="h-3 w-3" />
                No Profile
            </Badge>
        ) : (
            <Card className="border-dashed">
                <CardContent className="pt-4">
                    <div className="text-center text-sm text-muted-foreground">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No profile data yet</p>
                        <p className="text-xs">Upload a CV to get started</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const confidencePercent = blueprint.displayPercentages?.confidencePercent ??
        Math.round((blueprint.confidence_score || 0) * 100)
    const completenessPercent = blueprint.displayPercentages?.completenessPercent ??
        Math.round((blueprint.data_completeness || 0) * 100)

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Badge
                    variant={confidencePercent > 70 ? "default" : "outline"}
                    className="gap-1 text-xs"
                >
                    <Brain className="h-3 w-3" />
                    {confidencePercent}% confident
                </Badge>
                <span className="text-xs text-muted-foreground">
                    {blueprint.total_cvs_processed} CV{blueprint.total_cvs_processed !== 1 ? 's' : ''}
                </span>
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold">AI Learning Profile</h3>
                        </div>
                        <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            v{blueprint.blueprint_version}
                        </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {blueprint.total_cvs_processed}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                CVs Processed
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {confidencePercent}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Confidence
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    {showProgress && (
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        Profile Completeness
                                    </span>
                                    <span>{completenessPercent}%</span>
                                </div>
                                <Progress value={completenessPercent} className="h-2" />
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        AI Confidence
                                    </span>
                                    <span>{confidencePercent}%</span>
                                </div>
                                <Progress value={confidencePercent} className="h-2" />
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="text-center text-sm text-muted-foreground">
                        {confidencePercent < 30 && "Building your profile..."}
                        {confidencePercent >= 30 && confidencePercent < 70 && "Profile growing stronger!"}
                        {confidencePercent >= 70 && "Profile fully optimized!"}
                    </div>

                    {/* Last Updated */}
                    {blueprint.last_cv_processed_at && (
                        <div className="text-xs text-muted-foreground text-center">
                            Last updated: {new Date(blueprint.last_cv_processed_at).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
