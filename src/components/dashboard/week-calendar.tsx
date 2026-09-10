"use client";

import { useState, useTransition } from "react";
import { DateTime } from "luxon";
import { cancelBooking, occupySlot, releaseSlot } from "@/lib/actions/bookings";
import { generateDayGrid, isWalkIn } from "@/lib/booking/slots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type CalendarBooking = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  clientName: string;
  serviceName: string;
  staffId: string | null;
  customData: unknown;
};

export function WeekCalendar({
  timezone,
  days,
  staff,
  services,
  bookings,
}: {
  timezone: string;
  days: string[];
  staff: {
    id: string;
    name: string;
    weeklyHours: { weekday: number; startMin: number; endMin: number }[];
  }[];
  services: { id: string; name: string; durationMin: number }[];
  bookings: CalendarBooking[];
}) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [walkInName, setWalkInName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const person = staff.find((item) => item.id === staffId);
  const service = services.find((item) => item.id === serviceId);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "No se pudo actualizar.");
    });
  }

  if (!person || !service) {
    return <p className="text-sm text-[var(--muted)]">Agrega un barbero y un servicio para usar el calendario.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Barbero</Label>
          <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {staff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Servicio / duración</Label>
          <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.durationMin} min
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Nombre si llega sin cita</Label>
          <Input
            value={walkInName}
            onChange={(event) => setWalkInName(event.target.value)}
            placeholder="Presencial"
          />
        </div>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Toca <strong>Ocupar</strong> si entra alguien sin reserva. Toca <strong>Liberar</strong> para volver a dejar el hueco libre.
      </p>
      {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((iso) => {
          const day = DateTime.fromISO(iso, { zone: timezone }).setLocale("es");
          const grid = generateDayGrid({
            date: iso,
            timezone,
            durationMin: service.durationMin,
            weeklyHours: person.weeklyHours,
            bookings: bookings
              .filter((booking) => !booking.staffId || booking.staffId === person.id)
              .map((booking) => ({
                ...booking,
                startsAt: new Date(booking.startsAt),
                endsAt: new Date(booking.endsAt),
              })),
          });

          return (
            <section key={iso} className="min-h-48 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {day.toFormat("ccc")}
              </p>
              <p className="font-[family-name:var(--font-display)] text-xl">{day.toFormat("dd LLL")}</p>
              <div className="mt-3 space-y-2">
                {grid.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">Sin horario</p>
                ) : (
                  grid.map((slot) => {
                    const booking = slot.booking;
                    const walkIn = booking ? isWalkIn(booking.customData) : false;
                    return (
                      <article
                        key={slot.startsAt}
                        className={`rounded-2xl border p-2 ${
                          booking
                            ? walkIn
                              ? "border-[var(--accent)] bg-[var(--accent)]/5"
                              : "border-[var(--blue)] bg-[var(--blue)]/5"
                            : "border-[var(--line)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{slot.label}</p>
                          {booking ? (
                            <Badge tone={walkIn ? "red" : "blue"}>{walkIn ? "Presencial" : "Reserva"}</Badge>
                          ) : (
                            <Badge tone="stone">Libre</Badge>
                          )}
                        </div>
                        {booking ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {booking.clientName}
                            {walkIn ? "" : ` · ${booking.serviceName}`}
                          </p>
                        ) : null}
                        <div className="mt-2">
                          {booking && walkIn ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => run(() => releaseSlot(booking.id))}
                            >
                              Liberar
                            </Button>
                          ) : booking ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => run(() => cancelBooking(booking.id))}
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  occupySlot({
                                    serviceId: service.id,
                                    staffId: person.id,
                                    startsAtIso: slot.startsAt,
                                    clientName: walkInName,
                                  }),
                                )
                              }
                            >
                              Ocupar
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
