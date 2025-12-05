import { Sparkles, Building2 } from "lucide-react"
import { MatchScoreCircle } from "@/components/analysis/match-score-circle"
import { SkillListCard } from "@/components/analysis/skill-list-card"

export interface JobMatchResult {
    matchScore: number
    matchingSkills: string[]
    missingSkills: string[]
    experienceAlignment?: {
        seniorityMatch: "Underqualified" | "Good Fit" | "Overqualified"
        yearsExperienceRequired: number | null
        yearsExperienceCandidate: number | null
        comment: string
    }
    responsibilityAlignment?: {
        matchingResponsibilities: string[]
        missingResponsibilities: string[]
    }
    recommendations: string[]
    metadata?: {
        company_name: string
        position_title: string
        location: string
        salary_range: string
        employment_type: string | null
        seniority_level: string | null
    }
    fromCache?: boolean
}

interface JobMatchAnalysisProps {
    result: JobMatchResult
}

export function JobMatchAnalysis({ result }: JobMatchAnalysisProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Experience Alignment */}
            {result.experienceAlignment && (
                <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        Experience Alignment
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="text-xs text-muted-foreground mb-1">Seniority Match</div>
                            <div className={`font-medium ${result.experienceAlignment.seniorityMatch === 'Good Fit' ? 'text-green-600' : 'text-amber-600'}`}>
                                {result.experienceAlignment.seniorityMatch}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="text-xs text-muted-foreground mb-1">Years Required</div>
                            <div className="font-medium">
                                {result.experienceAlignment.yearsExperienceRequired ?? 'N/A'} years
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="text-xs text-muted-foreground mb-1">Your Experience</div>
                            <div className="font-medium">
                                {result.experienceAlignment.yearsExperienceCandidate ?? 'N/A'} years
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        {result.experienceAlignment.comment}
                    </p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <SkillListCard
                    title="Matching Skills"
                    skills={result.matchingSkills}
                    variant="matching"
                />

                <SkillListCard
                    title="Missing / Weak Areas"
                    skills={result.missingSkills}
                    variant="missing"
                />
            </div>

            {/* Responsibility Alignment */}
            {result.responsibilityAlignment && (
                <div className="grid md:grid-cols-2 gap-6">
                    <SkillListCard
                        title="Matching Responsibilities"
                        skills={result.responsibilityAlignment.matchingResponsibilities}
                        variant="matching"
                    />
                    <SkillListCard
                        title="Missing Responsibilities"
                        skills={result.responsibilityAlignment.missingResponsibilities}
                        variant="missing"
                    />
                </div>
            )}

            <SkillListCard
                title="Recommendations"
                skills={result.recommendations}
                variant="recommendations"
            />
        </div>
    )
}
