import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { DeleteSessionButton, SessionForm } from "@/components/dashboard/session-form";

export default async function SessionsPage() {
  const { tenant } = await requireTenant();
  const [services, staff, sessions] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, bookingMode: "session", isActive: true },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, isActive: true },
    }),
    prisma.classSession.findMany({
      where: { tenantId: tenant.id, startsAt: { gte: DateTime.now().minus({ days: 1 }).toJSDate() } },
      include: {
        service: true,
        staff: true,
        bookings: { where: { status: { in: ["pending", "confirmed"] } } },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-teal-800">Clases</p>
        <h1 className="text-4xl">Sesiones</h1>
        <p className="mt-2 text-stone-600">
          Publica fechas con cupo. Solo aplica a servicios en modo clase.
        </p>
      </div>
      <SessionForm
        services={services.map((service) => ({
          id: service.id,
          name: service.name,
          capacity: service.capacity,
        }))}
        staff={staff.map((person) => ({ id: person.id, name: person.name }))}
      />
      <div className="grid gap-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-stone-600">Aún no hay sesiones futuras.</p>
        ) : (
          sessions.map((session) => {
            const start = DateTime.fromJSDate(session.startsAt, { zone: "utc" })
              .setZone(tenant.timezone)
              .setLocale("es");
            return (
              <article
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5"
              >
                <div>
                  <h2 className="text-xl">{session.service.name}</h2>
                  <p className="text-sm text-stone-600">
                    {start.toFormat("cccc d LLLL, HH:mm")}
                    {session.staff ? ` · ${session.staff.name}` : ""}
                  </p>
                  <p className="text-sm text-stone-500">
                    {session.bookings.length} / {session.capacity} plazas
                  </p>
                </div>
                <DeleteSessionButton id={session.id} />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
