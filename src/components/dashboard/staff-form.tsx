"use client";

import { useState } from "react";
import { upsertStaff } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServiceOption = { id: string; name: string };

export function StaffForm({
  services,
  initial,
}: {
  services: ServiceOption[];
  initial?: {
    id?: string;
    name: string;
    email: string;
    serviceIds: string[];
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={initial ? "outline" : "default"}
        size={initial ? "sm" : "default"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "Cerrar" : initial ? "Editar" : "Nuevo profesional"}
      </Button>
      {open ? (
        <form
          action={async (formData) => {
            await upsertStaff(formData);
            setOpen(false);
          }}
          className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
        >
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input name="name" defaultValue={initial?.name} required />
          </div>
          <div className="space-y-1">
            <Label>Correo</Label>
            <Input name="email" type="email" defaultValue={initial?.email} />
          </div>
          <fieldset className="space-y-2">
            <Label>Servicios</Label>
            {services.map((service) => (
              <label key={service.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  defaultChecked={initial?.serviceIds.includes(service.id)}
                />
                {service.name}
              </label>
            ))}
          </fieldset>
          <Button type="submit">{initial ? "Guardar" : "Crear profesional"}</Button>
        </form>
      ) : null}
    </div>
  );
}
