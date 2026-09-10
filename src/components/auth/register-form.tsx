"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { TIMEZONES } from "@/lib/templates";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initial: ActionState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const suggested = useMemo(() => slugify(businessName), [businessName]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="template" value="barber" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Tu nombre</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="businessName">Nombre de la barbería</Label>
        <Input
          id="businessName"
          name="businessName"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slug">Enlace público</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">/</span>
          <Input
            id="slug"
            name="slug"
            value={slug || suggested}
            onChange={(event) => setSlug(slugify(event.target.value))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Select id="timezone" name="timezone" defaultValue="America/Bogota">
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando barbería..." : "Abrir mi barbería"}
      </Button>
      <p className="text-center text-sm text-[var(--muted)]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-[var(--blue)] underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
