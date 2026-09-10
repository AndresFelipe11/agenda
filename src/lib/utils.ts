import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | null | undefined) {
  if (amount == null) return "Consultar";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const WEEKDAYS = [
  { iso: 1, label: "Lunes", short: "Lun" },
  { iso: 2, label: "Martes", short: "Mar" },
  { iso: 3, label: "Miércoles", short: "Mié" },
  { iso: 4, label: "Jueves", short: "Jue" },
  { iso: 5, label: "Viernes", short: "Vie" },
  { iso: 6, label: "Sábado", short: "Sáb" },
  { iso: 7, label: "Domingo", short: "Dom" },
];
