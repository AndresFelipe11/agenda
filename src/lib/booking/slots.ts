import { DateTime } from "luxon";
import type { Booking, WeeklyAvailability } from "@prisma/client";

export type Slot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export function toTenantDateTime(isoOrDate: Date | string, timezone: string) {
  if (typeof isoOrDate === "string") {
    return DateTime.fromISO(isoOrDate, { zone: timezone });
  }
  return DateTime.fromJSDate(isoOrDate, { zone: "utc" }).setZone(timezone);
}

export function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB;
}

export function generateSlotsForDay(input: {
  date: string;
  timezone: string;
  durationMin: number;
  weeklyHours: Pick<WeeklyAvailability, "weekday" | "startMin" | "endMin">[];
  bookings: Pick<Booking, "startsAt" | "endsAt" | "status">[];
  now?: DateTime;
}): Slot[] {
  const { date, timezone, durationMin, weeklyHours, bookings } = input;
  const day = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!day.isValid) return [];

  const now = input.now ?? DateTime.now().setZone(timezone);
  const hours = weeklyHours.filter((block) => block.weekday === day.weekday);
  const busy = bookings.filter((booking) =>
    ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number]),
  );

  const slots: Slot[] = [];

  for (const block of hours) {
    let cursor = day.plus({ minutes: block.startMin });
    const blockEnd = day.plus({ minutes: block.endMin });

    while (cursor.plus({ minutes: durationMin }) <= blockEnd) {
      const slotEnd = cursor.plus({ minutes: durationMin });
      const startsAt = cursor.toUTC().toJSDate();
      const endsAt = slotEnd.toUTC().toJSDate();
      const isFuture = cursor > now;
      const hasConflict = busy.some((booking) =>
        overlaps(startsAt, endsAt, booking.startsAt, booking.endsAt),
      );

      if (isFuture && !hasConflict) {
        slots.push({
          startsAt: cursor.toUTC().toISO()!,
          endsAt: slotEnd.toUTC().toISO()!,
          label: cursor.toFormat("HH:mm"),
        });
      }

      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  return slots;
}

export function slotExists(slots: Slot[], startsAtIso: string) {
  return slots.some((slot) => slot.startsAt === startsAtIso);
}

export type PublicDaySlot = Slot & {
  status: "available" | "occupied" | "past";
};

export function generatePublicDaySlots(input: {
  date: string;
  timezone: string;
  durationMin: number;
  weeklyHours: Pick<WeeklyAvailability, "weekday" | "startMin" | "endMin">[];
  bookings: Pick<Booking, "startsAt" | "endsAt" | "status">[];
  now?: DateTime;
}): PublicDaySlot[] {
  const { date, timezone, durationMin, weeklyHours, bookings } = input;
  const day = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!day.isValid) return [];

  const now = input.now ?? DateTime.now().setZone(timezone);
  const hours = weeklyHours.filter((block) => block.weekday === day.weekday);
  const busy = bookings.filter((booking) =>
    ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number]),
  );

  const slots: PublicDaySlot[] = [];

  for (const block of hours) {
    let cursor = day.plus({ minutes: block.startMin });
    const blockEnd = day.plus({ minutes: block.endMin });

    while (cursor.plus({ minutes: durationMin }) <= blockEnd) {
      const slotEnd = cursor.plus({ minutes: durationMin });
      const startsAt = cursor.toUTC().toJSDate();
      const endsAt = slotEnd.toUTC().toJSDate();
      const occupied = busy.some((booking) =>
        overlaps(startsAt, endsAt, booking.startsAt, booking.endsAt),
      );
      const past = cursor <= now;
      slots.push({
        startsAt: cursor.toUTC().toISO()!,
        endsAt: slotEnd.toUTC().toISO()!,
        label: cursor.toFormat("HH:mm"),
        status: occupied ? "occupied" : past ? "past" : "available",
      });
      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  return slots;
}

export type GridSlot<T> = Slot & {
  booking: T | null;
};

export function generateDayGrid<T extends { startsAt: Date; endsAt: Date; status: string }>(input: {
  date: string;
  timezone: string;
  durationMin: number;
  weeklyHours: Pick<WeeklyAvailability, "weekday" | "startMin" | "endMin">[];
  bookings: T[];
}): GridSlot<T>[] {
  const { date, timezone, durationMin, weeklyHours, bookings } = input;
  const day = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!day.isValid) return [];

  const hours = weeklyHours.filter((block) => block.weekday === day.weekday);
  const busy = bookings.filter((booking) =>
    ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number]),
  );

  const slots: GridSlot<T>[] = [];

  for (const block of hours) {
    let cursor = day.plus({ minutes: block.startMin });
    const blockEnd = day.plus({ minutes: block.endMin });

    while (cursor.plus({ minutes: durationMin }) <= blockEnd) {
      const slotEnd = cursor.plus({ minutes: durationMin });
      const startsAt = cursor.toUTC().toJSDate();
      const endsAt = slotEnd.toUTC().toJSDate();
      const booking =
        busy.find((item) => overlaps(startsAt, endsAt, item.startsAt, item.endsAt)) ?? null;

      slots.push({
        startsAt: cursor.toUTC().toISO()!,
        endsAt: slotEnd.toUTC().toISO()!,
        label: cursor.toFormat("HH:mm"),
        booking,
      });

      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  return slots;
}

export function isWalkIn(customData: unknown) {
  if (!customData || typeof customData !== "object") return false;
  return (customData as Record<string, string>).origin === "walk_in";
}
