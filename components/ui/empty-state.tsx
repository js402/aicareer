import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: () => void
  actionLabel?: string
  actionHref?: string
  secondaryAction?: () => void
  secondaryActionLabel?: string
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  secondaryAction,
  secondaryActionLabel,
  className,
  children
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <div className="mb-4 inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800">
            <Icon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {description}
          </p>
          {children || (
            <div className="flex gap-3 justify-center">
              {action && actionLabel && (
                <Button onClick={action}>
                  {actionLabel}
                </Button>
              )}
              {actionHref && actionLabel && (
                <Button asChild>
                  <a href={actionHref}>{actionLabel}</a>
                </Button>
              )}
              {secondaryAction && secondaryActionLabel && (
                <Button onClick={secondaryAction} variant="outline">
                  {secondaryActionLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
