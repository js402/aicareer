'use client'

import { useState, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Code, Plus, X, Sparkles, Lightbulb, Target,
    Search, Check
} from "lucide-react"

import type { CVValidationResult } from "../cv-validation"

interface SkillsSectionProps {
    skills: string[]
    inferredSkills: string[]
    primaryFunctions: string[]
    onChange: (skills: string[]) => void
    onInferredChange: (inferredSkills: string[]) => void
    onFunctionsChange: (functions: string[]) => void
    readOnly?: boolean
    validation?: CVValidationResult
}

// Common skill categories for suggestions
const SKILL_CATEGORIES = {
    'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin'],
    'Frontend': ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'SASS', 'Redux', 'GraphQL'],
    'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'NestJS', 'Rails'],
    'Databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Firebase'],
    'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Jenkins'],
    'Tools': ['Git', 'GitHub', 'VS Code', 'Jira', 'Figma', 'Postman', 'Linux'],
    'Soft Skills': ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Project Management', 'Agile', 'Scrum'],
}

const PRIMARY_FUNCTIONS = [
    'Software Development',
    'Frontend Development', 
    'Backend Development',
    'Full Stack Development',
    'DevOps Engineering',
    'Data Engineering',
    'Machine Learning',
    'Product Management',
    'Engineering Management',
    'Technical Architecture',
    'QA/Testing',
    'Security Engineering',
]

export function SkillsSection({
    skills,
    inferredSkills,
    primaryFunctions,
    onChange,
    onInferredChange,
    onFunctionsChange,
    readOnly = false,
    validation: _validation
}: SkillsSectionProps) {
    const [newSkill, setNewSkill] = useState('')
    const [newFunction, setNewFunction] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const addSkill = (skill: string) => {
        const trimmed = skill.trim()
        if (trimmed && !skills.includes(trimmed)) {
            onChange([...skills, trimmed])
        }
        setNewSkill('')
    }

    const removeSkill = (index: number) => {
        onChange(skills.filter((_, i) => i !== index))
    }

    const promoteInferredSkill = (skill: string) => {
        if (!skills.includes(skill)) {
            onChange([...skills, skill])
        }
        onInferredChange(inferredSkills.filter(s => s !== skill))
    }

    const removeInferredSkill = (skill: string) => {
        onInferredChange(inferredSkills.filter(s => s !== skill))
    }

    const addFunction = (func: string) => {
        const trimmed = func.trim()
        if (trimmed && !primaryFunctions.includes(trimmed)) {
            onFunctionsChange([...primaryFunctions, trimmed])
        }
        setNewFunction('')
    }

    const removeFunction = (index: number) => {
        onFunctionsChange(primaryFunctions.filter((_, i) => i !== index))
    }

    // Filter suggestions based on search
    const filteredSuggestions = useMemo(() => {
        if (!searchTerm) return {}
        const term = searchTerm.toLowerCase()
        const filtered: { [key: string]: string[] } = {}
        
        Object.entries(SKILL_CATEGORIES).forEach(([category, categorySkills]) => {
            const matches = categorySkills.filter(
                skill => skill.toLowerCase().includes(term) && !skills.includes(skill)
            )
            if (matches.length > 0) {
                filtered[category] = matches
            }
        })
        
        return filtered
    }, [searchTerm, skills])

    const hasFilteredResults = Object.keys(filteredSuggestions).length > 0

    return (
        <div className="space-y-6">
            {/* Skills Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Technical & Professional Skills
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add skills that are relevant to your target roles
                    </p>
                </div>

                {/* Current Skills */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Your Skills ({skills.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 min-h-[60px]">
                            {skills.length === 0 ? (
                                <span className="text-sm text-muted-foreground">No skills added yet</span>
                            ) : (
                                skills.map((skill, index) => (
                                    <Badge key={index} variant="default" className="flex items-center gap-1 py-1">
                                        {skill}
                                        {!readOnly && (
                                            <button
                                                onClick={() => removeSkill(index)}
                                                className="ml-1 hover:text-destructive-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))
                            )}
                        </div>

                        {!readOnly && (
                            <div className="flex gap-2 mt-4">
                                <Input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                                    placeholder="Type a skill and press Enter"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => addSkill(newSkill)}
                                    disabled={!newSkill.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inferred Skills */}
                {inferredSkills.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                AI-Inferred Skills
                                <Badge variant="outline" className="ml-2 text-xs">
                                    Click to add
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-3">
                                These skills were inferred from your experience. Click to add them to your profile.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {inferredSkills.map((skill, index) => (
                                    <Badge 
                                        key={index} 
                                        variant="outline" 
                                        className="flex items-center gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                        onClick={() => !readOnly && promoteInferredSkill(skill)}
                                    >
                                        <Plus className="h-3 w-3" />
                                        {skill}
                                        {!readOnly && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeInferredSkill(skill) }}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Skill Suggestions */}
                {!readOnly && (
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Skill Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for skills..."
                                    className="pl-10"
                                />
                            </div>

                            {searchTerm && !hasFilteredResults && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    No suggestions found. You can still add &quot;{searchTerm}&quot; as a custom skill.
                                </p>
                            )}

                            {hasFilteredResults && (
                                <div className="space-y-3">
                                    {Object.entries(filteredSuggestions).map(([category, categorySkills]) => (
                                        <div key={category}>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {categorySkills.slice(0, 8).map(skill => (
                                                    <Badge
                                                        key={skill}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                        onClick={() => addSkill(skill)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!searchTerm && (
                                <Tabs defaultValue={Object.keys(SKILL_CATEGORIES)[0]}>
                                    <TabsList className="flex flex-wrap h-auto gap-1">
                                        {Object.keys(SKILL_CATEGORIES).map(category => (
                                            <TabsTrigger key={category} value={category} className="text-xs">
                                                {category}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {Object.entries(SKILL_CATEGORIES).map(([category, categorySkills]) => (
                                        <TabsContent key={category} value={category} className="mt-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {categorySkills.map(skill => {
                                                    const isAdded = skills.includes(skill)
                                                    return (
                                                        <Badge
                                                            key={skill}
                                                            variant={isAdded ? "secondary" : "outline"}
                                                            className={`cursor-pointer ${isAdded ? 'opacity-50' : 'hover:bg-primary hover:text-primary-foreground'}`}
                                                            onClick={() => !isAdded && addSkill(skill)}
                                                        >
                                                            {isAdded ? (
                                                                <Check className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <Plus className="h-3 w-3 mr-1" />
                                                            )}
                                                            {skill}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Primary Functions */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Primary Functions
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        What are your main job functions or specializations?
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {primaryFunctions.map((func, index) => (
                                <Badge key={index} variant="default" className="flex items-center gap-1 py-1">
                                    {func}
                                    {!readOnly && (
                                        <button
                                            onClick={() => removeFunction(index)}
                                            className="ml-1 hover:text-destructive-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </Badge>
                            ))}
                            {primaryFunctions.length === 0 && (
                                <span className="text-sm text-muted-foreground">No functions selected</span>
                            )}
                        </div>

                        {!readOnly && (
                            <>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {PRIMARY_FUNCTIONS.filter(f => !primaryFunctions.includes(f)).map(func => (
                                        <Badge
                                            key={func}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => addFunction(func)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {func}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        value={newFunction}
                                        onChange={(e) => setNewFunction(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFunction(newFunction))}
                                        placeholder="Add custom function"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addFunction(newFunction)}
                                        disabled={!newFunction.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
