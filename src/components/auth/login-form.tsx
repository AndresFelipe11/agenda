"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionState = {};

export function LoginForm({ showRegister = true }: { showRegister?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      {showRegister ? (
        <p className="text-center text-sm text-[var(--muted)]">
          ¿Aún no tienes espacio?{" "}
          <Link href="/register" className="font-medium text-[var(--blue)] underline">
            Crear cuenta
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-[var(--muted)]">
          Los clientes reservan sin entrar.{" "}
          <Link href="/" className="font-medium text-[var(--blue)] underline">
            Ir a la agenda
          </Link>
        </p>
      )}
    </form>
  );
}
