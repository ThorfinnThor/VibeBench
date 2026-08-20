import type { Metadata } from "next";
import GuideDirectory from "../../components/GuideDirectory";

export const metadata: Metadata = {
  title: "Website Security, Design and Engineering Guides",
  description: "Explore 95 practical guides for website security, distinctive design, frontend engineering, trustworthy content, launch workflows and VibeFootprint interpretation.",
  alternates: { canonical: "/guides" },
  openGraph: { title: "VibeFootprint website guide library", description: "Evidence-led guides for a more distinctive, secure and reliable website.", url: "/guides", locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint website guide library" }] }
};

export default function Page() { return <GuideDirectory />; }
