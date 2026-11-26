import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reel-to-Trip von CHECK24 · Feature-Konzept",
  description: "„Da will ich auch mal hin!“ Reise-Reel teilen, KI erkennt das Ziel, Bucket List bis es ins Budget passt. Inoffizielles Konzept von Jan-Hendrik Höltkemeier.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
