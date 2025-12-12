'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Plus, Trash2 } from "lucide-react"
import type { CVValidationResult } from "../cv-validation"

interface LanguagesSectionProps {
    languages: string[]
    onChange: (languages: string[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

// Common languages with proficiency levels
const COMMON_LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Chinese (Mandarin)', 
    'Japanese', 'Korean', 'Portuguese', 'Italian', 'Russian',
    'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Polish'
]

const PROFICIENCY_LEVELS = [
    'Native',
    'Fluent',
    'Professional',
    'Intermediate',
    'Basic'
]

interface LanguageWithProficiency {
    language: string
    proficiency?: string
}

export function LanguagesSection({
    languages,
    onChange,
    readOnly = false,
    validation: _validation
}: LanguagesSectionProps) {
    const [newLanguage, setNewLanguage] = useState('')
    const [newProficiency, setNewProficiency] = useState('Fluent')

    // Parse languages that might include proficiency
    const parseLanguage = (lang: string): LanguageWithProficiency => {
        const match = lang.match(/^(.+?)\s*\((.+?)\)$/)
        if (match) {
            return { language: match[1].trim(), proficiency: match[2].trim() }
        }
        return { language: lang }
    }

    const formatLanguage = (language: string, proficiency?: string): string => {
        if (proficiency) {
            return `${language} (${proficiency})`
        }
        return language
    }

    const addLanguage = (language?: string, proficiency?: string) => {
        const lang = language || newLanguage.trim()
        const prof = proficiency || newProficiency
        
        if (!lang) return
        
        const formatted = formatLanguage(lang, prof)
        
        // Check if language already exists
        const exists = languages.some(l => {
            const parsed = parseLanguage(l)
            return parsed.language.toLowerCase() === lang.toLowerCase()
        })
        
        if (!exists) {
            onChange([...languages, formatted])
        }
        setNewLanguage('')
    }

    const removeLanguage = (index: number) => {
        onChange(languages.filter((_, i) => i !== index))
    }

    const updateProficiency = (index: number, proficiency: string) => {
        const updated = [...languages]
        const parsed = parseLanguage(updated[index])
        updated[index] = formatLanguage(parsed.language, proficiency)
        onChange(updated)
    }

    // Filter out already added languages from suggestions
    const availableSuggestions = COMMON_LANGUAGES.filter(
        lang => !languages.some(l => {
            const parsed = parseLanguage(l)
            return parsed.language.toLowerCase() === lang.toLowerCase()
        })
    )

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Languages
                </h3>
                <p className="text-sm text-muted-foreground">
                    Add languages you speak and your proficiency level
                </p>
            </div>

            {/* Current Languages */}
            <Card>
                <CardContent className="pt-4">
                    {languages.length === 0 ? (
                        <div className="text-center py-8">
                            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No languages added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {languages.map((lang, index) => {
                                const parsed = parseLanguage(lang)
                                return (
                                    <div 
                                        key={index} 
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{parsed.language}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {!readOnly ? (
                                                <Select
                                                    value={parsed.proficiency || 'Fluent'}
                                                    onValueChange={(value) => updateProficiency(index, value)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PROFICIENCY_LEVELS.map(level => (
                                                            <SelectItem key={level} value={level}>
                                                                {level}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="secondary">
                                                    {parsed.proficiency || 'Fluent'}
                                                </Badge>
                                            )}
                                            
                                            {!readOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                                    onClick={() => removeLanguage(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Add new language */}
                    {!readOnly && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Input
                                value={newLanguage}
                                onChange={(e) => setNewLanguage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                                placeholder="Type a language..."
                                className="flex-1"
                            />
                            <Select
                                value={newProficiency}
                                onValueChange={setNewProficiency}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFICIENCY_LEVELS.map(level => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                onClick={() => addLanguage()}
                                disabled={!newLanguage.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Add Suggestions */}
            {!readOnly && availableSuggestions.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                            Quick add common languages:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.slice(0, 10).map(lang => (
                                <Badge
                                    key={lang}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => addLanguage(lang, 'Fluent')}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {lang}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Proficiency Guide */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="py-3">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Proficiency Level Guide:
                    </p>
                    <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        <li><strong>Native:</strong> Your first language</li>
                        <li><strong>Fluent:</strong> Can speak, read, and write with ease</li>
                        <li><strong>Professional:</strong> Can conduct business professionally</li>
                        <li><strong>Intermediate:</strong> Can hold conversations on familiar topics</li>
                        <li><strong>Basic:</strong> Can understand and use simple phrases</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
