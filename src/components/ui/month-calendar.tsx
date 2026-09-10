"use client";

import { DateTime } from "luxon";
import { WEEKDAYS } from "@/lib/utils";

export function MonthCalendar({
  timezone,
  value,
  onChange,
  enabledWeekdays,
}: {
  timezone: string;
  value: string;
  onChange: (date: string) => void;
  enabledWeekdays?: number[];
}) {
  const today = DateTime.now().setZone(timezone).startOf("day");
  const selected = value ? DateTime.fromISO(value, { zone: timezone }) : null;
  const month = (selected?.isValid ? selected : today).startOf("month");
  const start = month.startOf("week");
  const end = month.endOf("month").endOf("week");
  const days: DateTime[] = [];
  for (let cursor = start; cursor <= end; cursor = cursor.plus({ days: 1 })) {
    days.push(cursor);
  }

  function canPick(day: DateTime) {
    if (day < today) return false;
    if (day.month !== month.month) return false;
    if (enabledWeekdays?.length && !enabledWeekdays.includes(day.weekday)) return false;
    return true;
  }

  function shiftMonth(delta: number) {
    const next = month.plus({ months: delta });
    const first = next.hasSame(today, "month") ? today : next;
    if (first < today.startOf("month")) return;
    const iso = first.toISODate();
    if (iso) onChange(iso);
  }

  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-3 py-1 text-sm disabled:opacity-40"
          onClick={() => shiftMonth(-1)}
          disabled={month.hasSame(today, "month")}
        >
          Anterior
        </button>
        <p className="font-[family-name:var(--font-display)] text-lg capitalize">
          {month.setLocale("es").toFormat("LLLL yyyy")}
        </p>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
          onClick={() => shiftMonth(1)}
        >
          Siguiente
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-[var(--muted)]">
        {WEEKDAYS.map((day) => (
          <span key={day.iso}>{day.short}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = day.toISODate() ?? "";
          const enabled = canPick(day);
          const isSelected = value === iso;
          const isToday = day.hasSame(today, "day");
          return (
            <button
              key={iso + day.month}
              type="button"
              disabled={!enabled}
              onClick={() => onChange(iso)}
              className={`aspect-square rounded-2xl text-sm ${
                isSelected
                  ? "bg-[var(--accent)] text-white"
                  : enabled
                    ? "hover:bg-[var(--blue)]/10"
                    : "text-[var(--line)]"
              } ${isToday && !isSelected ? "border border-[var(--blue)]" : ""}`}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
