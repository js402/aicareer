'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { useCVStore } from "@/hooks/useCVStore"

interface CVUploadProps {
    onUpload?: (content: string, filename: string) => void
}

export function CVUpload({ onUpload }: CVUploadProps) {
    const router = useRouter()
    const { setCV } = useCVStore()
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFile = useCallback(async (file: File) => {
        // Validate file type
        const validTypes = ['text/plain', 'text/markdown']
        const validExtensions = ['.txt', '.md']
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            alert('Please upload a TXT or MD file')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB')
            return
        }

        setIsProcessing(true)

        try {
            // Read file content
            const content = await file.text()

            // Store in Zustand store (persisted to localStorage automatically)
            setCV(content, file.name)

            // Call optional callback
            if (onUpload) {
                onUpload(content, file.name)
            }

            // Navigate to review page
            router.push('/cv-review')
        } catch (error) {
            console.error('Error reading file:', error)
            alert('Error reading file. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }, [router, onUpload, setCV])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFile(file)
        }
    }, [handleFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFile(file)
        }
    }, [handleFile])

    const handleClick = useCallback(() => {
        document.getElementById('file-input')?.click()
    }, [])

    return (
        <Card
            className={`relative group overflow-hidden border-dashed border-2 transition-all duration-300 cursor-pointer bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/50 dark:to-slate-900/50 hover:shadow-xl ${isDragging
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/50'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                } ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
        >
            <input
                id="file-input"
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileInput}
                className="hidden"
                disabled={isProcessing}
            />

            <CardContent className="flex flex-col items-center justify-center p-12 md:p-16 text-center space-y-6">
                <div className={`p-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 group-hover:scale-110 transition-transform duration-300 ring-2 ring-blue-500/20 dark:ring-blue-500/30 ${isDragging ? 'scale-110' : ''
                    }`}>
                    <Upload className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="space-y-3">
                    <h2 className="font-bold text-2xl md:text-3xl">
                        {isProcessing ? 'Processing...' : 'Upload Your CV'}
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                        {isProcessing
                            ? 'Reading your file...'
                            : isDragging
                                ? 'Drop your file here'
                                : 'Drop your file here or click to browse'
                        }
                    </p>
                    <p className="text-sm text-muted-foreground">
                        TXT or MD • Max 10MB
                    </p>
                </div>

                {!isProcessing && (
                    <Button size="lg" className="mt-4 px-8 py-6 text-lg font-semibold">
                        Choose File
                    </Button>
                )}
            </CardContent>

            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 transition-opacity duration-300 ${isDragging || isProcessing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
        </Card>
    )
}
