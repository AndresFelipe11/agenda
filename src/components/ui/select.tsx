import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] shadow-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
