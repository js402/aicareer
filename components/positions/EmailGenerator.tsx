import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Copy, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EmailGeneratorProps {
    jobDescription: string
    cvMetadataId: string | null
    companyName: string
    positionTitle: string
}

export function EmailGenerator({ jobDescription, cvMetadataId, companyName, positionTitle }: EmailGeneratorProps) {
    const { toast } = useToast()
    const [mode, setMode] = useState<'employee' | 'freelancer'>('employee')
    const [tone, setTone] = useState<string>('Professional')
    const [length, setLength] = useState<string>('Standard')
    const [focus, setFocus] = useState<string>('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [emailBody, setEmailBody] = useState('')
    const [isCopied, setIsCopied] = useState(false)

    const handleGenerate = async () => {
        if (!cvMetadataId) {
            toast({
                variant: "destructive",
                title: "No CV Selected",
                description: "Please upload a CV first to generate personalized emails.",
            })
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription,
                    cvMetadataId,
                    mode,
                    companyName,
                    positionTitle,
                    tone,
                    length,
                    focus
                })
            })

            if (!response.ok) throw new Error('Failed to generate email')

            const data = await response.json()
            setEmailBody(data.emailBody)
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate email. Please try again.",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(emailBody)
        setIsCopied(true)
        toast({
            title: "Copied!",
            description: "Email body copied to clipboard.",
        })
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Application Email Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {!cvMetadataId && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No CV selected. Please upload a CV to generate personalized emails.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <Label>Application Mode</Label>
                    <RadioGroup
                        defaultValue="employee"
                        value={mode}
                        onValueChange={(v) => setMode(v as 'employee' | 'freelancer')}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex-1">
                            <RadioGroupItem value="employee" id="r-employee" />
                            <Label htmlFor="r-employee" className="cursor-pointer font-medium">Full-time Employee</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex-1">
                            <RadioGroupItem value="freelancer" id="r-freelancer" />
                            <Label htmlFor="r-freelancer" className="cursor-pointer font-medium">Freelance Proposal</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Professional">Professional</SelectItem>
                                <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                                <SelectItem value="Confident">Confident</SelectItem>
                                <SelectItem value="Direct">Direct</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Length</Label>
                        <Select value={length} onValueChange={setLength}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Short">Short (Concise)</SelectItem>
                                <SelectItem value="Standard">Standard</SelectItem>
                                <SelectItem value="Detailed">Detailed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Key Focus Details (Optional)</Label>
                    <Textarea
                        value={focus}
                        onChange={(e) => setFocus(e.target.value)}
                        placeholder="e.g. Highlight my leadership experience and AWS certification..."
                        className="h-20"
                    />
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !cvMetadataId}
                    className="w-full"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Email Draft
                        </>
                    )}
                </Button>

                {emailBody && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <Label>Generated Draft</Label>
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                                {isCopied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1 text-green-600" />
                                        <span className="text-green-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <Textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="min-h-[250px] font-sans text-base leading-relaxed"
                            placeholder="Your email draft will appear here..."
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
