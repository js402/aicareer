import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"

interface StrategicPath {
    currentPosition: string
    shortTerm: string[]
    midTerm: string[]
    longTerm: string[]
}

interface StrategicPathTabProps {
    strategicPath: StrategicPath
}

export function StrategicPathTab({ strategicPath }: StrategicPathTabProps) {
    return (
        <Card className="border-purple-500/20 bg-purple-50/10 dark:bg-purple-950/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Strategic Career Path
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Current Position Assessment</h3>
                    <p className="text-muted-foreground">{strategicPath.currentPosition}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-purple-700 dark:text-purple-300">Short Term (1-2 Years)</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            {strategicPath.shortTerm.map((goal, i) => (
                                <li key={i}>{goal}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium text-purple-700 dark:text-purple-300">Mid Term (3-5 Years)</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            {strategicPath.midTerm.map((goal, i) => (
                                <li key={i}>{goal}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium text-purple-700 dark:text-purple-300">Long Term (5+ Years)</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            {strategicPath.longTerm.map((goal, i) => (
                                <li key={i}>{goal}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
