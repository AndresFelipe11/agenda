import { DateTime } from "luxon";
import { formatPrice } from "@/lib/utils";

export function normalizeWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length >= 12) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, text: string) {
  const number = normalizeWhatsApp(phone);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function bookingWhatsAppText(input: {
  tenantName: string;
  timezone: string;
  clientName: string;
  clientPhone?: string | null;
  serviceName: string;
  priceAmount: number | null;
  startsAt: Date;
  staffName?: string | null;
  cutStyle?: string | null;
}) {
  const when = DateTime.fromJSDate(input.startsAt, { zone: "utc" })
    .setZone(input.timezone)
    .setLocale("es")
    .toFormat("cccc d 'de' LLLL, HH:mm");

  return [
    `Nueva reserva en ${input.tenantName}`,
    "",
    `Cliente: ${input.clientName}`,
    input.clientPhone ? `Teléfono: ${input.clientPhone}` : null,
    `Servicio: ${input.serviceName} (${formatPrice(input.priceAmount)})`,
    input.cutStyle ? `Estilo: ${input.cutStyle}` : null,
    `Cuándo: ${when}`,
    input.staffName ? `Barbero: ${input.staffName}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
