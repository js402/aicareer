'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Plus, Search, Loader2 } from "lucide-react"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { PositionCard } from "@/components/positions/position-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFetch } from "@/hooks/useFetch"
import { useState, useMemo } from "react"

interface Position {
    id: string
    company_name: string
    position_title: string
    location?: string
    match_score?: number
    status: string
    created_at: string
}

interface PositionsResponse {
    positions: Position[]
}

export default function PositionsPage() {
    useAuthGuard({ redirectTo: 'positions' })

    const [filterStatus, setFilterStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    
    const { data: response, isLoading } = useFetch<PositionsResponse>(
        '/api/job-positions'
    )

    const positions = response?.positions || []

    const filteredPositions = useMemo(() => {
        return positions.filter(position => {
            const matchesStatus = filterStatus === 'all' || position.status === filterStatus
            const matchesSearch =
                position.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                position.position_title.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesStatus && matchesSearch
        })
    }, [positions, filterStatus, searchQuery])

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
                        <p className="text-muted-foreground">
                            Track and manage your job applications and tailored CVs.
                        </p>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/analysis/job-match">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Position
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies or titles..."
                            className="pl-9 bg-white dark:bg-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="saved">Saved</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="interviewing">Interviewing</SelectItem>
                            <SelectItem value="offer">Offer Received</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredPositions.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredPositions.map(position => (
                            <PositionCard key={position.id} position={position} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="mb-4 inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                            <Plus className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No positions found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {searchQuery || filterStatus !== 'all'
                                ? "Try adjusting your filters to see more results."
                                : "Start by adding a job position you're interested in."}
                        </p>
                        {(searchQuery || filterStatus !== 'all') ? (
                            <Button variant="outline" onClick={() => {
                                setSearchQuery('')
                                setFilterStatus('all')
                            }}>
                                Clear Filters
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href="/analysis/job-match">Add Your First Position</Link>
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
