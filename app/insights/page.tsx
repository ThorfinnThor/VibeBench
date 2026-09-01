import type { Metadata } from "next";
import EditorialDirectory from "../../components/EditorialDirectory";

export const metadata: Metadata = {
  title: "AI Website Audit Insights & Data Briefs",
  description: "Read evidence-led insights, data briefs and review frameworks for AI-assisted websites, public scan interpretation and safer product launches.",
  authors: [{ name: "VibeFootprint Editorial", url: "/about" }],
  alternates: { canonical: "/insights" },
  openGraph: { title: "AI website audit insights and data briefs", description: "Evidence-led insights for AI-assisted websites, public scan interpretation and safer launches.", url: "/insights", locale: "en_US", images: [{ url: "/og.png", width: 1731, height: 909, alt: "VibeFootprint AI website audit insights" }] },
  twitter: { card: "summary_large_image", title: "AI website audit insights and data briefs", description: "Evidence-led insights for AI-assisted websites, public scan interpretation and safer launches.", images: ["/og.png"] }
};

export default function Page() { return <EditorialDirectory />; }
