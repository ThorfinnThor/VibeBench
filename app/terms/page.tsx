import type { Metadata } from "next";
import LegalPageShell from "../../components/LegalPageShell";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen",
  description: "B2B-Nutzungsbedingungen für den VibeFootprint Website-Scan und Diagnosebericht.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true }
};

export default function TermsPage() {
  return <LegalPageShell eyebrow="B2B-Nutzungsrahmen" title="Nutzungsbedingungen" intro="Regeln für den einmalig bezahlten VibeFootprint Website-Scan." notice={<><strong>Ausschließlich für Unternehmer</strong><p>VibeFootprint richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB. Mit dem Checkout bestätigst du die Nutzung in unternehmerischer oder selbstständiger Tätigkeit.</p></>}>
    <section>
      <h2>1. Anbieter und Geltungsbereich</h2>
      <p>Anbieter ist SeitenHafen361, Inhaber Schayan Yousefian, Freienwalder Str. 34, 13359 Berlin. Diese Bedingungen gelten für den über die Website gekauften VibeFootprint-Scan.</p>
    </section>
    <section>
      <h2>2. Leistungsgegenstand</h2>
      <p>VibeFootprint untersucht eine öffentlich erreichbare Website-Oberfläche in einem begrenzten technischen Umfang. Der Dienst kann einen qualitativen Ähnlichkeitsindex, eine separate Bewertung ausgewählter öffentlicher Security-Header, beobachtete Hinweise und priorisierte Handlungsvorschläge bereitstellen.</p>
      <p>Der konkrete Funktionsumfang richtet sich nach der beim Kauf angezeigten Produkt- und Modellversion. Ein Kauf umfasst die Analyse der im Stripe-Checkout bezeichneten öffentlichen URL sowie die Anzeige des daraus erzeugten vollständigen Scan-Reports.</p>
    </section>
    <section>
      <h2>3. Vertragsschluss, Preis und Zahlung</h2>
      <p>Der Vertrag kommt zustande, wenn du im Stripe-Checkout die Zahlung für den bezeichneten Website-Scan abschließt. Während der Launch-Aktion kostet ein Scan einmalig 4,99 € statt des vorgesehenen regulären Preises von 49,99 €. Maßgeblich ist stets der im Checkout angezeigte Gesamtbetrag.</p>
      <p>Die Zahlung wird über Stripe abgewickelt. Der Scan ist an die beim Checkout angegebene öffentliche URL gebunden und kann nicht auf eine andere URL übertragen werden. Wiederholungsversuche für dieselbe URL sind zulässig, wenn dies zur technischen Durchführung des bezahlten Scans erforderlich ist.</p>
    </section>
    <section>
      <h2>4. Aussagegrenzen</h2>
      <ul>
        <li>Der Vibe-Footprint ist ein unkalibrierter qualitativer Ähnlichkeitsindex.</li>
        <li>Er beweist weder AI-Nutzung, Autorenschaft, Codeherkunft noch einen Anteil generierten Codes.</li>
        <li>Der Security-Wert ist kein Penetrationstest und keine Sicherheitszertifizierung.</li>
        <li>Der Dienst ersetzt keine Repository-, Rechts-, Datenschutz-, Accessibility-, Performance- oder Anwendungssicherheitsprüfung.</li>
        <li>Jedes Ergebnis ist eine Momentaufnahme der konkret ausgelieferten öffentlichen Oberfläche.</li>
      </ul>
    </section>
    <section>
      <h2>5. Zulässige Nutzung</h2>
      <p>Du darfst nur Websites untersuchen, zu deren Prüfung du berechtigt bist oder für die eine entsprechende Beauftragung vorliegt. Nicht zulässig sind insbesondere Zugangsdaten in URLs, interne Systeme, private Dashboards, Umgehungsversuche, missbräuchliche Massenscans, Belastungstests und die Nutzung zur öffentlichen Herabsetzung Dritter.</p>
      <p>Ergebnisse dürfen nicht als Beweis für Fehlverhalten, AI-Autorenschaft oder mangelnde Fachkunde dargestellt werden. Vor einer Veröffentlichung oder geschäftlich erheblichen Entscheidung sind die beobachteten Tatsachen fachlich zu überprüfen.</p>
    </section>
    <section>
      <h2>6. Durchführung und technische Fehler</h2>
      <p>Scans können wegen Rate Limits, Zielserver-Verhalten, Netzwerkproblemen, Schutzsystemen, Größenlimits oder Wartung technisch fehlschlagen. Ein technischer Fehler wird nicht als niedriger oder hoher Score interpretiert. In diesem Fall kann der Scan für dieselbe bezahlte URL erneut gestartet werden. Kann der Scan dauerhaft nicht erbracht werden, wende dich mit der Stripe-Bestätigung an <a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a>; zwingende gesetzliche Ansprüche bleiben unberührt.</p>
      <p>Der Kunde stellt vollständige Informationen bereit, prüft die fachliche Eignung von Empfehlungen und testet Änderungen vor dem Produktiveinsatz.</p>
    </section>
    <section>
      <h2>7. Rechte an Reports und Inhalten</h2>
      <p>Bezahlte Reports dürfen für interne Geschäfts-, Kunden- und Umsetzungszwecke verwendet werden. Marken, Methodik, Software und redaktionelle Inhalte verbleiben beim Anbieter beziehungsweise den jeweiligen Rechteinhabern. Eine Weitergabe darf die Aussagegrenzen nicht entfernen oder verfälschen.</p>
    </section>
    <section>
      <h2>8. Gewährleistung und Haftung</h2>
      <p>Wir schulden die vereinbarte technische Analyse, nicht einen bestimmten Score, ein bestimmtes Geschäftsergebnis oder die vollständige Erkennung aller Probleme. Daten und Empfehlungen werden mit angemessener Sorgfalt erstellt, können aber aufgrund der begrenzten öffentlichen Evidenz unvollständig oder fehlerhaft sein.</p>
      <p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Schäden aus der Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang ausdrücklich übernommener Garantien. Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen. Zwingende gesetzliche Haftung bleibt unberührt.</p>
    </section>
    <section>
      <h2>9. Hinweise, Sperrung und Korrekturen</h2>
      <p>Wir können Scans oder Zugänge bei Missbrauch, Sicherheitsrisiken oder Rechtsverletzungen begrenzen. Hinweise zu einer Domain, einem Ergebnis oder einer möglichen Rechtsverletzung können an <a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a> gesendet werden. Nachvollziehbare Korrektur- und Sperranfragen werden geprüft.</p>
    </section>
    <section>
      <h2>10. Schlussbestimmungen</h2>
      <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Soweit gesetzlich zulässig, ist Gerichtsstand Berlin. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
    </section>
  </LegalPageShell>;
}
