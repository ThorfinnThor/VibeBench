import type { Metadata } from "next";
import LegalPageShell from "../../components/LegalPageShell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten bei VibeFootprint.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true }
};

export default function PrivacyPage() {
  return <LegalPageShell eyebrow="Datenschutz" title="Datenschutzerklärung" intro="Diese Erklärung beschreibt, welche Daten beim Besuch, beim Website-Scan und bei einer Kontaktaufnahme tatsächlich verarbeitet werden." notice={<><strong>Datensparsame Produktgestaltung</strong><p>Scanergebnisse werden mit <code>private, no-store</code> ausgeliefert. VibeFootprint legt keinen dauerhaften Scanverlauf im Browser an und veröffentlicht keine Ergebnis-URLs oder Rankings.</p></>}>
    <section>
      <h2>1. Verantwortlicher</h2>
      <address className="legal-address"><strong>SeitenHafen361</strong><br />Inhaber: Schayan Yousefian<br />Freienwalder Str. 34<br />13359 Berlin<br />Deutschland<br /><a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a></address>
    </section>
    <section>
      <h2>2. Hosting und technische Bereitstellung</h2>
      <p>Die Website wird über Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, bereitgestellt. Beim Abruf können technisch notwendige Verbindungsdaten verarbeitet werden, insbesondere IP-Adresse, Zeitpunkt, angeforderte Ressource, HTTP-Status, Browser- und Geräteinformationen.</p>
      <p>Die Verarbeitung erfolgt zur sicheren, stabilen und effizienten Bereitstellung gemäß Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren Betrieb des Dienstes, in der Fehleranalyse und in der Abwehr von Missbrauch. Soweit Vercel als Auftragsverarbeiter tätig wird, erfolgt die Verarbeitung auf Grundlage eines Vertrags nach Art. 28 DSGVO. Drittlandübermittlungen werden über die von Vercel bereitgestellten geeigneten Garantien, insbesondere Standardvertragsklauseln, abgesichert.</p>
      <p>Technische Logs werden nur so lange aufbewahrt, wie dies für Betrieb, Sicherheit, Fehleranalyse und die vertraglich vorgegebenen Plattformfristen erforderlich ist. Wir speichern in unseren eigenen Diagnoseereignissen keine vollständige Ziel-URL und keine Scanergebnisse.</p>
    </section>
    <section>
      <h2>3. Öffentlicher Website-Scan</h2>
      <p>Wenn du einen Scan startest, verarbeiten wir die eingegebene URL, eine zufällige Request-ID, technische Messwerte und das daraus erzeugte Ergebnis. Die Verarbeitung ist erforderlich, um den ausdrücklich angeforderten Scan bereitzustellen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vorvertraglicher oder vertraglicher Nutzung und im Übrigen Art. 6 Abs. 1 lit. f DSGVO.</p>
      <p>Der Scanner ruft ausschließlich öffentlich erreichbares HTML und eine begrenzte Auswahl gleich-originiger Ressourcen ab. Die Zielwebsite kann diese Serveranfragen in ihren eigenen Logs erkennen. Zugangsdaten, interne Hosts, private Dashboards und nicht öffentliche Quellen dürfen nicht eingegeben werden.</p>
      <p>Die API-Antwort wird nicht gecacht. Ein Scanvergleich wird nur während des geöffneten Browser-Tabs im Arbeitsspeicher gehalten und beim Schließen oder Neuladen der Seite verworfen. Rohes HTML wird nicht an den Browser ausgeliefert.</p>
    </section>
    <section>
      <h2>4. Reichweitenmessung mit Vercel Web Analytics</h2>
      <p>Wir verwenden Vercel Web Analytics, um aggregierte Seitenaufrufe und wenige niedrig aufgelöste Produktmetriken zu verstehen. Das Werkzeug verwendet nach Angaben des Anbieters keine Drittanbieter-Cookies und ordnet Daten nicht dauerhaft einer identifizierbaren Person zu.</p>
      <p>Bei Scanereignissen übermitteln wir ausschließlich Ergebnisstatus, grobe Laufzeitkategorie, Auswertungsbreite beziehungsweise technische Fehlerkategorie. Ziel-URL, Domain, IP-Adresse, Request-ID und konkretes Scanergebnis werden nicht als benutzerdefinierte Event-Eigenschaften übertragen.</p>
      <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist die datensparsame Messung von Nutzung, technischer Zuverlässigkeit und Produktqualität. Sollten künftig einwilligungspflichtige Analyse-, Marketing- oder Endgerätezugriffe ergänzt werden, werden diese erst nach einer entsprechenden Einwilligung aktiviert.</p>
    </section>
    <section>
      <h2>5. Kontaktaufnahme und Kundenanfragen</h2>
      <p>Bei einer Kontaktaufnahme per E-Mail verarbeiten wir deine Kontaktdaten, Nachricht und die für die Bearbeitung erforderlichen Geschäftsinformationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Kommunikation der Vertragsanbahnung oder Vertragserfüllung dient, ansonsten Art. 6 Abs. 1 lit. f DSGVO.</p>
      <p>Anfragen werden gelöscht, wenn sie abschließend bearbeitet sind und keine gesetzlichen Aufbewahrungsfristen oder berechtigten Nachweisinteressen entgegenstehen. Vertrags- und Rechnungsunterlagen werden entsprechend den gesetzlichen handels- und steuerrechtlichen Fristen aufbewahrt.</p>
    </section>
    <section>
      <h2>6. Empfänger und keine automatisierte Personenentscheidung</h2>
      <p>Empfänger können Hosting-, Infrastruktur-, Kommunikations- und – nach gesonderter Einführung – Zahlungsdienstleister sein. Eine Weitergabe zu Werbezwecken findet nicht statt.</p>
      <p>Der Vibe-Footprint bewertet die öffentlich ausgelieferte technische Oberfläche einer Website. Er ist keine Entscheidung über eine natürliche Person und entfaltet keine rechtliche oder vergleichbar erhebliche Wirkung im Sinne von Art. 22 DSGVO.</p>
    </section>
    <section>
      <h2>7. Deine Rechte</h2>
      <p>Du hast im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden.</p>
      <p>Zur Ausübung deiner Rechte genügt eine E-Mail an <a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a>. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, insbesondere bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit.</p>
    </section>
    <section>
      <h2>8. Sicherheit und Aktualisierung</h2>
      <p>Wir setzen technische und organisatorische Maßnahmen ein, darunter HTTPS, restriktive Security-Header, begrenzte Antwortgrößen, IP-Prüfungen, Rate Limits und minimierte Diagnoseereignisse. Diese Erklärung wird angepasst, wenn sich Anbieter, Datenflüsse oder Produktfunktionen wesentlich ändern.</p>
    </section>
  </LegalPageShell>;
}
