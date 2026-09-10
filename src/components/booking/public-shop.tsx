import { notFound } from "next/navigation";
import { getPublicTenant } from "@/lib/actions/public";
import { prisma } from "@/lib/prisma";
import { seedCutStyles } from "@/lib/barber/seed-styles";
import { seedBarberServices } from "@/lib/barber/seed-services";
import { BarberShop } from "@/components/barber/barber-shop";
import { BookingWizard, type PublicService } from "@/components/booking/booking-wizard";

function toPublicServices(
  tenant: NonNullable<Awaited<ReturnType<typeof getPublicTenant>>>,
): PublicService[] {
  return tenant.services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    durationMin: service.durationMin,
    priceAmount: service.priceAmount,
    bookingMode: service.bookingMode,
    customFields: service.customFields,
    staff: service.staff.map((row) => ({
      staff: {
        id: row.staff.id,
        name: row.staff.name,
        isActive: row.staff.isActive,
        weeklyHours: row.staff.weeklyHours.map((block) => ({
          weekday: block.weekday,
          startMin: block.startMin,
          endMin: block.endMin,
        })),
      },
    })),
    sessions: service.sessions.map((session) => ({
      id: session.id,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      capacity: session.capacity,
      staff: session.staff ? { name: session.staff.name } : null,
      bookings: session.bookings.map((booking) => ({ id: booking.id })),
    })),
  }));
}

export async function PublicShop({ slug }: { slug: string }) {
  let tenant = await getPublicTenant(slug);
  if (!tenant) notFound();
  if (tenant.template === "barber") {
    await seedBarberServices(prisma, tenant.id);
    await seedCutStyles(prisma, tenant.id);
    tenant = await getPublicTenant(slug);
    if (!tenant) notFound();
  }
  const services = toPublicServices(tenant);

  return (
    <>
      <div className="barber-stripe" />
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
        {tenant.template === "barber" ? (
          <BarberShop
            shopName={tenant.name}
            slug={tenant.slug}
            timezone={tenant.timezone}
            services={services}
            styles={tenant.cutStyles.map((style) => ({
              id: style.id,
              name: style.name,
              description: style.description,
              category: style.category,
              headShapes: style.headShapes,
              imagePath: style.imagePath,
            }))}
            gallery={tenant.gallery.map((photo) => ({
              id: photo.id,
              imagePath: photo.imagePath,
              caption: photo.caption,
            }))}
          />
        ) : (
          <>
            <h1 className="text-5xl">{tenant.name}</h1>
            <p className="mt-2 text-[var(--muted)]">Elige un servicio y confirma tu reserva.</p>
            <div className="mt-10 max-w-2xl">
              <BookingWizard slug={tenant.slug} timezone={tenant.timezone} services={services} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
