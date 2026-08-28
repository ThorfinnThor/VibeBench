import type { Metadata } from "next";
import LegalPageShell from "../../components/LegalPageShell";
import styles from "../../components/legal-page.module.css";

export const metadata: Metadata = {
  title: "Customer Beta",
  description: "Request a VibeFootprint B2B website audit for your launch, agency handoff or client portfolio.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "VibeFootprint Customer Beta", description: "A decision-ready public-surface website audit for agencies, freelancers and founders.", url: "/contact" }
};

const mailto = "mailto:info@vibefootprint.com?subject=VibeFootprint%20Customer%20Beta&body=Name%20and%20company%3A%0AWebsite%20URL%3A%0ANumber%20of%20websites%3A%0AMain%20launch%20or%20handoff%20question%3A%0A";

export default function ContactPage() {
  const cta = <section className={styles.cta}><div><h2>Request your founding-customer audit.</h2><p>Send the public website URL and the decision you need to make. We will reply with scope, timing and a clear B2B offer.</p></div><a href={mailto}>Email VibeFootprint</a></section>;
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
