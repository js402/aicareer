'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { UserNav } from "@/components/user-nav"

export function Navbar() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between mx-auto px-4">
                <div className="flex items-center">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <span className="font-bold sm:inline-block">TechCareer.AI</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/features" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Features
                        </Link>
                        <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Pricing
                        </Link>
                        <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            About
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {!isLoading && (
                        user ? (
                            <UserNav user={user} />
                        ) : (
                            <nav className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => router.push('/auth')}>
                                    Sign In
                                </Button>
                                <Button size="sm" onClick={() => router.push('/')}>
                                    Get Started
                                </Button>
                            </nav>
                        )
                    )}
                </div>
            </div>
        </header>
    )
}
