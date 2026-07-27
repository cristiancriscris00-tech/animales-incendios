import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animales perdidos y encontrados — Incendios en España",
  description:
    "Publica y busca animales perdidos o encontrados durante los incendios forestales en España. Sin registro. Para emergencias llama al 112.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
