import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const title = "VibeFootprint — Understand your website’s public footprint";
const description = "A clear 0–100 website footprint, public evidence and practical security improvements.";

export const metadata: Metadata = { title, description };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Analytics /></body></html>;
}
