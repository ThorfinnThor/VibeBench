import type { Metadata } from "next";
import LegalPageShell from "../../components/LegalPageShell";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontaktangaben von VibeFootprint.",
  alternates: { canonical: "/imprint" },
  robots: { index: false, follow: true }
};

export default function ImprintPage() {
  return <LegalPageShell eyebrow="Anbieterkennzeichnung" title="Impressum" intro="Verantwortlicher Anbieter des digitalen Dienstes VibeFootprint und der dazugehörigen redaktionellen Inhalte.">
    <section>
      <h2>Angaben gemäß § 5 DDG</h2>
      <address className="legal-address">
        <strong>SeitenHafen361</strong><br />
        Einzelunternehmen<br />
        Inhaber: Schayan Yousefian<br />
        Freienwalder Str. 34<br />
        13359 Berlin<br />
        Deutschland
      </address>
    </section>
    <section>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href="mailto:info@vibefootprint.com">info@vibefootprint.com</a></p>
      <p>Diese Adresse ist zugleich die zentrale Kontaktstelle für Produktanfragen, Datenschutzanliegen, Hinweise zu Scanergebnissen und Beschwerden.</p>
    </section>
    <section>
      <h2>Inhaltlich verantwortlich</h2>
      <p>Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV:</p>
      <address className="legal-address">Schayan Yousefian<br />Freienwalder Str. 34<br />13359 Berlin</address>
    </section>
    <section>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Das Angebot richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB.</p>
      <p>Die frühere europäische Plattform zur Online-Streitbeilegung wurde zum 20. Juli 2025 eingestellt; ein Link zu dieser Plattform wird daher nicht bereitgestellt.</p>
    </section>
  </LegalPageShell>;
}
