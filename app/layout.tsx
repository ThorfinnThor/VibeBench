import type { Metadata } from "next";
import "./globals.css";

const title = "VibeBench — AI Website Evidence Scanner";
const description = "Inspect public deployment artifacts and structural signals that may indicate AI-assisted vibe coding.";

export const metadata: Metadata = { title, description };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}

