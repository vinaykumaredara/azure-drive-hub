import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button.constants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
/**
 * Minimal fallback buttonVariants export.
 * This provides a basic class string used by other UI components.
 * Replace with full class-variance-authority (cva) implementation if required.
 */
export const buttonVariants = (_opts = {}) => {
  // opts.variant, opts.size not used in fallback
  return "inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2";
};
