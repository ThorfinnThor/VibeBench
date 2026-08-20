import type { Metadata } from "next";
import VibeFootprintHome from "../../components/VibeFootprintHome";

export const metadata: Metadata = {
  title: "Vibe-Coding-Website-Checker & Security-Scan",
  description: "Prüfe eine öffentliche Website auf Vibe-Coding-Muster, Security-Header und konkrete Verbesserungsmöglichkeiten – ohne Login oder Quellcodezugriff.",
  alternates: {
    canonical: "/de",
    languages: { "en-US": "/", "de-DE": "/de", "x-default": "/" }
  }
};

export default function GermanPage() {
  return <VibeFootprintHome initialLanguage="de" />;
}

