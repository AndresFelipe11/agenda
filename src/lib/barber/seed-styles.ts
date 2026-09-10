import type { Prisma } from "@prisma/client";
import { DEFAULT_CUT_STYLES, SAMPLE_GALLERY } from "@/lib/barber/catalog";

export async function seedCutStyles(tx: Prisma.TransactionClient, tenantId: string) {
  await tx.galleryPhoto.deleteMany({
    where: { tenantId, imagePath: { startsWith: "/samples/" } },
  });
  await tx.cutStyle.deleteMany({
    where: {
      tenantId,
      OR: [{ imagePath: { startsWith: "/samples/" } }, { imagePath: null }],
    },
  });

  const current = await tx.cutStyle.findMany({
    where: { tenantId },
    select: { id: true, name: true, imagePath: true },
  });
  const have = new Set(current.map((style) => style.name));
  const missing = DEFAULT_CUT_STYLES.filter((style) => !have.has(style.name));
  if (missing.length > 0) {
    await tx.cutStyle.createMany({
      data: missing.map((style) => ({
        tenantId,
        name: style.name,
        description: style.description,
        category: style.category,
        headShapes: [...style.headShapes],
        imagePath: style.imagePath,
      })),
    });
  }

  const styles = await tx.cutStyle.findMany({
    where: { tenantId },
    select: { id: true, name: true, imagePath: true },
  });
  const byName = new Map(styles.map((style) => [style.name, style.id]));
  await tx.galleryPhoto.createMany({
    data: SAMPLE_GALLERY.map((photo) => ({
      tenantId,
      imagePath: photo.imagePath,
      caption: photo.caption,
      styleId: byName.get(photo.styleName) ?? null,
    })),
  });
}
