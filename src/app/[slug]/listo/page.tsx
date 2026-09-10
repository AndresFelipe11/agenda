import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WhatsAppNotify } from "@/components/booking/whatsapp-notify";
import { bookingWhatsAppText, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getTenantWhatsApp } from "@/lib/tenant-whatsapp";

export default async function BookingDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;
  if (!id) notFound();

  const booking = await prisma.booking.findFirst({
    where: { id, tenant: { slug } },
    include: { tenant: true, service: true, staff: true },
  });
  if (!booking) notFound();

  const when = DateTime.fromJSDate(booking.startsAt, { zone: "utc" })
    .setZone(booking.tenant.timezone)
    .setLocale("es")
    .toFormat("cccc d 'de' LLLL, HH:mm");

  const custom = booking.customData as Record<string, string>;
  const whatsapp = await getTenantWhatsApp(booking.tenant.id);
  const whatsappUrl = whatsapp
    ? buildWhatsAppUrl(
        whatsapp,
        bookingWhatsAppText({
          tenantName: booking.tenant.name,
          timezone: booking.tenant.timezone,
          clientName: booking.clientName,
          clientPhone: booking.clientPhone,
          serviceName: booking.service.name,
          priceAmount: booking.service.priceAmount,
          startsAt: booking.startsAt,
          staffName: booking.staff?.name,
          cutStyle: custom.cut_style,
        }),
      )
    : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="barber-stripe mb-8 rounded-full" />
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
        {booking.tenant.name}
      </p>
      <h1 className="mt-3 text-4xl">Reserva confirmada</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        {booking.clientName}, tu {booking.service.name} quedó para <strong className="text-[var(--foreground)]">{when}</strong>
        {booking.staff ? ` con ${booking.staff.name}` : ""}.
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Anota el horario. Si WhatsApp no se abrió, toca el botón para avisarle al barbero.
      </p>
      {whatsappUrl ? <WhatsAppNotify url={whatsappUrl} /> : null}
      <Link href={`/${slug}`} className="mt-8 block text-[var(--blue)] underline">
        Reservar otra vez
      </Link>
    </main>
  );
}
