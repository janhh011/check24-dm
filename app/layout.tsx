import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reel-to-Trip · Konzept-Prototyp für CHECK24",
  description: "Reels per DM teilen → Claude erkennt das Reiseziel → Bucket List & Preisalarm",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
