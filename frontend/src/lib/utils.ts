import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type VariantProps<T extends { variants?: Record<string, Record<string, string>> }> = T extends {
  variants: infer V
}
  ? {
      [K in keyof V]?: V[K] extends Record<string, string> ? keyof V[K] : string
    }
  : Record<string, unknown>

export type CvaOptions = {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export function cva(base: string, options: CvaOptions = {}) {
  const { variants = {}, defaultVariants = {} } = options

  const variantClassName = (props: Record<string, string | undefined> = {}) => {
    const classes = [base]

    for (const key in variants) {
      const variantValue = props[key] ?? defaultVariants[key]
      if (variantValue && variants[key]?.[variantValue]) {
        classes.push(variants[key][variantValue])
      }
    }

    if (props.className) {
      classes.push(props.className)
    }

    return cn(classes.join(" "))
  }

  return Object.assign(variantClassName, {
    variants,
    defaultVariants,
  })
}