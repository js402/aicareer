'use client'

import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { LogOut, User as UserIcon, Crown, Clock, Sparkles, Briefcase, Database, Sun, Moon, Monitor } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { useCVStore } from "@/hooks/useCVStore"
import { useTheme } from "next-themes"
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
    const { setTheme } = useTheme()

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
            {/* Desktop Navigation - visible on md and up */}
            <div className="hidden md:flex items-center gap-3">
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
                            {subscriptionBadge}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Theme</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Monitor className="mr-2 h-4 w-4" />
                            System
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>
                            {user.email}
                        </DropdownMenuLabel>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile Navigation - visible on sm and down */}
            <div className="md:hidden flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="hidden sm:inline-block">
                                {user.email?.split('@')[0]}
                            </span>
                            {subscriptionBadge}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/positions')} className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            My Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/cv-metadata')} className="gap-2">
                            <Database className="h-4 w-4" />
                            Manage CV Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/analysis')} className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            My Analysis
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Theme</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Monitor className="mr-2 h-4 w-4" />
                            System
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>
                            {user.email}
                        </DropdownMenuLabel>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
