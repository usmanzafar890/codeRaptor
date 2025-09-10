import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BadgeButtonProps extends React.ComponentPropsWithoutRef<"button"> {}

const BadgeButton = React.forwardRef<HTMLButtonElement, BadgeButtonProps>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "ml-1 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-foreground opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none",
      className,
    )}
    {...props}
  >
    <X className="h-2.5 w-2.5" />
    <span className="sr-only">Remove</span>
  </button>
))
BadgeButton.displayName = "BadgeButton"

export { BadgeButton }
