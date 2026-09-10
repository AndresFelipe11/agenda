"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { createPublicBooking, getAvailableSlots } from "@/lib/actions/public";
import type { CustomField } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { formatPrice } from "@/lib/utils";
import type { Slot } from "@/lib/booking/slots";

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceAmount: number | null;
  bookingMode: "appointment" | "session";
  customFields: unknown;
  staff: {
    staff: {
      id: string;
      name: string;
      isActive: boolean;
      weeklyHours?: { weekday: number; startMin: number; endMin: number }[];
    };
  }[];
  sessions: {
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    staff: { name: string } | null;
    bookings: { id: string }[];
  }[];
};

export function BookingWizard({
  slug,
  timezone,
  services,
  prefill,
}: {
  slug: string;
  timezone: string;
  services: PublicService[];
  prefill?: { cut_style?: string; head_shape?: string; serviceId?: string };
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(prefill?.serviceId || services[0]?.id || "");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [customData, setCustomData] = useState<Record<string, string>>({
    ...(prefill?.cut_style ? { cut_style: prefill.cut_style } : {}),
    ...(prefill?.head_shape ? { head_shape: prefill.head_shape } : {}),
  });

  const service = services.find((item) => item.id === serviceId);
  const staffOptions = (service?.staff ?? [])
    .map((row) => row.staff)
    .filter((person) => person.isActive);
  const selectedStaffId = staffId || (staffOptions.length === 1 ? staffOptions[0]?.id ?? "" : "");
  const selectedStaff = staffOptions.find((person) => person.id === selectedStaffId);
  const fields = (Array.isArray(service?.customFields) ? service?.customFields : []) as CustomField[];
  const extraFields = fields.filter((field) => {
    const label = `${field.id} ${field.label}`.toLowerCase();
    return !label.includes("correo") && !label.includes("email");
  });
  const isSession = service?.bookingMode === "session";
  const enabledWeekdays = useMemo(() => {
    const hours = selectedStaff?.weeklyHours ?? [];
    return [...new Set(hours.map((block) => block.weekday))];
  }, [selectedStaff]);

  function selectService(id: string) {
    setServiceId(id);
    setStaffId("");
    setDate("");
    setSlot(null);
    setSlots([]);
    setSessionId("");
    setCustomData({});
    setError("");
  }

  function loadSlots(nextStaffId: string, nextDate: string) {
    if (!nextStaffId || !nextDate || !serviceId) return;
    startTransition(async () => {
      const result = await getAvailableSlots({
        slug,
        serviceId,
        staffId: nextStaffId,
        date: nextDate,
      });
      setSlots(result);
      setSlot(null);
    });
  }

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createPublicBooking({
        slug,
        serviceId,
        staffId: selectedStaffId || undefined,
        sessionId: sessionId || undefined,
        startsAtIso: slot?.startsAt,
        clientName: String(formData.get("clientName") ?? ""),
        clientPhone: String(formData.get("clientPhone") ?? ""),
        customData: {
          ...customData,
          ...(prefill?.cut_style && !customData.cut_style
            ? { cut_style: prefill.cut_style }
            : {}),
          ...(prefill?.head_shape && !customData.head_shape
            ? { head_shape: prefill.head_shape }
            : {}),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/${slug}/listo?id=${result.bookingId}`);
    });
  }

  if (!service) {
    return <p>Este negocio aún no publicó servicios.</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">1. Elige el servicio</h2>
        <div className="grid gap-3">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectService(item.id)}
              className={`rounded-2xl border px-4 py-4 text-left ${
                serviceId === item.id
                  ? "border-[var(--blue)] bg-[var(--blue)]/10"
                  : "border-[var(--line)] bg-[var(--card)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[var(--muted)]">{item.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{item.durationMin} min</p>
                  <p>{formatPrice(item.priceAmount)}</p>
                </div>
              </div>
              <Badge className="mt-2" tone={item.bookingMode === "session" ? "red" : "gold"}>
                {item.bookingMode === "session" ? "Clase" : "Cita"}
              </Badge>
            </button>
          ))}
        </div>
      </section>

      {isSession ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">2. Elige la sesión</h2>
          <div className="grid gap-3">
            {service.sessions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No hay sesiones publicadas todavía.</p>
            ) : (
              service.sessions.map((session) => {
                const taken = session.bookings.length;
                const left = session.capacity - taken;
                const start = DateTime.fromISO(session.startsAt, { zone: "utc" })
                  .setZone(timezone)
                  .setLocale("es");
                return (
                  <button
                    key={session.id}
                    type="button"
                    disabled={left <= 0}
                    onClick={() => setSessionId(session.id)}
                    className={`rounded-2xl border px-4 py-4 text-left disabled:opacity-50 ${
                      sessionId === session.id
                        ? "border-[var(--blue)] bg-[var(--blue)]/10"
                        : "border-[var(--line)] bg-[var(--card)]"
                    }`}
                  >
                    <p className="font-medium">{start.toFormat("cccc d LLLL, HH:mm")}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {session.staff ? `${session.staff.name} · ` : ""}
                      {left} cupos libres de {session.capacity}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">2. Elige profesional y hora</h2>
          {staffOptions.length > 1 ? (
            <div className="space-y-1">
              <Label>Profesional</Label>
              <Select
                value={staffId}
                onChange={(event) => {
                  setStaffId(event.target.value);
                  if (date) loadSlots(event.target.value, date);
                }}
              >
                <option value="">Selecciona</option>
                {staffOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Con {staffOptions[0]?.name ?? "el profesional"}.
            </p>
          )}
          <MonthCalendar
            timezone={timezone}
            value={date}
            enabledWeekdays={enabledWeekdays}
            onChange={(next) => {
              setDate(next);
              const currentStaff = selectedStaffId || staffOptions[0]?.id;
              if (currentStaff) {
                if (staffOptions.length > 1) setStaffId(currentStaff);
                loadSlots(currentStaff, next);
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {date && slots.length === 0 && !pending ? (
              <p className="text-sm text-[var(--muted)]">No hay huecos este día.</p>
            ) : null}
            {slots.map((item) => (
              <button
                key={item.startsAt}
                type="button"
                onClick={() => setSlot(item)}
                className={`rounded-full border px-3 py-2 text-sm ${
                  slot?.startsAt === item.startsAt
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--card)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4" id="reservar">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">3. Tus datos</h2>
        {prefill?.cut_style ? (
          <p className="rounded-2xl border border-[var(--blue)]/40 bg-[var(--blue)]/10 px-4 py-3 text-sm">
            Pedido: <strong>{prefill.cut_style}</strong>
            {prefill.head_shape ? ` · forma ${prefill.head_shape}` : ""}
          </p>
        ) : null}
        <form action={submit} className="grid gap-4">
          <div className="space-y-1">
            <Label htmlFor="clientName">Nombre</Label>
            <Input id="clientName" name="clientName" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clientPhone">Teléfono</Label>
            <Input id="clientPhone" name="clientPhone" />
          </div>
          {extraFields.map((field) => (
            <div key={field.id} className="space-y-1">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              {field.type === "select" ? (
                <Select
                  id={field.id}
                  required={field.required}
                  value={customData[field.id] ?? ""}
                  onChange={(event) =>
                    setCustomData((current) => ({ ...current, [field.id]: event.target.value }))
                  }
                >
                  <option value="">Selecciona</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={field.id}
                  required={field.required}
                  value={customData[field.id] ?? ""}
                  onChange={(event) =>
                    setCustomData((current) => ({ ...current, [field.id]: event.target.value }))
                  }
                />
              )}
            </div>
          ))}
          {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
          <Button type="submit" disabled={pending || (isSession ? !sessionId : !slot)}>
            {pending ? "Reservando..." : "Confirmar reserva"}
          </Button>
        </form>
      </section>
    </div>
  );
}
