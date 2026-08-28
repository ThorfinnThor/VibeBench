import type { Metadata } from "next";
import ContactIntake from "../../components/ContactIntake";
import LegalPageShell from "../../components/LegalPageShell";
import styles from "../../components/legal-page.module.css";

export const metadata: Metadata = {
  title: "Customer Beta",
  description: "Request a VibeFootprint B2B website audit for your launch, agency handoff or client portfolio.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "VibeFootprint Customer Beta", description: "A decision-ready public-surface website audit for agencies, freelancers and founders.", url: "/contact" }
};

export default function ContactPage() {
  const cta = <><ContactIntake /><section className={styles.cta}><div><h2>Prefer a direct email?</h2><p>Write to us without the assistant. Include the public URL and the business decision you need to make.</p></div><a href="mailto:info@vibefootprint.com?subject=VibeFootprint%20Customer%20Beta">Email VibeFootprint</a></section></>;
  return <LegalPageShell eyebrow="Limited B2B customer beta" title="Turn a public scan into a launch decision." intro="For agencies, freelancers and founders who need a defensible website review before launch, handoff or client presentation." updatedAt="2026-08-28" cta={cta} notice={<><strong>No public leaderboard. No authorship accusation.</strong><p>Your review stays private and separates observable quality findings from the qualitative pattern-similarity score.</p></>}>
    <section>
      <h2>What the beta audit includes</h2>
      <ul><li>Vibe-Footprint with a clear interpretation boundary</li><li>Separate public security-header baseline</li><li>Prioritized design, engineering, content and accessibility observations</li><li>Implementation-ready remediation prompts where public evidence supports them</li><li>Launch checklist, technical appendix and a short decision call</li></ul>
    </section>
    <section>
      <h2>Best fit</h2>
      <p>The beta is designed for agencies reviewing client work, founders preparing a public launch, freelancers handing off a fast-built site and teams deciding what to improve before investing in a deeper repository or security audit.</p>
      <p>The offer is available exclusively to businesses and self-employed professionals. Scope and price are confirmed individually before any paid work begins.</p>
    </section>
    <section>
      <h2>What to send</h2>
      <ol><li>Your name and company</li><li>The public URL you are authorized to have reviewed</li><li>Whether this is a launch, handoff, redesign or portfolio review</li><li>The number of websites and your target date</li></ol>
      <p className={styles.small}>Contact: <a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a></p>
    </section>
  </LegalPageShell>;
}
