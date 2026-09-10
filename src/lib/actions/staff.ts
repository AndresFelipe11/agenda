"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export async function upsertStaff(formData: FormData) {
  const { tenant } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const serviceIds = formData.getAll("serviceIds").map(String);
  const isActive = formData.get("isActive") !== "false";

  if (!name) throw new Error("El nombre es obligatorio.");

  if (id) {
    const existing = await prisma.staff.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) throw new Error("Profesional no encontrado.");
    await prisma.staff.update({
      where: { id },
      data: {
        name,
        email: email || null,
        isActive,
        services: {
          deleteMany: {},
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
    });
  } else {
    await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name,
        email: email || null,
        isActive,
        weeklyHours: {
          create: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
            weekday,
            startMin: 9 * 60,
            endMin: 18 * 60,
          })),
        },
        services: {
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
    });
  }

  revalidatePath("/dashboard/equipo");
  revalidatePath("/dashboard/horario");
}

export async function toggleStaff(staffId: string, isActive: boolean) {
  const { tenant } = await requireTenant();
  await prisma.staff.updateMany({
    where: { id: staffId, tenantId: tenant.id },
    data: { isActive },
  });
  revalidatePath("/dashboard/equipo");
}
