import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ServiceForm } from "@/components/dashboard/service-form";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { CustomField } from "@/lib/templates";

export default async function ServicesPage() {
  const { tenant } = await requireTenant();
  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id },
      include: { staff: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Catálogo</p>
          <h1 className="text-4xl">Servicios</h1>
        </div>
        <ServiceForm staff={staff.map((person) => ({ id: person.id, name: person.name }))} />
      </div>
      <div className="grid gap-4">
        {services.map((service) => (
          <article key={service.id} className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl">{service.name}</h2>
                <p className="text-sm text-[var(--muted)]">{service.description}</p>
              </div>
              <Badge tone={service.bookingMode === "session" ? "orange" : "teal"}>
                {service.bookingMode === "session" ? "Clase" : "Cita"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {service.durationMin} min · {formatPrice(service.priceAmount)}
              {service.bookingMode === "session" ? ` · cupo ${service.capacity}` : ""}
              {service.isActive ? "" : " · pausado"}
            </p>
            <div className="mt-4">
              <ServiceForm
                staff={staff.map((person) => ({ id: person.id, name: person.name }))}
                initial={{
                  id: service.id,
                  name: service.name,
                  description: service.description ?? "",
                  durationMin: service.durationMin,
                  priceAmount: service.priceAmount?.toString() ?? "",
                  bookingMode: service.bookingMode,
                  capacity: service.capacity,
                  customFields: (service.customFields as CustomField[]) ?? [],
                  staffIds: service.staff.map((row) => row.staffId),
                  isActive: service.isActive,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
