import type { Metadata } from "next";
import Link from "next/link";
import { getDefaultPublicTenantSlug } from "@/lib/actions/public";
import { PublicShop } from "@/components/booking/public-shop";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getDefaultPublicTenantSlug();
  if (!tenant) return { title: "Reserva tu corte" };
  return {
    title: tenant.name,
    description: `Reserva tu corte en ${tenant.name}. Elige el que te gusta. No necesitas cuenta.`,
  };
}

export default async function HomePage() {
  const tenant = await getDefaultPublicTenantSlug();
  if (tenant) {
    return <PublicShop slug={tenant.slug} />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="barber-stripe mb-8 rounded-full" />
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--accent)]">Barbería</p>
      <h1 className="mt-4 text-4xl">Reserva tu corte</h1>
      <p className="mt-2 text-[var(--muted)]">
        El cliente no necesita cuenta. El barbero todavía no abrió la agenda pública.
      </p>
      <Link
        href="/register"
        className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white"
      >
        Soy el barbero — abrir mi espacio
      </Link>
    </main>
  );
}
