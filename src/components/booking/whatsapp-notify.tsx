"use client";

import { useEffect } from "react";

export function WhatsAppNotify({ url }: { url: string }) {
  useEffect(() => {
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.assign(url);
    }
  }, [url]);

  return (
    <a
      href={url}
      className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#25D366] px-5 text-sm font-medium text-[#111111]"
    >
      Enviar reserva por WhatsApp
    </a>
  );
}
