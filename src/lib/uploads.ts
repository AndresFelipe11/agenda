import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function saveUpload(file: File, tenantId: string) {
  const extension = ALLOWED.get(file.type);
  if (!extension) {
    throw new Error("Usa una foto JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto no puede pesar más de 5 MB.");
  }

  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${tenantId}/${filename}`;
}

export async function removeUpload(imagePath: string | null | undefined) {
  if (!imagePath?.startsWith("/uploads/")) return;
  const full = path.join(process.cwd(), "public", imagePath);
  await unlink(full).catch(() => undefined);
}
