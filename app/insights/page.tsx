import type { Metadata } from "next";
import EditorialDirectory from "../../components/EditorialDirectory";

export const metadata: Metadata = {
  title: "Vibe Coding Website Insights and Audit Guides",
  description: "Original field guides, comparisons and review frameworks for recognizing vibe-coding patterns and improving AI-assisted websites responsibly.",
  alternates: { canonical: "/insights" },
  openGraph: { title: "VibeFootprint editorial guides", description: "Evidence-led guidance for websites built at AI speed.", url: "/insights", locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint editorial guides" }] }
};

export default function Page() { return <EditorialDirectory />; }
