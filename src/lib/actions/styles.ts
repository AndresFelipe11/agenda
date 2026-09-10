"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { HEAD_SHAPES } from "@/lib/barber/catalog";
import { seedCutStyles } from "@/lib/barber/seed-styles";
import { removeUpload, saveUpload } from "@/lib/uploads";

function parseHeadShapes(formData: FormData) {
  const selected = formData.getAll("headShapes").map(String);
  const valid = new Set(HEAD_SHAPES.map((shape) => shape.id));
  return selected.filter((id) => valid.has(id as (typeof HEAD_SHAPES)[number]["id"]));
}

export async function ensureDefaultCutStyles() {
  const { tenant } = await requireTenant();
  await seedCutStyles(prisma, tenant.id);
  revalidatePath("/dashboard/cortes");
  revalidatePath(`/${tenant.slug}`);
}

export async function saveCutStyle(formData: FormData) {
  const { tenant } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "corte").trim() || "corte";
  const serviceId = String(formData.get("serviceId") ?? "");
  const file = formData.get("photo");
  if (!name) throw new Error("El nombre del corte es obligatorio.");

  let imagePath: string | undefined;
  if (file instanceof File && file.size > 0) {
    imagePath = await saveUpload(file, tenant.id);
  }

  if (id) {
    const existing = await prisma.cutStyle.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!existing) throw new Error("Corte no encontrado.");
    if (imagePath && existing.imagePath) await removeUpload(existing.imagePath);
    await prisma.cutStyle.update({
      where: { id },
      data: {
        name,
        description: description || null,
        category,
        headShapes: parseHeadShapes(formData),
        serviceId: serviceId || null,
        ...(imagePath ? { imagePath } : {}),
      },
    });
  } else {
    await prisma.cutStyle.create({
      data: {
        tenantId: tenant.id,
        name,
        description: description || null,
        category,
        headShapes: parseHeadShapes(formData),
        serviceId: serviceId || null,
        imagePath: imagePath ?? null,
      },
    });
  }

  revalidatePath("/dashboard/cortes");
  revalidatePath(`/${tenant.slug}`);
}

export async function deleteCutStyle(styleId: string) {
  const { tenant } = await requireTenant();
  const existing = await prisma.cutStyle.findFirst({
    where: { id: styleId, tenantId: tenant.id },
  });
  if (!existing) return;
  await removeUpload(existing.imagePath);
  await prisma.cutStyle.delete({ where: { id: styleId } });
  revalidatePath("/dashboard/cortes");
  revalidatePath(`/${tenant.slug}`);
}

export async function addGalleryPhoto(formData: FormData) {
  const { tenant } = await requireTenant();
  const file = formData.get("photo");
  const caption = String(formData.get("caption") ?? "").trim();
  const styleId = String(formData.get("styleId") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Elige una foto.");
  }
  const imagePath = await saveUpload(file, tenant.id);
  await prisma.galleryPhoto.create({
    data: {
      tenantId: tenant.id,
      imagePath,
      caption: caption || null,
      styleId: styleId || null,
    },
  });
  revalidatePath("/dashboard/cortes");
  revalidatePath(`/${tenant.slug}`);
}

export async function deleteGalleryPhoto(photoId: string) {
  const { tenant } = await requireTenant();
  const photo = await prisma.galleryPhoto.findFirst({
    where: { id: photoId, tenantId: tenant.id },
  });
  if (!photo) return;
  await removeUpload(photo.imagePath);
  await prisma.galleryPhoto.delete({ where: { id: photoId } });
  revalidatePath("/dashboard/cortes");
  revalidatePath(`/${tenant.slug}`);
}
