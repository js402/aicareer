import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface MissingInfoModalProps {
    isOpen: boolean
    questions: string[]
    onSubmit: (answers: string[]) => void
    onCancel: () => void
    isSubmitting: boolean
}

export function MissingInfoModal({
    isOpen,
    questions,
    onSubmit,
    onCancel,
    isSubmitting
}: MissingInfoModalProps) {
    const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers]
        newAnswers[index] = value
        setAnswers(newAnswers)
    }

    const handleSubmit = () => {
        onSubmit(answers)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        We noticed some gaps in your CV. Please answer a few questions to help us generate a better analysis.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {questions.map((question, index) => (
                        <div key={index} className="grid gap-2">
                            <Label htmlFor={`question-${index}`} className="font-medium leading-relaxed">
                                {index + 1}. {question}
                            </Label>
                            <Textarea
                                id={`question-${index}`}
                                value={answers[index]}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                placeholder="Type your answer here..."
                                className="min-h-[100px]"
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit & Analyze
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
