"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, Images, Layers3, LogOut, Settings2, Users } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Calendario", icon: CalendarDays },
  { href: "/dashboard/cortes", label: "Cortes y fotos", icon: Images },
  { href: "/dashboard/servicios", label: "Servicios", icon: Layers3 },
  { href: "/dashboard/equipo", label: "Equipo", icon: Users },
  { href: "/dashboard/horario", label: "Horario", icon: Clock3 },
  { href: "/dashboard/ajustes", label: "Ajustes", icon: Settings2 },
];

export function DashboardNav({
  tenantName,
  slug,
}: {
  tenantName: string;
  slug: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-[#111111] px-4 py-6 text-white">
      <div className="px-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Barbería</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          {tenantName}
        </p>
        <Link
          href={`/${slug}`}
          className="text-xs text-white/70 underline"
          target="_blank"
        >
          Página de reservas
        </Link>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
