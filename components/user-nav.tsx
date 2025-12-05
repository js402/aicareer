'use client'

import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { LogOut, User as UserIcon, Crown, Clock, Sparkles, FileText, Briefcase, Database } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { useCVStore } from "@/hooks/useCVStore"
import { BlueprintStatus } from "@/components/blueprint-status"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserNavProps {
    user: User
}

export function UserNav({ user }: UserNavProps) {
    const router = useRouter()
    const { hasProAccess, isTrialing } = useSubscription()

    const handleSignOut = async () => {
        // Clear CV data from local storage for security
        useCVStore.getState().clear()

        await supabase.auth.signOut()
        router.push('/')
    }

    const subscriptionBadge = hasProAccess ? (
        isTrialing ? (
            <Badge variant="outline" className="text-xs gap-1 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                <Clock className="h-3 w-3" />
                Trial
            </Badge>
        ) : (
            <Badge variant="outline" className="text-xs gap-1 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                <Crown className="h-3 w-3" />
                Pro
            </Badge>
        )
    ) : (
        <Badge variant="outline" className="text-xs text-muted-foreground">
            Free
        </Badge>
    )

    return (
        <nav className="flex items-center gap-2">
            <ModeToggle />

            {/* Desktop Navigation - visible on md and up */}
            <div className="hidden md:flex items-center gap-3">
                {/* Subscription Status */}
                {subscriptionBadge}

                {/* Blueprint Status */}
                <BlueprintStatus compact={true} />

                {/* Navigation Links */}
                <Link href="/analysis">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        My Analysis
                    </Button>
                </Link>

                <Link href="/cv-metadata">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Database className="h-4 w-4" />
                        Manage CV Data
                    </Button>
                </Link>

                <Link href="/positions">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        My Applications
                    </Button>
                </Link>

                {/* User Menu Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="hidden lg:inline-block">
                                {user.email?.split('@')[0]}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {user.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile Navigation - visible on sm and down */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="hidden sm:inline-block">
                                {user.email?.split('@')[0]}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {user.email}
                        </DropdownMenuLabel>
                        <div className="px-2 py-1.5">
                            {subscriptionBadge}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/analysis')} className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            My Analysis
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/cv-metadata')} className="gap-2">
                            <Database className="h-4 w-4" />
                            Manage CV Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/positions')} className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            My Applications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
