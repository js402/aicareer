import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Award, Target } from "lucide-react"

interface MarketValue {
    salaryRange: {
        min: number
        max: number
        currency: string
    }
    marketDemand: string
    competitiveAdvantages: string[]
    negotiationTips: string[]
}

interface MarketValueTabProps {
    marketValue: MarketValue
}

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function MarketValueTab({ marketValue }: MarketValueTabProps) {
    return (
        <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Market Value Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-white dark:bg-slate-950 p-6 rounded-lg border shadow-sm text-center">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Estimated Salary Range</p>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(marketValue.salaryRange.min, marketValue.salaryRange.currency)} - {formatCurrency(marketValue.salaryRange.max, marketValue.salaryRange.currency)}
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-950 p-6 rounded-lg border shadow-sm">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Market Demand</p>
                        <p className="font-medium">{marketValue.marketDemand}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            Competitive Advantages
                        </h4>
                        <ul className="space-y-2">
                            {marketValue.competitiveAdvantages.map((adv, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-blue-500 mt-1">•</span>
                                    {adv}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            Negotiation Tips
                        </h4>
                        <ul className="space-y-2">
                            {marketValue.negotiationTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-500 mt-1">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
