import type { Metadata } from "next";
import GuideDirectory from "../../components/GuideDirectory";

export const metadata: Metadata = {
  title: "Website Security, Design & AI Development Guides",
  description: "Explore 95 practical guides for website security, distinctive design, frontend engineering, trustworthy content and launch readiness.",
  alternates: { canonical: "/guides" },
  openGraph: { title: "Website security, design and AI development guides", description: "Evidence-led guides for distinctive, secure and launch-ready websites.", url: "/guides", locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint website guide library" }] },
  twitter: { card: "summary_large_image", title: "Website security, design and AI development guides", description: "Evidence-led guides for distinctive, secure and launch-ready websites.", images: ["/og.png"] }
};

export default function Page() { return <GuideDirectory />; }
