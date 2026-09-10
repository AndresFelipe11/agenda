import type { Prisma } from "@prisma/client";
import { CLASSIC_CUT_NAME, VIP_CUT_NAME } from "@/lib/barber/catalog";
import { getTemplate } from "@/lib/templates";

export async function seedBarberServices(tx: Prisma.TransactionClient, tenantId: string) {
  const template = getTemplate("barber");
  const wanted = template.services.filter((service) =>
    [CLASSIC_CUT_NAME, VIP_CUT_NAME, "Barba"].includes(service.name),
  );
  const staff = await tx.staff.findMany({ where: { tenantId } });
  const existing = await tx.service.findMany({
    where: { tenantId },
  });

  const renamed = existing.find((service) => service.name === "Corte" || service.name === CLASSIC_CUT_NAME);
  const classic = wanted.find((service) => service.name === CLASSIC_CUT_NAME);
  if (renamed && classic) {
    await tx.service.update({
      where: { id: renamed.id },
      data: {
        name: classic.name,
        description: classic.description ?? "",
        durationMin: classic.durationMin,
        priceAmount: classic.priceAmount ?? 20000,
        customFields: classic.customFields,
      },
    });
  }

  const current = await tx.service.findMany({ where: { tenantId } });
  const have = new Set(current.map((service) => service.name));
  const staffIds = staff.map((person) => ({ staffId: person.id }));

  for (const service of wanted) {
    if (have.has(service.name)) {
      const row = current.find((item) => item.name === service.name);
      if (row) {
        await tx.service.update({
          where: { id: row.id },
          data: {
            description: service.description ?? "",
            durationMin: service.durationMin,
            priceAmount: service.priceAmount ?? null,
            customFields: service.customFields,
          },
        });
      }
      continue;
    }
    await tx.service.create({
      data: {
        tenantId,
        name: service.name,
        description: service.description ?? "",
        durationMin: service.durationMin,
        priceAmount: service.priceAmount ?? 0,
        bookingMode: "appointment",
        capacity: 1,
        customFields: service.customFields,
        staff: { create: staffIds },
      },
    });
  }
}
