import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { seedCutStyles } from "@/lib/barber/seed-styles";
import { seedBarberServices } from "@/lib/barber/seed-services";
import { CutStyleForm, DeleteStyleButton } from "@/components/dashboard/cut-style-form";
import { DeletePhotoButton, GalleryUploadForm } from "@/components/dashboard/gallery-form";
import { Badge } from "@/components/ui/badge";
import { CUT_PRICES, headShapeLabel, styleTier } from "@/lib/barber/catalog";
import { formatPrice } from "@/lib/utils";

export default async function CortesPage() {
  const { tenant } = await requireTenant();
  await seedBarberServices(prisma, tenant.id);
  await seedCutStyles(prisma, tenant.id);
  const [styles, photos, services] = await Promise.all([
    prisma.cutStyle.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    }),
    prisma.galleryPhoto.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">Catálogo</p>
          <h1 className="text-4xl">Cortes y fotos</h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Sube fotos de tus trabajos y indica a qué forma de cabeza le queda cada estilo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CutStyleForm services={services.map((service) => ({ id: service.id, name: service.name }))} />
        </div>
      </div>

      <div className="grid gap-4">
        {styles.map((style) => (
          <article
            key={style.id}
            className="grid gap-4 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4 md:grid-cols-[180px_1fr]"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#1f1f23]">
              {style.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={style.imagePath} alt={style.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
                  Sin foto
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl">{style.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{style.description}</p>
                </div>
                <Badge tone={styleTier(style.category) === "vip" ? "red" : "blue"}>
                  {styleTier(style.category) === "vip" ? "VIP" : "Clásico"} ·{" "}
                  {formatPrice(CUT_PRICES[styleTier(style.category)])}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--blue)]">
                {style.headShapes.map(headShapeLabel).join(" · ") || "Sin formas asignadas"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CutStyleForm
                  services={services.map((service) => ({ id: service.id, name: service.name }))}
                  initial={{
                    id: style.id,
                    name: style.name,
                    description: style.description ?? "",
                    category: style.category,
                    headShapes: style.headShapes,
                    serviceId: style.serviceId ?? "",
                    imagePath: style.imagePath,
                  }}
                />
                <DeleteStyleButton id={style.id} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <GalleryUploadForm styles={styles.map((style) => ({ id: style.id, name: style.name }))} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.imagePath} alt={photo.caption ?? "Foto"} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="truncate text-xs text-[var(--muted)]">{photo.caption ?? "Trabajo"}</span>
              <DeletePhotoButton id={photo.id} />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
