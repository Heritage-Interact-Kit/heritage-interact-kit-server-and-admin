import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
  
  const variantClasses = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-200 text-gray-800",
    destructive: "bg-red-600 text-white",
    outline: "border border-gray-300 text-gray-700",
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  return (
    <span className={classes} {...props} />
  )
}

export { Badge } 