"use client";

import { useState } from "react";
import { saveCutStyle, deleteCutStyle } from "@/lib/actions/styles";
import { HEAD_SHAPES } from "@/lib/barber/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StyleValue = {
  id?: string;
  name: string;
  description: string;
  category: string;
  headShapes: string[];
  serviceId: string;
  imagePath?: string | null;
};

export function CutStyleForm({
  services,
  initial,
}: {
  services: { id: string; name: string }[];
  initial?: StyleValue;
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
        {open ? "Cerrar" : initial ? "Editar" : "Nuevo corte"}
      </Button>
      {open ? (
        <form
          action={async (formData) => {
            await saveCutStyle(formData);
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
            <Label>Descripción</Label>
            <Textarea name="description" defaultValue={initial?.description} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select name="category" defaultValue={initial?.category ?? "clasico"}>
                <option value="clasico">Clásico · $20.000</option>
                <option value="vip">VIP · $35.000</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Servicio al reservar</Label>
              <Select name="serviceId" defaultValue={initial?.serviceId ?? ""}>
                <option value="">Corte (por defecto)</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <fieldset className="space-y-2">
            <Label>Formas de cabeza recomendadas</Label>
            <div className="grid grid-cols-2 gap-2">
              {HEAD_SHAPES.map((shape) => (
                <label key={shape.id} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <input
                    type="checkbox"
                    name="headShapes"
                    value={shape.id}
                    defaultChecked={initial?.headShapes.includes(shape.id)}
                  />
                  {shape.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1">
            <Label>Foto del corte</Label>
            <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            {initial?.imagePath ? (
              <p className="text-xs text-[var(--muted)]">Si subes otra, reemplaza la actual.</p>
            ) : null}
          </div>
          <Button type="submit">{initial ? "Guardar corte" : "Publicar corte"}</Button>
        </form>
      ) : null}
    </div>
  );
}

export function DeleteStyleButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        await deleteCutStyle(id);
      }}
    >
      <Button type="submit" size="sm" variant="outline">
        Quitar
      </Button>
    </form>
  );
}
