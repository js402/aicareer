'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, HelpCircle } from "lucide-react"

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
    const [answers, setAnswers] = useState<string[]>(questions.map(() => ''))

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers]
        newAnswers[index] = value
        setAnswers(newAnswers)
    }

    const handleSubmit = () => {
        if (answers.every(answer => answer.trim() !== '')) {
            onSubmit(answers)
            setAnswers(questions.map(() => '')) // Reset for next time
        } else {
            alert('Please answer all questions before submitting.')
        }
    }

    const handleCancel = () => {
        setAnswers(questions.map(() => ''))
        onCancel()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        Additional Information Needed
                    </DialogTitle>
                    <DialogDescription>
                        Your CV appears to be incomplete. Please provide additional details to get a better analysis.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {questions.map((question, index) => (
                        <div key={index} className="space-y-2">
                            <Label htmlFor={`question-${index}`} className="font-medium">
                                {index + 1}. {question}
                            </Label>
                            {question.toLowerCase().includes('describe') ||
                                question.toLowerCase().includes('explain') ||
                                question.toLowerCase().includes('tell') ? (
                                <Textarea
                                    id={`question-${index}`}
                                    value={answers[index]}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="min-h-[80px]"
                                    disabled={isSubmitting}
                                />
                            ) : (
                                <Input
                                    id={`question-${index}`}
                                    value={answers[index]}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    placeholder="Type your answer here..."
                                    disabled={isSubmitting}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || answers.some(answer => answer.trim() === '')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Submit and Continue'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}