"use server";

import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export async function createClassSession(formData: FormData) {
  const { tenant } = await requireTenant();
  const serviceId = String(formData.get("serviceId") ?? "");
  const staffId = String(formData.get("staffId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const capacity = Number(formData.get("capacity") ?? 8);

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId: tenant.id,
      bookingMode: "session",
      isActive: true,
    },
  });
  if (!service) throw new Error("Elige un servicio de tipo clase.");

  const start = DateTime.fromISO(`${date}T${time}`, { zone: tenant.timezone });
  if (!start.isValid) throw new Error("Fecha u hora inválida.");
  if (start.toUTC().toJSDate() <= new Date()) {
    throw new Error("La sesión debe ser en el futuro.");
  }

  let staffConnect: string | null = null;
  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: tenant.id, isActive: true },
    });
    if (!staff) throw new Error("Profesional no encontrado.");
    staffConnect = staff.id;
  }

  await prisma.classSession.create({
    data: {
      tenantId: tenant.id,
      serviceId: service.id,
      staffId: staffConnect,
      startsAt: start.toUTC().toJSDate(),
      endsAt: start.plus({ minutes: service.durationMin }).toUTC().toJSDate(),
      capacity: Math.max(1, capacity || service.capacity),
    },
  });

  revalidatePath("/dashboard/sesiones");
}

export async function deleteClassSession(sessionId: string) {
  const { tenant } = await requireTenant();
  const session = await prisma.classSession.findFirst({
    where: { id: sessionId, tenantId: tenant.id },
    include: { bookings: true },
  });
  if (!session) throw new Error("Sesión no encontrada.");
  const active = session.bookings.filter((booking) => booking.status !== "cancelled");
  if (active.length > 0) {
    throw new Error("No se puede eliminar: ya hay reservas en esta sesión.");
  }
  await prisma.classSession.delete({ where: { id: sessionId } });
  revalidatePath("/dashboard/sesiones");
}
