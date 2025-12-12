'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { CVEditor } from './cv-editor'
import type { ExtractedCVInfo } from "@/lib/api-client"

export interface CVEditorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: ExtractedCVInfo
    onSave: (data: ExtractedCVInfo) => Promise<void>
    title?: string
    description?: string
    /** Use Sheet (side panel) instead of Dialog */
    variant?: 'dialog' | 'sheet'
    /** Sheet side when variant is 'sheet' */
    side?: 'left' | 'right'
}

export function CVEditorModal({
    open,
    onOpenChange,
    initialData,
    onSave,
    title = "Edit CV",
    description = "Update your CV information",
    variant = 'sheet',
    side = 'right'
}: CVEditorModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async (data: ExtractedCVInfo) => {
        setIsLoading(true)
        try {
            await onSave(data)
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const editorContent = (
        <CVEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
            compact={variant === 'dialog'}
        />
    )

    if (variant === 'sheet') {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side={side} className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription>{description}</SheetDescription>
                    </SheetHeader>
                    {editorContent}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {editorContent}
            </DialogContent>
        </Dialog>
    )
}
