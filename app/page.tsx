import type { Metadata } from "next";
import VibeFootprintHome from "../components/VibeFootprintHome";
import { auditPromoConfigured } from "../lib/audit-promo-code.mjs";

export const metadata: Metadata = {
  title: "Vibe Coding Website Checker & Security Scan",
  description: "Scan a public website for vibe-coding pattern similarity, security headers and actionable improvements. No login or source-code access required.",
  alternates: { canonical: "/" }
};

export default function Page() {
  return <VibeFootprintHome initialLanguage="en" enableAdminPreview={process.env.VIBEFOOTPRINT_ADMIN_UI === "true"} enablePromoCode={auditPromoConfigured(process.env.VIBEFOOTPRINT_PROMO_CODE)} />;
}
