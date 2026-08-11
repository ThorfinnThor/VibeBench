import type { Metadata } from "next";
import "./globals.css";

const title = "VibeBench — Wie viel Vibe steckt in deiner Website?";
const description = "Vibe-Footprint von 0 bis 100, Security-Baseline und konkrete Verbesserungen für öffentlich erreichbare Websites.";

export const metadata: Metadata = { title, description };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
