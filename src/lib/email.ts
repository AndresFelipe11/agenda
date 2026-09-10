import { Resend } from "resend";
import { DateTime } from "luxon";
import type { Booking, Service, Staff, Tenant } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

type BookingWithRelations = Booking & {
  service: Service;
  staff: Staff | null;
  tenant: Tenant;
};

function formatWhen(booking: BookingWithRelations) {
  const start = DateTime.fromJSDate(booking.startsAt, { zone: "utc" }).setZone(
    booking.tenant.timezone,
  );
  return start.setLocale("es").toFormat("cccc d 'de' LLLL, HH:mm");
}

function buildHtml(booking: BookingWithRelations) {
  const when = formatWhen(booking);
  const staff = booking.staff ? ` con ${booking.staff.name}` : "";
  return `
    <div style="font-family:Georgia,serif;background:#f6f1e8;padding:32px">
      <div style="max-width:520px;margin:auto;background:#fffdf8;border:1px solid #e7dcc8;padding:28px">
        <p style="color:#0f766e;letter-spacing:.12em;text-transform:uppercase;font-size:12px;margin:0 0 8px">${booking.tenant.name}</p>
        <h1 style="font-size:28px;color:#1c1917;margin:0 0 16px">Reserva confirmada</h1>
        <p style="color:#44403c;line-height:1.6">
          Hola ${booking.clientName}, tu cita en <strong>${booking.tenant.name}</strong> quedó agendada.
        </p>
        <p style="color:#1c1917;line-height:1.7">
          <strong>${booking.service.name}</strong>${staff}<br/>
          ${when}<br/>
          ${formatPrice(booking.service.priceAmount)}
        </p>
        <p style="color:#78716c;font-size:13px">Si necesitas cambiarla, escribe al negocio con este correo.</p>
      </div>
    </div>
  `;
}

export async function sendBookingConfirmation(booking: BookingWithRelations) {
  if (!booking.clientEmail) {
    return { skipped: true as const };
  }

  const subject = `Reserva confirmada en ${booking.tenant.name}`;
  const html = buildHtml(booking);
  const text = `Hola ${booking.clientName}, tu reserva de ${booking.service.name} quedó para ${formatWhen(booking)}.`;

  if (!process.env.RESEND_API_KEY) {
    console.info("[email:dev]", { to: booking.clientEmail, subject, text });
    return { skipped: true as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "Agendas <noreply@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: booking.clientEmail,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[email:error]", error);
  }

  return { skipped: false as const };
}
