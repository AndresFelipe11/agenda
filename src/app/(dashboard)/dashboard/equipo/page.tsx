import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { StaffForm } from "@/components/dashboard/staff-form";
import { Badge } from "@/components/ui/badge";

export default async function StaffPage() {
  const { tenant } = await requireTenant();
  const [staff, services] = await Promise.all([
    prisma.staff.findMany({
      where: { tenantId: tenant.id },
      include: { services: { include: { service: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Personas</p>
          <h1 className="text-4xl">Equipo</h1>
        </div>
        <StaffForm services={services.map((service) => ({ id: service.id, name: service.name }))} />
      </div>
      <div className="grid gap-4">
        {staff.map((person) => (
          <article key={person.id} className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl">{person.name}</h2>
                <p className="text-sm text-[var(--muted)]">{person.email}</p>
              </div>
              <Badge tone={person.isActive ? "teal" : "stone"}>
                {person.isActive ? "Activo" : "Pausado"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {person.services.map((row) => row.service.name).join(" · ") || "Sin servicios"}
            </p>
            <div className="mt-4">
              <StaffForm
                services={services.map((service) => ({ id: service.id, name: service.name }))}
                initial={{
                  id: person.id,
                  name: person.name,
                  email: person.email ?? "",
                  serviceIds: person.services.map((row) => row.serviceId),
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
