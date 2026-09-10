"use client";

import { useState } from "react";
import { confirmBooking, cancelBooking } from "@/lib/actions/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function BookingActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, setPending] = useState(false);

  async function run(action: "confirm" | "cancel") {
    setPending(true);
    if (action === "confirm") await confirmBooking(id);
    else await cancelBooking(id);
    setPending(false);
  }

  if (status === "cancelled") {
    return <Badge tone="stone">Cancelada</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={status === "pending" ? "amber" : "teal"}>
        {status === "pending" ? "Pendiente" : "Confirmada"}
      </Badge>
      {status === "pending" ? (
        <Button size="sm" onClick={() => run("confirm")} disabled={pending}>
          Confirmar
        </Button>
      ) : null}
      <Button size="sm" variant="outline" onClick={() => run("cancel")} disabled={pending}>
        Cancelar
      </Button>
    </div>
  );
}
