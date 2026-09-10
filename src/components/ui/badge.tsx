import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "blue",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "teal" | "stone" | "orange" | "amber" | "gold" | "red" | "blue";
}) {
  const tones = {
    teal: "bg-[var(--blue)]/10 text-[var(--blue)]",
    stone: "bg-black/5 text-[var(--muted)]",
    orange: "bg-[var(--accent)]/10 text-[var(--accent)]",
    amber: "bg-[var(--blue)]/10 text-[var(--blue)]",
    gold: "bg-[var(--blue)]/10 text-[var(--blue)]",
    red: "bg-[var(--accent)]/10 text-[var(--accent)]",
    blue: "bg-[var(--blue)]/10 text-[var(--blue)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
