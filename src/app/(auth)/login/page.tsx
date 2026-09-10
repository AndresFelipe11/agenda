import { LoginForm } from "@/components/auth/login-form";
import { hasOwnerAccount } from "@/lib/actions/public";

export default async function LoginPage() {
  const showRegister = !(await hasOwnerAccount());
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="barber-stripe mb-8 rounded-full" />
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--accent)]">Barbero</p>
      <h1 className="mt-4 text-4xl">Entrar al panel</h1>
      <p className="mt-2 text-[var(--muted)]">
        Solo el barbero inicia sesión para marcar turnos libres u ocupados. El cliente reserva sin
        cuenta.
      </p>
      <div className="mt-8">
        <LoginForm showRegister={showRegister} />
      </div>
    </main>
  );
}
