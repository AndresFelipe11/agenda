import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="barber-stripe mb-8 rounded-full" />
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--accent)]">Barbería</p>
      <h1 className="mt-4 text-4xl">Entrar</h1>
      <p className="mt-2 text-[var(--muted)]">Accede al calendario de tu barbería.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
