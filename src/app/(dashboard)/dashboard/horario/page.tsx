import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ScheduleForm } from "@/components/dashboard/schedule-form";

export default async function SchedulePage() {
  const { tenant } = await requireTenant();
  const staff = await prisma.staff.findMany({
    where: { tenantId: tenant.id },
    include: { weeklyHours: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Disponibilidad</p>
        <h1 className="text-4xl">Horario semanal</h1>
        <p className="mt-2 text-[var(--muted)]">
          Los huecos de cita se generan a partir de este horario y la duración del servicio.
        </p>
      </div>
      <div className="grid gap-4">
        {staff.map((person) => (
          <ScheduleForm
            key={person.id}
            staffId={person.id}
            staffName={person.name}
            blocks={person.weeklyHours.map((block) => ({
              weekday: block.weekday,
              startMin: block.startMin,
              endMin: block.endMin,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
