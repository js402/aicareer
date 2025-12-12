import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AlertVariant = "success" | "error" | "warning" | "info"

interface StatusAlertProps {
  variant: AlertVariant
  title?: string
  message: string
  className?: string
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50/50 dark:bg-green-950/20",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-700 dark:text-green-300",
    messageColor: "text-green-600 dark:text-green-400"
  },
  error: {
    icon: XCircle,
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50/50 dark:bg-red-950/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-700 dark:text-red-300",
    messageColor: "text-red-600 dark:text-red-400"
  },
  warning: {
    icon: AlertCircle,
    borderColor: "border-yellow-200 dark:border-yellow-800",
    bgColor: "bg-yellow-50/50 dark:bg-yellow-950/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    titleColor: "text-yellow-700 dark:text-yellow-300",
    messageColor: "text-yellow-600 dark:text-yellow-400"
  },
  info: {
    icon: Info,
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-700 dark:text-blue-300",
    messageColor: "text-blue-600 dark:text-blue-400"
  }
}

export function StatusAlert({ variant, title, message, className }: StatusAlertProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Card className={cn(config.borderColor, config.bgColor, className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.iconBg)}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div>
            {title && (
              <p className={cn("font-semibold", config.titleColor)}>{title}</p>
            )}
            <p className={cn("text-sm", config.messageColor)}>{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
