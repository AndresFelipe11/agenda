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
import type { PublicDaySlot, Slot } from "@/lib/booking/slots";

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
  prefill?: { cut_style?: string; serviceId?: string };
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(prefill?.serviceId || services[0]?.id || "");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<PublicDaySlot[]>([]);
  const [period, setPeriod] = useState<"morning" | "afternoon">("morning");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [customData, setCustomData] = useState<Record<string, string>>({
    ...(prefill?.cut_style ? { cut_style: prefill.cut_style } : {}),
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
    return (
      field.id !== "cut_style" &&
      field.id !== "head_shape" &&
      !label.includes("correo") &&
      !label.includes("email") &&
      !label.includes("corte que") &&
      !label.includes("forma")
    );
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
    setPeriod("morning");
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
          cut_style: customData.cut_style || prefill?.cut_style || "",
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
              const now = DateTime.now().setZone(timezone);
              const picked = DateTime.fromISO(next, { zone: timezone });
              setPeriod(picked.hasSame(now, "day") && now.hour >= 12 ? "afternoon" : "morning");
              const currentStaff = selectedStaffId || staffOptions[0]?.id;
              if (currentStaff) {
                if (staffOptions.length > 1) setStaffId(currentStaff);
                loadSlots(currentStaff, next);
              }
            }}
          />
          {date ? (
            <div className="space-y-3 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">Horario</p>
                  <p className="font-[family-name:var(--font-display)] text-xl capitalize">
                    {DateTime.fromISO(date, { zone: timezone }).setLocale("es").toFormat("cccc d 'de' LLLL")}
                  </p>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {slots.filter((item) => item.status === "available").length} libres ·{" "}
                  {slots.filter((item) => item.status === "occupied").length} ocupadas
                </p>
              </div>
              {(() => {
                const hourOf = (item: PublicDaySlot) =>
                  DateTime.fromISO(item.startsAt, { zone: "utc" }).setZone(timezone).hour;
                const morning = slots.filter((item) => hourOf(item) < 12);
                const afternoon = slots.filter((item) => hourOf(item) >= 12);
                const visible = period === "morning" ? morning : afternoon;
                const freeIn = (list: PublicDaySlot[]) =>
                  list.filter((item) => item.status === "available").length;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPeriod("morning")}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                          period === "morning"
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--line)] bg-[var(--background)]"
                        }`}
                      >
                        <span className="block font-[family-name:var(--font-display)] text-lg">Mañana</span>
                        <span className={`text-xs ${period === "morning" ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {freeIn(morning)} libres
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriod("afternoon")}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                          period === "afternoon"
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--line)] bg-[var(--background)]"
                        }`}
                      >
                        <span className="block font-[family-name:var(--font-display)] text-lg">Tarde</span>
                        <span className={`text-xs ${period === "afternoon" ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {freeIn(afternoon)} libres
                        </span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Libre
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> Ocupado
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--silver)]" /> Ya pasó
                      </span>
                    </div>
                    {pending ? (
                      <p className="text-sm text-[var(--muted)]">Cargando horas...</p>
                    ) : visible.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        No hay horas en la {period === "morning" ? "mañana" : "tarde"}.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {visible.map((item) => {
                          const selected = slot?.startsAt === item.startsAt;
                          const free = item.status === "available";
                          return (
                            <button
                              key={item.startsAt}
                              type="button"
                              disabled={!free}
                              onClick={() => setSlot(item)}
                              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                                selected
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                  : free
                                    ? "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400"
                                    : item.status === "occupied"
                                      ? "cursor-not-allowed border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--muted)]"
                                      : "cursor-not-allowed border-[var(--line)] bg-white/5 text-[var(--silver)]"
                              }`}
                            >
                              <span className="font-medium">{item.label}</span>
                              <span className="text-xs uppercase tracking-wide">
                                {selected
                                  ? "Elegida"
                                  : item.status === "available"
                                    ? "Libre"
                                    : item.status === "occupied"
                                      ? "Ocupado"
                                      : "Ya pasó"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Marca un día en el calendario para ver las horas.</p>
          )}
        </section>
      )}

      <section className="space-y-4" id="reservar">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">3. Tus datos</h2>
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
