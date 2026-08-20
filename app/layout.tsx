import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { absoluteUrl, siteOrigin } from "../lib/site";
import "./globals.css";

const title = "VibeFootprint — Vibe Coding Website Checker";
const description = "A clear 0–100 website footprint, public evidence and practical security improvements.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: title, template: "%s | VibeFootprint" },
  description,
  applicationName: "VibeFootprint",
  manifest: "/manifest.webmanifest",
  keywords: ["vibe coding website checker", "vibe code detector", "website security scan", "AI-built website checker"],
  authors: [{ name: "VibeFootprint" }],
  creator: "VibeFootprint",
  publisher: "VibeFootprint",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    siteName: "VibeFootprint",
    title,
    description,
    url: "/",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint — See the public patterns. Improve what matters." }]
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  category: "technology"
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: "VibeFootprint",
      url: absoluteUrl("/")
    },
    {
      "@type": "WebApplication",
      "@id": absoluteUrl("/#application"),
      name: "VibeFootprint",
      url: absoluteUrl("/"),
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description,
      inLanguage: "en",
      isAccessibleForFree: true,
      publisher: { "@id": absoluteUrl("/#organization") }
    }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Analytics /></body></html>;
}
