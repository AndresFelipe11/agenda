import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--silver)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20",
        className,
      )}
      {...props}
    />
  );
}
