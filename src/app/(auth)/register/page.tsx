import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="barber-stripe mb-8 rounded-full" />
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--accent)]">Tu barbería</p>
      <h1 className="mt-4 text-4xl">Abre tu espacio</h1>
      <p className="mt-2 text-[var(--muted)]">
        Tú administras la agenda. Tus clientes reservan en la página principal sin crear cuenta.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </main>
  );
}
