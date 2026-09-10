"use client";

import { addGalleryPhoto, deleteGalleryPhoto } from "@/lib/actions/styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function GalleryUploadForm({
  styles,
}: {
  styles: { id: string; name: string }[];
}) {
  return (
    <form
      action={addGalleryPhoto}
      className="grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5"
    >
      <h3 className="font-[family-name:var(--font-display)] text-xl">Subir foto de trabajo</h3>
      <div className="space-y-1">
        <Label>Foto</Label>
        <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
      </div>
      <div className="space-y-1">
        <Label>Pie de foto</Label>
        <Input name="caption" placeholder="Fade medio, cliente frecuente..." />
      </div>
      <div className="space-y-1">
        <Label>Asociar a un estilo (opcional)</Label>
        <Select name="styleId" defaultValue="">
          <option value="">Galería general</option>
          {styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit">Subir foto</Button>
    </form>
  );
}

export function DeletePhotoButton({ id }: { id: string }) {
  return (
    <form action={async () => deleteGalleryPhoto(id)}>
      <Button type="submit" size="sm" variant="outline">
        Borrar
      </Button>
    </form>
  );
}
