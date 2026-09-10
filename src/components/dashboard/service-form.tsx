"use client";

import { useState } from "react";
import { upsertService } from "@/lib/actions/services";
import type { CustomField } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StaffOption = { id: string; name: string };

type ServiceValue = {
  id?: string;
  name: string;
  description: string;
  durationMin: number;
  priceAmount: string;
  bookingMode: "appointment" | "session";
  capacity: number;
  customFields: CustomField[];
  staffIds: string[];
  isActive: boolean;
};

const emptyService: ServiceValue = {
  name: "",
  description: "",
  durationMin: 30,
  priceAmount: "",
  bookingMode: "appointment",
  capacity: 8,
  customFields: [],
  staffIds: [],
  isActive: true,
};

export function ServiceForm({
  staff,
  initial,
}: {
  staff: StaffOption[];
  initial?: ServiceValue;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<ServiceValue>(initial ?? emptyService);

  return (
    <div className="space-y-3">
      {!initial ? (
        <Button type="button" onClick={() => setOpen((current) => !current)}>
          {open ? "Cerrar" : "Nuevo servicio"}
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((current) => !current)}>
          {open ? "Cerrar" : "Editar"}
        </Button>
      )}
      {open ? (
        <form
          action={async (formData) => {
            formData.set("customFields", JSON.stringify(value.customFields));
            await upsertService(formData);
            if (!initial) setValue(emptyService);
            setOpen(false);
          }}
          className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
        >
          {value.id ? <input type="hidden" name="id" value={value.id} /> : null}
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              name="name"
              value={value.name}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              name="description"
              value={value.description}
              onChange={(event) => setValue({ ...value, description: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Duración (min)</Label>
              <Input
                name="durationMin"
                type="number"
                min={5}
                value={value.durationMin}
                onChange={(event) => setValue({ ...value, durationMin: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Precio (COP)</Label>
              <Input
                name="priceAmount"
                type="number"
                min={0}
                value={value.priceAmount}
                onChange={(event) => setValue({ ...value, priceAmount: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Modo</Label>
              <Select
                name="bookingMode"
                value={value.bookingMode}
                onChange={(event) =>
                  setValue({
                    ...value,
                    bookingMode: event.target.value as ServiceValue["bookingMode"],
                  })
                }
              >
                <option value="appointment">Cita 1:1</option>
                <option value="session">Clase / sesión</option>
              </Select>
            </div>
          </div>
          {value.bookingMode === "session" ? (
            <div className="space-y-1">
              <Label>Cupo</Label>
              <Input
                name="capacity"
                type="number"
                min={1}
                value={value.capacity}
                onChange={(event) => setValue({ ...value, capacity: Number(event.target.value) })}
              />
            </div>
          ) : (
            <input type="hidden" name="capacity" value="1" />
          )}
          <fieldset className="space-y-2">
            <Label>Profesionales</Label>
            {staff.map((person) => (
              <label key={person.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="staffIds"
                  value={person.id}
                  checked={value.staffIds.includes(person.id)}
                  onChange={(event) => {
                    setValue({
                      ...value,
                      staffIds: event.target.checked
                        ? [...value.staffIds, person.id]
                        : value.staffIds.filter((id) => id !== person.id),
                    });
                  }}
                />
                {person.name}
              </label>
            ))}
          </fieldset>
          <CustomFieldsEditor
            fields={value.customFields}
            onChange={(customFields) => setValue({ ...value, customFields })}
          />
          <Button type="submit">{initial ? "Guardar cambios" : "Crear servicio"}</Button>
        </form>
      ) : null}
    </div>
  );
}

function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Campos extra</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...fields,
              {
                id: `field_${fields.length + 1}`,
                label: "",
                type: "text",
                required: false,
              },
            ])
          }
        >
          Añadir campo
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-2">
          <Input
            placeholder="Etiqueta"
            value={field.label}
            onChange={(event) => {
              const next = [...fields];
              next[index] = { ...field, label: event.target.value };
              onChange(next);
            }}
          />
          <Select
            value={field.type}
            onChange={(event) => {
              const next = [...fields];
              next[index] = {
                ...field,
                type: event.target.value as CustomField["type"],
              };
              onChange(next);
            }}
          >
            <option value="text">Texto</option>
            <option value="select">Lista</option>
          </Select>
          {field.type === "select" ? (
            <Input
              className="sm:col-span-2"
              placeholder="Opciones separadas por coma"
              value={(field.options ?? []).join(", ")}
              onChange={(event) => {
                const next = [...fields];
                next[index] = {
                  ...field,
                  options: event.target.value.split(",").map((item) => item.trim()),
                };
                onChange(next);
              }}
            />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(event) => {
                const next = [...fields];
                next[index] = { ...field, required: event.target.checked };
                onChange(next);
              }}
            />
            Obligatorio
          </label>
        </div>
      ))}
    </div>
  );
}
