import * as React from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

const variantClasses: Record<ButtonVariant, string> = {
  default: "btn btn-primary",
  destructive: "btn bg-destructive text-destructive-foreground",
  outline: "btn btn-secondary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  link: "inline-flex items-center text-primary",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "",
  sm: "px-3 py-2",
  lg: "px-6 py-3",
  icon: "btn-icon",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={cn(variantClasses[variant], sizeClasses[size], className)}
      ref={ref}
      {...props}
    />
  )
)

Button.displayName = "Button"

export { Button }
