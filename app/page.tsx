"use client";

import { FormEvent, useState } from "react";

type Evidence = { type: string; label: string; strength: string };
type ScanResult = {
  ok: boolean;
  error?: string;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  verdict?: { level: "direct" | "indicative" | "indeterminate"; title: string; summary: string };
  directEvidence?: Evidence[];
  contextEvidence?: Evidence[];
  stackSignals?: string[];
  structuralHints?: string[];
  metrics?: Record<string, number>;
  warning?: string;
};

const metricLabels: Record<string, string> = {
  htmlBytes: "HTML bytes", scriptTags: "Scripts", stylesheetLinks: "Stylesheets", inlineStyles: "Inline styles",
  dataAttributes: "Data attributes", forms: "Forms", headings: "Headings", images: "Images"
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function scan(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      setResult(await response.json());
    } catch {
      setResult({ ok: false, error: "Der Scan-Dienst ist gerade nicht erreichbar." });
    } finally {
      setLoading(false);
    }
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="VibeBench Startseite"><span className="brand-mark">VB</span><strong>VibeBench</strong></a>
      <span className="version">URL detector · v0.1</span>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span /> Public deployment forensics</p>
        <h1>Was steckt<br />in dieser <em>Website?</em></h1>
        <p className="lede">VibeBench sucht nach öffentlich sichtbaren Hinweisen auf AI-Builder und Vibe-Coding – transparent, technisch und ohne falsche Gewissheit.</p>
      </div>
      <form className="scan-panel" onSubmit={scan}>
        <label htmlFor="url">Öffentliche Website-URL</label>
        <div className="scan-input">
          <span>https://</span>
          <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="example.com" autoComplete="url" required />
          <button disabled={loading}>{loading ? "Analysiere …" : "Website prüfen →"}</button>
        </div>
        <p>Nur öffentliche HTTP(S)-Seiten · private Netzwerke werden blockiert · max. 1,5 MB HTML</p>
      </form>
    </section>

    {result && <section className="results" aria-live="polite">
      {!result.ok ? <div className="error-card"><span>Scan nicht abgeschlossen</span><strong>{result.error}</strong></div> : <>
        <div className={`verdict verdict-${result.verdict?.level}`}>
          <div className="verdict-index">01</div>
          <div><p className="eyebrow"><span /> Ergebnis</p><h2>{result.verdict?.title}</h2><p>{result.verdict?.summary}</p></div>
          <div className="status-orbit"><span>{result.verdict?.level === "direct" ? "Direct" : result.verdict?.level === "indicative" ? "Hints" : "Open"}</span></div>
        </div>

        <div className="result-grid">
          <article>
            <p className="card-number">02 / Builder evidence</p>
            <h3>Direkte Artefakte</h3>
            {result.directEvidence?.length ? <div className="chips direct-chips">{result.directEvidence.map((item) => <span key={item.label}>{item.label}<small>direct</small></span>)}</div> : <p className="empty-state">Keine direkten Builder-Marker im initialen HTML gefunden.</p>}
          </article>
          <article>
            <p className="card-number">03 / Context</p>
            <h3>Stack & Hosting</h3>
            <div className="chips">{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label)].map((label) => <span key={label}>{label}</span>)}</div>
            {!result.stackSignals?.length && !result.contextEvidence?.length && <p className="empty-state">Kein bekannter Stack-Kontext sichtbar.</p>}
          </article>
          <article className="metrics-card">
            <p className="card-number">04 / Surface metrics</p>
            <h3>Struktur des HTML</h3>
            <dl>{Object.entries(result.metrics || {}).map(([key, value]) => <div key={key}><dt>{metricLabels[key] || key}</dt><dd>{value.toLocaleString("de-DE")}</dd></div>)}</dl>
          </article>
        </div>

        <div className="scan-meta">
          <div><span>Resolved URL</span><a href={result.resolvedUrl} target="_blank" rel="noreferrer">{result.resolvedUrl}</a></div>
          <div><span>HTTP</span><strong>{result.httpStatus}</strong></div>
          <div><span>Scan time</span><strong>{result.analyzedAt ? new Date(result.analyzedAt).toLocaleString("de-DE") : "—"}</strong></div>
        </div>
        <p className="warning">{result.warning}</p>
      </>}
    </section>}

    <section className="method">
      <p className="eyebrow"><span /> Methodik</p>
      <div className="method-grid">
        <h2>Drei Ebenen.<br />Keine Blackbox.</h2>
        <ol>
          <li><span>01</span><div><strong>Direkte Evidenz</strong><p>Builder-spezifische Marker, die im Deployment erhalten geblieben sind.</p></div></li>
          <li><span>02</span><div><strong>Portabler Kontext</strong><p>Hosting, Frameworks und Libraries – hilfreich, aber allein kein AI-Beweis.</p></div></li>
          <li><span>03</span><div><strong>Struktur</strong><p>DOM-, Asset- und UI-Muster für builderunabhängige Forschung.</p></div></li>
        </ol>
      </div>
    </section>

    <footer><strong>VibeBench</strong><p>Research preview · Pilot diagnostics only</p><a href="https://github.com/ThorfinnThor/VibeBench">GitHub ↗</a></footer>
  </main>;
}

