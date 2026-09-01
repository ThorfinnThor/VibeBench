import type { Metadata } from "next";
import VibeFootprintHome from "../components/VibeFootprintHome";
import { auditPromoConfigured } from "../lib/audit-promo-code.mjs";

export const metadata: Metadata = {
  title: "AI Website Audit & Vibe Coding Checker",
  description: "Scan a public website for AI-assisted patterns, security headers and launch-ready improvements. Free preview, no login or source-code access.",
  alternates: { canonical: "/" }
};

export default function Page() {
  return <VibeFootprintHome initialLanguage="en" enableAdminPreview={process.env.VIBEFOOTPRINT_ADMIN_UI === "true"} enablePromoCode={auditPromoConfigured(process.env.VIBEFOOTPRINT_PROMO_CODE)} />;
}
