import type { Metadata } from "next";
import LegalPageShell from "../../components/LegalPageShell";
import styles from "../../components/legal-page.module.css";

export const metadata: Metadata = {
  title: "Kontakt und Zahlungs-Support",
  description: "Kontakt für Fragen zu VibeFootprint Website-Scans und Stripe-Zahlungen.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  const cta = <section className={styles.cta}><div><h2>Wir helfen direkt.</h2><p>Schreib uns bei Fragen zu einem Scan oder einer Zahlung.</p></div><a href="mailto:info@vibefootprint.com?subject=VibeFootprint%20Scan-Support">E-Mail senden</a></section>;
  return <LegalPageShell eyebrow="Kontakt" title="Scan- und Zahlungs-Support" intro="VibeFootprint verkauft genau einen Website-Scan pro Bestellung. Bei technischen oder Zahlungsfragen erreichst du uns direkt per E-Mail." updatedAt="2026-08-28" cta={cta}>
    <section>
      <h2>Kontakt</h2>
      <p><a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a></p>
      <p>Bitte nenne die öffentliche Website-URL, den ungefähren Zahlungszeitpunkt und die E-Mail-Adresse deiner Stripe-Bestätigung. Sende niemals vollständige Kartendaten, Prüfziffern oder Passwörter.</p>
    </section>
    <section>
      <h2>Technisch fehlgeschlagener Scan</h2>
      <p>Deine bestätigte Zahlung bleibt an die beim Checkout angegebene URL gebunden. Du kannst den Scan für dieselbe URL erneut starten. Falls er dauerhaft nicht abgeschlossen werden kann, prüfen wir den Vorgang anhand deiner Stripe-Bestätigung.</p>
    </section>
  </LegalPageShell>;
}
