import { DEFAULT_CUT_STYLES, SAMPLE_GALLERY } from "@/lib/barber/catalog";

type SeedClient = {
  cutStyle: {
    findMany: (args: {
      where: { tenantId: string };
      select: { id: true; name: true; imagePath: true };
    }) => Promise<{ id: string; name: string; imagePath: string | null }[]>;
    createMany: (args: {
      data: {
        tenantId: string;
        name: string;
        description: string;
        category: string;
        headShapes: string[];
        imagePath: string;
      }[];
    }) => Promise<unknown>;
    deleteMany: (args: {
      where: {
        tenantId: string;
        OR?: ({ imagePath: { startsWith: string } } | { imagePath: null })[];
      };
    }) => Promise<unknown>;
  };
  galleryPhoto: {
    deleteMany: (args: {
      where: { tenantId: string; imagePath?: { startsWith: string } };
    }) => Promise<unknown>;
    createMany: (args: {
      data: {
        tenantId: string;
        imagePath: string;
        caption: string;
        styleId?: string | null;
      }[];
    }) => Promise<unknown>;
  };
};

export async function seedCutStyles(tx: SeedClient, tenantId: string) {
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
