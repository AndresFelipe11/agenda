"use client";

import { saveWeeklySchedule } from "@/lib/actions/schedule";
import { WEEKDAYS, minutesToLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Block = { weekday: number; startMin: number; endMin: number };

export function ScheduleForm({
  staffId,
  staffName,
  blocks,
}: {
  staffId: string;
  staffName: string;
  blocks: Block[];
}) {
  return (
    <form action={saveWeeklySchedule} className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
      <input type="hidden" name="staffId" value={staffId} />
      <h3 className="font-[family-name:var(--font-display)] text-xl">{staffName}</h3>
      <div className="grid gap-3">
        {WEEKDAYS.map((day) => {
          const block = blocks.find((item) => item.weekday === day.iso);
          return (
            <div key={day.iso} className="grid items-center gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`enabled_${day.iso}`}
                  defaultChecked={Boolean(block)}
                />
                {day.label}
              </label>
              <div className="space-y-1">
                <Label className="text-xs">Desde</Label>
                <Input
                  type="time"
                  name={`start_${day.iso}`}
                  defaultValue={minutesToLabel(block?.startMin ?? 9 * 60)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="time"
                  name={`end_${day.iso}`}
                  defaultValue={minutesToLabel(block?.endMin ?? 18 * 60)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Button type="submit">Guardar horario</Button>
    </form>
  );
}
