import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CommandCheckProps extends React.ComponentPropsWithoutRef<"svg"> {}

const CommandCheck = React.forwardRef<SVGSVGElement, CommandCheckProps>(({ className, ...props }, ref) => (
  <Check ref={ref} className={cn("ml-auto h-4 w-4", className)} {...props} />
))
CommandCheck.displayName = "CommandCheck"

export { CommandCheck }
