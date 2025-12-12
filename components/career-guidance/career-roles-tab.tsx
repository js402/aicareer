import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Target, Building, Users } from "lucide-react"

export interface PathSuggestion {
    role: string
    vertical: string
    companySize: string
    teamSize: string
    description: string
}

export interface CareerPathSuggestions {
    comfort: PathSuggestion
    growth: PathSuggestion
    challenging: PathSuggestion
}

interface CareerRolesTabProps {
    suggestions: CareerPathSuggestions | null
    isLoading: boolean
}

export function CareerRolesTab({ suggestions, isLoading }: CareerRolesTabProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-600" />
                    <p>Analyzing optimal career paths...</p>
                </CardContent>
            </Card>
        )
    }

    if (!suggestions) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Unable to load career suggestions.
                </CardContent>
            </Card>
        )
    }

    const renderRoleCard = (
        suggestion: PathSuggestion,
        type: 'comfort' | 'growth' | 'challenging'
    ) => {
        const config = {
            comfort: {
                label: 'Comfort Zone',
                color: 'blue',
                borderClass: 'border-l-blue-400 dark:border-l-blue-500',
                textClass: 'text-blue-600 dark:text-blue-400'
            },
            growth: {
                label: 'Growth & Promotion',
                color: 'green',
                borderClass: 'border-l-green-500 dark:border-l-green-500 shadow-md',
                textClass: 'text-green-600 dark:text-green-400'
            },
            challenging: {
                label: 'Challenging / Pivot',
                color: 'purple',
                borderClass: 'border-l-purple-500 dark:border-l-purple-500',
                textClass: 'text-purple-600 dark:text-purple-400'
            }
        }[type]

        return (
            <Card className={`border-l-4 ${config.borderClass}`}>
                <CardHeader className="pb-3">
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${config.textClass}`}>
                        {config.label}
                    </div>
                    <CardTitle className="text-lg">{suggestion.role}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="prose prose-xs dark:prose-invert">
                        <p>{suggestion.description}</p>
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Vertical:</span> {suggestion.vertical}
                        </div>
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Company:</span> {suggestion.companySize}
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Team:</span> {suggestion.teamSize}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderRoleCard(suggestions.comfort, 'comfort')}
            {renderRoleCard(suggestions.growth, 'growth')}
            {renderRoleCard(suggestions.challenging, 'challenging')}
        </div>
    )
}
