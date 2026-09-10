"use client";

import { createClassSession, deleteClassSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function SessionForm({
  services,
  staff,
}: {
  services: { id: string; name: string; capacity: number }[];
  staff: { id: string; name: string }[];
}) {
  const first = services[0];
  return (
    <form action={createClassSession} className="grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
      <div className="space-y-1">
        <Label>Servicio</Label>
        <Select name="serviceId" defaultValue={first?.id} required>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Profesional</Label>
        <Select name="staffId" defaultValue={staff[0]?.id ?? ""}>
          <option value="">Sin asignar</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input name="date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label>Hora</Label>
          <Input name="time" type="time" required />
        </div>
        <div className="space-y-1">
          <Label>Cupo</Label>
          <Input name="capacity" type="number" min={1} defaultValue={first?.capacity ?? 8} />
        </div>
      </div>
      <Button type="submit" disabled={services.length === 0}>
        Publicar sesión
      </Button>
    </form>
  );
}

export function DeleteSessionButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        await deleteClassSession(id);
      }}
    >
      <Button type="submit" size="sm" variant="outline">
        Eliminar
      </Button>
    </form>
  );
}
