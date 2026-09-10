import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:bg-[#b51a21]",
        secondary: "bg-[var(--blue)] text-white hover:bg-[#174a8c]",
        outline:
          "border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:bg-white/5",
        ghost: "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]",
        danger: "bg-[#d21f27] text-white hover:bg-[#b51a21]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
