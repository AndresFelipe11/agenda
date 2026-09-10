import { requireTenant } from "@/lib/tenant";
import { getTenantWhatsApp } from "@/lib/tenant-whatsapp";
import { updateTenantSettings } from "@/lib/actions/settings";
import { TIMEZONES } from "@/lib/templates";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function SettingsPage() {
  const { tenant } = await requireTenant();
  const whatsapp = await getTenantWhatsApp(tenant.id);
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Espacio</p>
        <h1 className="text-4xl">Ajustes</h1>
      </div>
      <form action={updateTenantSettings} className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
        <div className="space-y-1">
          <Label>Nombre del negocio</Label>
          <Input name="name" defaultValue={tenant.name} required />
        </div>
        <div className="space-y-1">
          <Label>Slug público</Label>
          <Input value={tenant.slug} disabled />
        </div>
        <div className="space-y-1">
          <Label>Zona horaria</Label>
          <Select name="timezone" defaultValue={tenant.timezone}>
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>WhatsApp del barbero</Label>
          <Input
            name="whatsapp"
            defaultValue={whatsapp ?? ""}
            placeholder="3001234567"
          />
          <p className="text-xs text-[var(--muted)]">
            Cuando alguien reserve, se abre WhatsApp con el mensaje de la cita.
          </p>
        </div>
        <Button type="submit">Guardar</Button>
      </form>
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
        <p className="text-sm text-[var(--muted)]">Comparte este enlace con tus clientes:</p>
        <p className="mt-2 font-medium">/{tenant.slug}</p>
        <div className="mt-3">
          <CopyLinkButton path={`/${tenant.slug}`} />
        </div>
      </div>
    </div>
  );
}
