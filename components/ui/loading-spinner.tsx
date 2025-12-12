import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "md",
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {message && (
        <p className="text-muted-foreground mt-4">{message}</p>
      )}
    </div>
  )
}

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 flex items-center justify-center">
        <LoadingSpinner message={message} size="lg" />
      </main>
    </div>
  )
}
