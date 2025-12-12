'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { useCVStore } from "@/hooks/useCVStore"
import { supabase } from "@/lib/supabase"

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

            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                // Upload to DB
                const res = await fetch('/api/cv-metadata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, filename: file.name })
                })

                if (!res.ok) throw new Error('Failed to upload CV')

                const data = await res.json()

                // Store minimal state (ID and Name) and clear local content
                setCV(content, file.name) // Set momentarily for UI
                useCVStore.getState().setSyncedCV(data.id)
            } else {
                // Store in Zustand store (persisted to localStorage)
                setCV(content, file.name)
            }

            // Call optional callback
            if (onUpload) {
                onUpload(content, file.name)
            }

            // Navigate to review page
            router.push('/cv-review')
        } catch (error) {
            console.error('Error reading/uploading file:', error)
            alert('Error processing file. Please try again.')
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
            className={`relative group overflow-hidden border-dashed border-2 transition-all duration-300 cursor-pointer bg-gradient-to-br from-background to-muted/50 hover:shadow-xl ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
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

            <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
                <div className={`p-6 rounded-full bg-primary/5 group-hover:scale-110 transition-transform duration-300 ring-2 ring-primary/10 ${isDragging ? 'scale-110' : ''
                    }`}>
                    <Upload className="h-16 w-16 text-primary" />
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

            <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-300 ${isDragging || isProcessing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
        </Card>
    )
}
