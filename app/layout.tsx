import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reel-to-Trip · Inoffizieller Konzept-Prototyp",
  description: "Reise-Reel teilen → KI erkennt das Ziel → Bucket List & Preisalarm. Inoffizieller Prototyp von Jan-Hendrik Höltkemeier.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
