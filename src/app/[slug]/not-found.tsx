export default function TenantNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-4xl">Este negocio no existe</h1>
      <p className="mt-3 text-[var(--muted)]">
        Revisa el enlace que te compartieron. Cada negocio tiene su propia página;
        no hay un listado general.
      </p>
    </main>
  );
}
