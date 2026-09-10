import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--silver)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20",
        className,
      )}
      {...props}
    />
  );
}
