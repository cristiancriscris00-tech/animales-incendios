import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://solarisrescate.online";
const TITLE = "Solaris Rescate — animales perdidos y heridos en emergencias";
const DESCRIPTION =
  "Publica o encuentra avisos de animales perdidos, encontrados o heridos durante incendios. Gratis y sin registro.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Solaris Rescate",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Solaris Rescate — animales perdidos, encontrados y heridos en emergencias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0A09",
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
