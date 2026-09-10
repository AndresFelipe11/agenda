import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTenant } from "@/lib/actions/public";
import { PublicShop } from "@/components/booking/public-shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) return { title: "Página no encontrada" };
  return {
    title: tenant.name,
    description: `Reserva tu corte en ${tenant.name}. Elige el que te gusta.`,
  };
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) notFound();
  return <PublicShop slug={slug} />;
}
