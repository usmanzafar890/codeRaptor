import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonArrowProps extends React.ComponentPropsWithoutRef<"svg"> {}

const ButtonArrow = React.forwardRef<SVGSVGElement, ButtonArrowProps>(({ className, ...props }, ref) => (
  <ChevronDown ref={ref} className={cn("h-4 w-4 shrink-0 opacity-50", className)} {...props} />
))
ButtonArrow.displayName = "ButtonArrow"

export { ButtonArrow }
