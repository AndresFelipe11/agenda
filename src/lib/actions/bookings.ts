"use server";

import { revalidatePath } from "next/cache";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { BookingError, createWalkInBooking } from "@/lib/booking/create";
import { isWalkIn } from "@/lib/booking/slots";

export async function confirmBooking(bookingId: string) {
  const { tenant } = await requireTenant();
  await prisma.booking.updateMany({
    where: { id: bookingId, tenantId: tenant.id, status: BookingStatus.pending },
    data: { status: BookingStatus.confirmed },
  });
  revalidatePath("/dashboard");
}

export async function cancelBooking(bookingId: string) {
  const { tenant } = await requireTenant();
  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      tenantId: tenant.id,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
    },
    data: { status: BookingStatus.cancelled },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sesiones");
  return { ok: true as const };
}

export async function occupySlot(input: {
  serviceId: string;
  staffId: string;
  startsAtIso: string;
  clientName?: string;
}) {
  const { tenant } = await requireTenant();
  try {
    await createWalkInBooking({
      tenantId: tenant.id,
      serviceId: input.serviceId,
      staffId: input.staffId,
      startsAtIso: input.startsAtIso,
      clientName: input.clientName,
    });
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof BookingError ? error.message : "No se pudo ocupar el horario.";
    return { ok: false as const, error: message };
  }
}

export async function releaseSlot(bookingId: string) {
  const { tenant } = await requireTenant();
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: tenant.id },
  });
  if (!booking || !isWalkIn(booking.customData)) {
    return { ok: false as const, error: "Ese bloqueo no existe." };
  }
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.cancelled },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}
