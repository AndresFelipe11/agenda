import type { Metadata } from "next";
import { Cinzel, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Barbería",
    template: "%s",
  },
  description: "Reserva tu corte. Estilos según la forma de tu cabeza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-[var(--foreground)]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
