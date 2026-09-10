import { DateTime } from "luxon";
import { BookingMode, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateSlotsForDay, slotExists } from "@/lib/booking/slots";
import type { CustomField } from "@/lib/templates";

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingError";
  }
}

function readCustomFields(value: unknown): CustomField[] {
  if (!Array.isArray(value)) return [];
  return value as CustomField[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string | undefined) {
  const email = (value ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!EMAIL_RE.test(email)) {
    throw new BookingError("El correo no es válido.");
  }
  return email;
}

function validateCustomData(fields: CustomField[], data: Record<string, string>) {
  const cleaned: Record<string, string> = {};
  const known = new Set(fields.map((field) => field.id));
  for (const field of fields) {
    const raw = (data[field.id] ?? "").trim();
    if (field.required && !raw) {
      throw new BookingError(`Completa el campo: ${field.label}`);
    }
    if (field.type === "select" && raw && field.options && !field.options.includes(raw)) {
      throw new BookingError(`Valor inválido en: ${field.label}`);
    }
    if (raw) cleaned[field.id] = raw;
  }
  for (const [key, value] of Object.entries(data)) {
    if (!known.has(key) && value.trim()) cleaned[key] = value.trim();
  }
  return cleaned;
}

export async function createAppointmentBooking(input: {
  tenantId: string;
  serviceId: string;
  staffId: string;
  startsAtIso: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  customData: Record<string, string>;
}) {
  const clientName = input.clientName.trim();
  const clientEmail = normalizeEmail(input.clientEmail);
  if (!clientName) {
    throw new BookingError("El nombre es obligatorio.");
  }

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) throw new BookingError("Negocio no encontrado.");

    const service = await tx.service.findFirst({
      where: {
        id: input.serviceId,
        tenantId: tenant.id,
        isActive: true,
        bookingMode: BookingMode.appointment,
      },
      include: { staff: true },
    });
    if (!service) throw new BookingError("Servicio no disponible.");

    const assigned = service.staff.some((row) => row.staffId === input.staffId);
    if (!assigned) throw new BookingError("Ese profesional no ofrece este servicio.");

    const staff = await tx.staff.findFirst({
      where: { id: input.staffId, tenantId: tenant.id, isActive: true },
      include: { weeklyHours: true },
    });
    if (!staff) throw new BookingError("Profesional no disponible.");

    const start = DateTime.fromISO(input.startsAtIso, { zone: "utc" });
    if (!start.isValid) throw new BookingError("Horario inválido.");
    const local = start.setZone(tenant.timezone);
    const date = local.toISODate();
    if (!date) throw new BookingError("Horario inválido.");

    const dayStart = local.startOf("day").toUTC().toJSDate();
    const dayEnd = local.endOf("day").toUTC().toJSDate();
    const bookings = await tx.booking.findMany({
      where: {
        staffId: staff.id,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
    });

    const slots = generateSlotsForDay({
      date,
      timezone: tenant.timezone,
      durationMin: service.durationMin,
      weeklyHours: staff.weeklyHours,
      bookings,
    });

    if (!slotExists(slots, start.toUTC().toISO()!)) {
      throw new BookingError("Ese horario ya no está disponible.");
    }

    const customData = validateCustomData(
      readCustomFields(service.customFields),
      input.customData,
    );

    const endsAt = start.plus({ minutes: service.durationMin }).toUTC().toJSDate();
    const conflict = await tx.booking.findFirst({
      where: {
        staffId: staff.id,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        startsAt: { lt: endsAt },
        endsAt: { gt: start.toUTC().toJSDate() },
      },
    });
    if (conflict) throw new BookingError("Ese horario acaba de ocuparse.");

    return tx.booking.create({
      data: {
        tenantId: tenant.id,
        serviceId: service.id,
        staffId: staff.id,
        startsAt: start.toUTC().toJSDate(),
        endsAt,
        status: BookingStatus.confirmed,
        clientName,
        clientEmail: clientEmail ?? "",
        clientPhone: input.clientPhone?.trim() || null,
        customData,
      },
      include: {
        service: true,
        staff: true,
        tenant: true,
      },
    });
  });
}

export async function createWalkInBooking(input: {
  tenantId: string;
  serviceId: string;
  staffId: string;
  startsAtIso: string;
  clientName?: string;
}) {
  const clientName = (input.clientName ?? "").trim() || "Presencial";

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) throw new BookingError("Negocio no encontrado.");

    const service = await tx.service.findFirst({
      where: {
        id: input.serviceId,
        tenantId: tenant.id,
        isActive: true,
        bookingMode: BookingMode.appointment,
      },
      include: { staff: true },
    });
    if (!service) throw new BookingError("Servicio no disponible.");

    const assigned = service.staff.some((row) => row.staffId === input.staffId);
    if (!assigned) throw new BookingError("Ese profesional no ofrece este servicio.");

    const staff = await tx.staff.findFirst({
      where: { id: input.staffId, tenantId: tenant.id, isActive: true },
    });
    if (!staff) throw new BookingError("Profesional no disponible.");

    const start = DateTime.fromISO(input.startsAtIso, { zone: "utc" });
    if (!start.isValid) throw new BookingError("Horario inválido.");
    const endsAt = start.plus({ minutes: service.durationMin }).toUTC().toJSDate();

    const conflict = await tx.booking.findFirst({
      where: {
        staffId: staff.id,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        startsAt: { lt: endsAt },
        endsAt: { gt: start.toUTC().toJSDate() },
      },
    });
    if (conflict) throw new BookingError("Ese horario ya está ocupado.");

    return tx.booking.create({
      data: {
        tenantId: tenant.id,
        serviceId: service.id,
        staffId: staff.id,
        startsAt: start.toUTC().toJSDate(),
        endsAt,
        status: BookingStatus.confirmed,
        clientName,
        clientEmail: "",
        customData: { origin: "walk_in" },
      },
    });
  });
}

export async function createSessionBooking(input: {
  tenantId: string;
  serviceId: string;
  sessionId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  customData: Record<string, string>;
}) {
  const clientName = input.clientName.trim();
  const clientEmail = normalizeEmail(input.clientEmail);
  if (!clientName) {
    throw new BookingError("El nombre es obligatorio.");
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findFirst({
      where: {
        id: input.sessionId,
        tenantId: input.tenantId,
        serviceId: input.serviceId,
      },
      include: { service: true, tenant: true, staff: true },
    });
    if (!session || !session.service.isActive) {
      throw new BookingError("Sesión no disponible.");
    }
    if (session.service.bookingMode !== BookingMode.session) {
      throw new BookingError("Este servicio no es una clase.");
    }
    if (session.startsAt <= new Date()) {
      throw new BookingError("Esa sesión ya comenzó.");
    }

    const taken = await tx.booking.count({
      where: {
        sessionId: session.id,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
      },
    });
    if (taken >= session.capacity) {
      throw new BookingError("No quedan cupos en esta sesión.");
    }

    const customData = validateCustomData(
      readCustomFields(session.service.customFields),
      input.customData,
    );

    return tx.booking.create({
      data: {
        tenantId: session.tenantId,
        serviceId: session.serviceId,
        staffId: session.staffId,
        sessionId: session.id,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        status: BookingStatus.confirmed,
        clientName,
        clientEmail: clientEmail ?? "",
        clientPhone: input.clientPhone?.trim() || null,
        customData,
      },
      include: {
        service: true,
        staff: true,
        tenant: true,
        session: true,
      },
    });
  });
}
