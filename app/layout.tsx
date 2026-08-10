import type { Metadata } from "next";
import "./globals.css";

const title = "VibeBench — Public Website Evidence Scanner";
const description = "Inspect public builder artifacts while keeping general stack and structural signals explicitly non-attributive.";

export const metadata: Metadata = { title, description };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
