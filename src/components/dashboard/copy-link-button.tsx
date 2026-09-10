"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        const url = path.startsWith("http")
          ? path
          : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? "Copiado" : "Copiar enlace público"}
    </Button>
  );
}
