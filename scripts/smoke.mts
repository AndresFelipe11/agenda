import { BookingMode } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../src/lib/prisma.ts";
import {
  BookingError,
  createAppointmentBooking,
  createSessionBooking,
} from "../src/lib/booking/create.ts";

async function main() {
  const slug = `smoke-${Date.now()}`;
  const tenant = await prisma.tenant.create({
    data: {
      name: "Smoke Test",
      slug,
      timezone: "America/Bogota",
      template: "barber",
    },
  });

  const start = DateTime.now()
    .setZone(tenant.timezone)
    .plus({ days: 1 })
    .startOf("day")
    .set({ hour: 10, minute: 0 });

  const staff = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      name: "Alex",
      weeklyHours: {
        create: [{ weekday: start.weekday, startMin: 8 * 60, endMin: 20 * 60 }],
      },
    },
  });

  const appointment = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Corte",
      durationMin: 30,
      bookingMode: BookingMode.appointment,
      staff: { create: { staffId: staff.id } },
    },
  });

  const klass = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Taller",
      durationMin: 60,
      bookingMode: BookingMode.session,
      capacity: 1,
      staff: { create: { staffId: staff.id } },
    },
  });

  const first = await createAppointmentBooking({
    tenantId: tenant.id,
    serviceId: appointment.id,
    staffId: staff.id,
    startsAtIso: start.toUTC().toISO()!,
    clientName: "Ana",
    clientEmail: "ana@example.com",
    customData: {},
  });

  let overlapBlocked = false;
  try {
    await createAppointmentBooking({
      tenantId: tenant.id,
      serviceId: appointment.id,
      staffId: staff.id,
      startsAtIso: start.toUTC().toISO()!,
      clientName: "Bruno",
      clientEmail: "bruno@example.com",
      customData: {},
    });
  } catch (error) {
    overlapBlocked = error instanceof BookingError;
  }

  const sessionStart = start.plus({ hours: 3 });
  const session = await prisma.classSession.create({
    data: {
      tenantId: tenant.id,
      serviceId: klass.id,
      staffId: staff.id,
      startsAt: sessionStart.toUTC().toJSDate(),
      endsAt: sessionStart.plus({ minutes: 60 }).toUTC().toJSDate(),
      capacity: 1,
    },
  });

  await createSessionBooking({
    tenantId: tenant.id,
    serviceId: klass.id,
    sessionId: session.id,
    clientName: "Carla",
    clientEmail: "carla@example.com",
    customData: {},
  });

  let capacityBlocked = false;
  try {
    await createSessionBooking({
      tenantId: tenant.id,
      serviceId: klass.id,
      sessionId: session.id,
      clientName: "Diego",
      clientEmail: "diego@example.com",
      customData: {},
    });
  } catch (error) {
    capacityBlocked = error instanceof BookingError;
  }

  if (!first.id || !overlapBlocked || !capacityBlocked) {
    throw new Error(
      `Smoke falló: booking=${Boolean(first.id)} overlap=${overlapBlocked} cupo=${capacityBlocked}`,
    );
  }

  await prisma.tenant.delete({ where: { id: tenant.id } });
  console.log("Smoke OK: cita, solape bloqueado y cupo de sesión respetado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
