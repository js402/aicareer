import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Map } from "lucide-react"

interface SkillGapItem {
    skill: string
    priority: "high" | "medium" | "low"
    timeframe: string
    resources: string[]
}

interface SkillGap {
    critical: SkillGapItem[]
    recommended: SkillGapItem[]
}

interface SkillGapTabProps {
    skillGap: SkillGap
}

export function SkillGapTab({ skillGap }: SkillGapTabProps) {
    return (
        <Card className="border-green-500/20 bg-green-50/10 dark:bg-green-950/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-green-600" />
                    Skill Gap Roadmap
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Critical Skills to Acquire
                    </h3>
                    <div className="grid gap-4">
                        {skillGap.critical.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold">{item.skill}</h4>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider">{item.timeframe}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Resources:</span> {item.resources.join(", ")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Recommended for Growth
                    </h3>
                    <div className="grid gap-4">
                        {skillGap.recommended.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold">{item.skill}</h4>
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase tracking-wider">{item.timeframe}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Resources:</span> {item.resources.join(", ")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
