'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { User, LogOut, LogIn, Sparkles, Menu, X, FileText, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Navbar() {
    const pathname = usePathname()
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        // Check current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const navItems = [
        { name: 'Home', href: '/' },
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
    ]

    const protectedItems = [
        { name: 'My CVs', href: '/cv-metadata', icon: FileText },
        { name: 'My Applications', href: '/positions', icon: FileText },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                CV Career Insights
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {user && protectedItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1",
                                    pathname === item.href
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-700 dark:text-slate-300"
                                )}
                            >
                                {item.icon && <item.icon className="h-4 w-4" />}
                                {item.name}
                            </Link>
                        ))}

                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                                    pathname === item.href
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-700 dark:text-slate-300"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth & Actions */}
                    <div className="flex items-center gap-3">
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2">
                                                    <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        {user.email?.split('@')[0]}
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>
                                                    <div className="flex flex-col space-y-1">
                                                        <p className="text-sm font-medium leading-none">{user.email?.split('@')[0]}</p>
                                                        <p className="text-xs leading-none text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href="/pricing" className="cursor-pointer">
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        <span>Subscription</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400">
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="hidden md:inline-flex gap-2"
                                    >
                                        <Link href="/auth">
                                            <LogIn className="h-4 w-4" />
                                            Sign In
                                        </Link>
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden pt-4 pb-3 border-t border-slate-200 dark:border-slate-800 mt-3">
                        <div className="space-y-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "block py-2 text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                                        pathname === item.href
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-slate-700 dark:text-slate-300"
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}

                            {user && protectedItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "block py-2 text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2",
                                        pathname === item.href
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-slate-700 dark:text-slate-300"
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    {item.name}
                                </Link>
                            ))}

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                                {user ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 py-2">
                                            <User className="h-4 w-4" />
                                            <span>{user.email}</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                handleSignOut()
                                                setIsMenuOpen(false)
                                            }}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full"
                                        asChild
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Link href="/auth">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Sign In
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}