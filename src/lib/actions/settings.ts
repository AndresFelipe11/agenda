"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { TIMEZONES } from "@/lib/templates";

export async function updateTenantSettings(formData: FormData) {
  const { tenant } = await requireTenant();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? tenant.timezone);
  if (!name) throw new Error("El nombre del negocio es obligatorio.");
  if (!TIMEZONES.includes(timezone)) throw new Error("Zona horaria no válida.");

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name, timezone },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ajustes");
}
