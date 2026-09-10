"use server";

import { revalidatePath } from "next/cache";
import { BookingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import type { CustomField } from "@/lib/templates";

export async function upsertService(formData: FormData) {
  const { tenant } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMin = Number(formData.get("durationMin") ?? 30);
  const priceRaw = String(formData.get("priceAmount") ?? "").trim();
  const bookingMode =
    String(formData.get("bookingMode") ?? "appointment") === "session"
      ? BookingMode.session
      : BookingMode.appointment;
  const capacity = Number(formData.get("capacity") ?? (bookingMode === "session" ? 8 : 1));
  const staffIds = formData.getAll("staffIds").map(String);
  const customFields = parseCustomFields(formData);

  if (!name || durationMin < 5) {
    throw new Error("Nombre y duración son obligatorios.");
  }

  const data = {
    name,
    description: description || null,
    durationMin,
    priceAmount: priceRaw ? Number(priceRaw) : null,
    bookingMode,
    capacity: bookingMode === "session" ? Math.max(1, capacity) : 1,
    customFields,
    isActive: formData.get("isActive") !== "false",
  };

  if (id) {
    const existing = await prisma.service.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) throw new Error("Servicio no encontrado.");
    await prisma.service.update({
      where: { id },
      data: {
        ...data,
        staff: {
          deleteMany: {},
          create: staffIds.map((staffId) => ({ staffId })),
        },
      },
    });
  } else {
    await prisma.service.create({
      data: {
        ...data,
        tenantId: tenant.id,
        staff: {
          create: staffIds.map((staffId) => ({ staffId })),
        },
      },
    });
  }

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard");
}

export async function toggleService(serviceId: string, isActive: boolean) {
  const { tenant } = await requireTenant();
  await prisma.service.updateMany({
    where: { id: serviceId, tenantId: tenant.id },
    data: { isActive },
  });
  revalidatePath("/dashboard/servicios");
}

function parseCustomFields(formData: FormData): CustomField[] {
  const raw = String(formData.get("customFields") ?? "[]");
  try {
    const parsed = JSON.parse(raw) as CustomField[];
    return parsed
      .filter((field) => field.label?.trim())
      .map((field, index) => ({
        id: field.id || `field_${index + 1}`,
        label: field.label.trim(),
        type: field.type === "select" ? "select" : "text",
        required: Boolean(field.required),
        options:
          field.type === "select"
            ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
            : undefined,
      }));
  } catch {
    return [];
  }
}
