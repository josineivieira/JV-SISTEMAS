import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "error"
  | "outline"
  | "success"
  | "warning"
  | "info"

const variantClasses: Record<BadgeVariant, string> = {
  default: "badge badge-info",
  secondary: "badge",
  destructive: "badge badge-error",
  error: "badge badge-error",
  outline: "badge",
  success: "badge badge-success",
  warning: "badge badge-warning",
  info: "badge badge-info",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn(variantClasses[variant], className)} {...props} />
}

export { Badge }
