import type { Metadata } from "next";
import VibeFootprintHome from "../components/VibeFootprintHome";

export const metadata: Metadata = {
  title: "Vibe Coding Website Checker & Security Scan",
  description: "Scan a public website for vibe-coding pattern similarity, security headers and actionable improvements. No login or source-code access required.",
  alternates: {
    canonical: "/",
    languages: { "en-US": "/", "de-DE": "/de", "x-default": "/" }
  }
};

export default function Page() {
  return <VibeFootprintHome initialLanguage="en" />;
}
