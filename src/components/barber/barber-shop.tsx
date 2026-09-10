"use client";

import { useMemo, useState } from "react";
import { BookingWizard, type PublicService } from "@/components/booking/booking-wizard";
import { CUT_PRICES, HEAD_SHAPES, headShapeLabel, styleServiceName, styleTier } from "@/lib/barber/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export type PublicCutStyle = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  headShapes: string[];
  imagePath: string | null;
};

export type PublicGalleryPhoto = {
  id: string;
  imagePath: string;
  caption: string | null;
};

export function BarberShop({
  shopName,
  slug,
  timezone,
  services,
  styles,
  gallery,
}: {
  shopName: string;
  slug: string;
  timezone: string;
  services: PublicService[];
  styles: PublicCutStyle[];
  gallery: PublicGalleryPhoto[];
}) {
  const [shape, setShape] = useState<string>("");
  const [picked, setPicked] = useState<{
    cut_style?: string;
    serviceId?: string;
  }>({});

  const filtered = useMemo(() => {
    if (!shape) return styles;
    return styles.filter((style) => style.headShapes.includes(shape));
  }, [shape, styles]);

  const guide = HEAD_SHAPES.find((item) => item.id === shape);
  const photos = gallery.filter((photo) => photo.imagePath);

  function chooseStyle(style: PublicCutStyle) {
    const serviceName = styleServiceName(style.category);
    const service = services.find((item) => item.name === serviceName);
    setPicked({
      cut_style: style.name,
      serviceId: service?.id,
    });
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-16">
      <header className="space-y-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--accent)]">Barbería</p>
        <h1 className="text-5xl uppercase tracking-[0.08em] md:text-6xl">{shopName}</h1>
        <p className="max-w-xl text-lg text-[var(--muted)]">
          Fades, rayas y diseños. Elige el que te late y reserva.
        </p>
      </header>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl">¿Qué corte te late?</h2>
          <p className="mt-2 text-[var(--muted)]">
            Filtra por forma de cabeza. Las rayas y el diseño se marcan en la silla.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShape("")}
            className={`rounded-full border px-4 py-2 text-sm ${
              shape === ""
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            Todas
          </button>
          {HEAD_SHAPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setShape(item.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                shape === item.id
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        {guide ? (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--blue)]">{guide.name}.</span> {guide.tip}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No hay cortes cargados para esa forma todavía.</p>
          ) : (
            filtered.map((style) => (
              <article
                key={style.id}
                className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)]"
              >
                <div className="aspect-[4/3] bg-[#1f1f23]">
                  {style.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={style.imagePath}
                      alt={style.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                      Sin foto aún
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl">{style.name}</h3>
                    <Badge tone={styleTier(style.category) === "vip" ? "red" : "blue"}>
                      {styleTier(style.category) === "vip" ? "VIP" : "Clásico"} ·{" "}
                      {formatPrice(CUT_PRICES[styleTier(style.category)])}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{style.description}</p>
                  <p className="text-xs uppercase tracking-wide text-[var(--blue)]">
                    {style.headShapes.map(headShapeLabel).join(" · ") || "Varias formas"}
                  </p>
                  <Button size="sm" type="button" onClick={() => chooseStyle(style)}>
                    Quiero este
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {photos.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-3xl">Trabajos</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--line)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imagePath} alt={photo.caption ?? "Corte"} className="aspect-square w-full object-cover" />
                {photo.caption ? (
                  <figcaption className="px-3 py-2 text-xs text-[var(--muted)]">{photo.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-3xl">Reserva</h2>
        <BookingWizard
          key={`${picked.cut_style}-${picked.serviceId}`}
          slug={slug}
          timezone={timezone}
          services={services}
          prefill={picked}
        />
      </section>
    </div>
  );
}
