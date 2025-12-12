import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnalysisResultsProps {
    analysis: string | null
    isAnalyzing: boolean
    filename: string
    onAnalyze: () => void
}

export function AnalysisResults({ analysis, isAnalyzing, filename, onAnalyze }: AnalysisResultsProps) {
    const handleDownload = () => {
        if (!analysis) return
        const blob = new Blob([analysis], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}-analysis.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleCopy = () => {
        if (!analysis) return
        navigator.clipboard.writeText(analysis)
        alert('Analysis copied to clipboard!')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Career Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!analysis ? (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Get an AI-powered analysis of your CV with insights on strengths,
                            career trajectory, and recommendations.
                        </p>

                        <Button
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate AI Analysis
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <Tabs defaultValue="analysis">
                        <TabsList className="mb-4">
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                            <TabsTrigger value="raw">Raw Text</TabsTrigger>
                        </TabsList>

                        <TabsContent value="analysis">
                            <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {analysis}
                                </ReactMarkdown>
                            </div>
                        </TabsContent>

                        <TabsContent value="raw">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700 dark:text-slate-300">
                                    {analysis}
                                </pre>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {analysis && (
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                        >
                            Download Analysis
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                        >
                            Copy to Clipboard
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
