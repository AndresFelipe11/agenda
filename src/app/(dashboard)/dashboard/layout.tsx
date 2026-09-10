import { requireTenant } from "@/lib/tenant";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant } = await requireTenant();

  return (
    <div>
      <div className="barber-stripe" />
      <div className="grid min-h-[calc(100vh-10px)] lg:grid-cols-[260px_1fr]">
        <DashboardNav tenantName={tenant.name} slug={tenant.slug} />
        <div className="min-w-0">
          <div className="border-b border-[var(--line)] bg-[#111111] px-4 py-3 text-white lg:hidden">
            <p className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide">
              {tenant.name}
            </p>
          </div>
          <div className="px-4 py-6 lg:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
