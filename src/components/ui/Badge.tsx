import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-emerald-50 text-emerald-600": variant === "success",
          "bg-amber-50 text-amber-600": variant === "warning",
          "bg-red-50 text-red-600": variant === "danger",
          "bg-blue-50 text-blue-600": variant === "info",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
