import Link from "next/link";
import { DateTime } from "luxon";
import { BookingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { WeekCalendar } from "@/components/dashboard/week-calendar";

function weekStartFromParam(week: string | undefined, timezone: string) {
  const base = week
    ? DateTime.fromISO(week, { zone: timezone })
    : DateTime.now().setZone(timezone);
  const valid = base.isValid ? base : DateTime.now().setZone(timezone);
  return valid.startOf("week");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { tenant } = await requireTenant();
  const params = await searchParams;
  const start = weekStartFromParam(params.week, tenant.timezone);
  const end = start.plus({ days: 7 });
  const days = Array.from({ length: 7 }, (_, index) => start.plus({ days: index }).toISODate()).filter(
    Boolean,
  ) as string[];

  const [bookings, staff, services] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startsAt: {
          gte: start.toUTC().toJSDate(),
          lt: end.toUTC().toJSDate(),
        },
      },
      include: { service: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: { weeklyHours: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        bookingMode: BookingMode.appointment,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Calendario</p>
          <h1 className="text-4xl">Agenda de la semana</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            href={`/dashboard?week=${start.minus({ weeks: 1 }).toISODate()}`}
          >
            Semana anterior
          </Link>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            href="/dashboard"
          >
            Hoy
          </Link>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            href={`/dashboard?week=${start.plus({ weeks: 1 }).toISODate()}`}
          >
            Siguiente
          </Link>
          <CopyLinkButton path={`/${tenant.slug}`} />
        </div>
      </div>

      <WeekCalendar
        timezone={tenant.timezone}
        days={days}
        staff={staff.map((person) => ({
          id: person.id,
          name: person.name,
          weeklyHours: person.weeklyHours.map((block) => ({
            weekday: block.weekday,
            startMin: block.startMin,
            endMin: block.endMin,
          })),
        }))}
        services={services.map((service) => ({
          id: service.id,
          name: service.name,
          durationMin: service.durationMin,
        }))}
        bookings={bookings.map((booking) => ({
          id: booking.id,
          startsAt: booking.startsAt.toISOString(),
          endsAt: booking.endsAt.toISOString(),
          status: booking.status,
          clientName: booking.clientName,
          serviceName: booking.service.name,
          staffId: booking.staffId,
          customData: booking.customData,
        }))}
      />
    </div>
  );
}
