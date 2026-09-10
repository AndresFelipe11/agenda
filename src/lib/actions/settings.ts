"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { TIMEZONES } from "@/lib/templates";
import { setTenantWhatsApp } from "@/lib/tenant-whatsapp";

export async function updateTenantSettings(formData: FormData) {
  const { tenant } = await requireTenant();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? tenant.timezone);
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (!name) throw new Error("El nombre del negocio es obligatorio.");
  if (!TIMEZONES.includes(timezone)) throw new Error("Zona horaria no válida.");

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name, timezone },
  });
  await setTenantWhatsApp(tenant.id, whatsapp || null);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ajustes");
}
