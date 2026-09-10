"use server";

import { BookingMode, BookingStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { generatePublicDaySlots } from "@/lib/booking/slots";
import {
  BookingError,
  createAppointmentBooking,
  createSessionBooking,
} from "@/lib/booking/create";
import { sendBookingConfirmation } from "@/lib/email";
import { bookingWhatsAppText, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getTenantWhatsApp } from "@/lib/tenant-whatsapp";

export async function getPublicTenant(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        include: {
          staff: { include: { staff: { include: { weeklyHours: true } } } },
          sessions: {
            where: { startsAt: { gt: new Date() } },
            include: {
              staff: true,
              bookings: {
                where: { status: { in: [BookingStatus.pending, BookingStatus.confirmed] } },
                select: { id: true },
              },
            },
            orderBy: { startsAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      staff: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      cutStyles: { where: { isActive: true }, orderBy: { name: "asc" } },
      gallery: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAvailableSlots(input: {
  slug: string;
  serviceId: string;
  staffId: string;
  date: string;
}) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: input.slug } });
  if (!tenant) return [];

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      tenantId: tenant.id,
      isActive: true,
      bookingMode: BookingMode.appointment,
    },
  });
  if (!service) return [];

  const staff = await prisma.staff.findFirst({
    where: { id: input.staffId, tenantId: tenant.id, isActive: true },
    include: { weeklyHours: true },
  });
  if (!staff) return [];

  const local = DateTime.fromISO(input.date, { zone: tenant.timezone });
  if (!local.isValid) return [];
  const dayStart = local.startOf("day").toUTC().toJSDate();
  const dayEnd = local.endOf("day").toUTC().toJSDate();

  const bookings = await prisma.booking.findMany({
    where: {
      staffId: staff.id,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
  });

  return generatePublicDaySlots({
    date: input.date,
    timezone: tenant.timezone,
    durationMin: service.durationMin,
    weeklyHours: staff.weeklyHours,
    bookings,
  });
}

export async function createPublicBooking(input: {
  slug: string;
  serviceId: string;
  staffId?: string;
  sessionId?: string;
  startsAtIso?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  customData: Record<string, string>;
}) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: input.slug } });
  if (!tenant) {
    return { ok: false as const, error: "Negocio no encontrado." };
  }

  try {
    const service = await prisma.service.findFirst({
      where: { id: input.serviceId, tenantId: tenant.id, isActive: true },
    });
    if (!service) {
      return { ok: false as const, error: "Servicio no disponible." };
    }

    const booking =
      service.bookingMode === BookingMode.session
        ? await createSessionBooking({
            tenantId: tenant.id,
            serviceId: service.id,
            sessionId: input.sessionId ?? "",
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            clientPhone: input.clientPhone,
            customData: input.customData,
          })
        : await createAppointmentBooking({
            tenantId: tenant.id,
            serviceId: service.id,
            staffId: input.staffId ?? "",
            startsAtIso: input.startsAtIso ?? "",
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            clientPhone: input.clientPhone,
            customData: input.customData,
          });

    await sendBookingConfirmation(booking);
    const custom = booking.customData as Record<string, string>;
    const whatsapp = await getTenantWhatsApp(booking.tenant.id);
    const whatsappUrl = whatsapp
      ? buildWhatsAppUrl(
          whatsapp,
          bookingWhatsAppText({
            tenantName: booking.tenant.name,
            timezone: booking.tenant.timezone,
            clientName: booking.clientName,
            clientPhone: booking.clientPhone,
            serviceName: booking.service.name,
            priceAmount: booking.service.priceAmount,
            startsAt: booking.startsAt,
            staffName: booking.staff?.name,
            cutStyle: custom.cut_style,
          }),
        )
      : "";
    return { ok: true as const, bookingId: booking.id, whatsappUrl };
  } catch (error) {
    const message =
      error instanceof BookingError ? error.message : "No se pudo crear la reserva.";
    return { ok: false as const, error: message };
  }
}
