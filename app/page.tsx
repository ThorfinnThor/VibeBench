"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getVerdictPresentation } from "../lib/result-presentation.mjs";

type Evidence = { type: string; label: string; strength: string; source?: string; marker?: string };
type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type VerdictLevel = "direct" | "indicative" | "indeterminate";
type ScanResult = {
  ok: boolean;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  verdict?: { level: VerdictLevel; title: string; summary: string };
  directEvidence?: Evidence[];
  contextEvidence?: Evidence[];
  headerEvidence?: Evidence[];
  manifestEvidence?: Evidence[];
  stackSignals?: string[];
  structuralHints?: string[];
  metrics?: Record<string, number>;
  manifestScan?: { linked: boolean; fetched: boolean; validJson: boolean; bytes: number; truncated: boolean };
  warning?: string;
};

const metricLabels: Record<string, string> = {
  htmlBytes: "HTML bytes", scriptTags: "Scripts", stylesheetLinks: "Stylesheets", inlineStyles: "Inline styles",
  dataAttributes: "Data attributes", forms: "Forms", headings: "Headings", images: "Images",
  sameOriginAssets: "Assets scanned", assetBytes: "Asset bytes", assetFetchErrors: "Asset errors",
  truncatedAssets: "Assets truncated"
};

const structuralHintLabels: Record<string, string> = {
  "dense-modern-stack": "Dense modern stack",
  "high-data-attribute-density": "High data-attribute density",
  "script-heavy-static-shell": "Script-heavy static shell"
};

const fallbackTechnicalOutcome: TechnicalOutcome = {
  code: "connection_failed",
  title: "Scan-Dienst nicht erreichbar",
  summary: "Die technische Untersuchung konnte nicht gestartet oder vollständig empfangen werden. Es liegt kein Klassifikationsergebnis vor.",
  action: "Verbindung prüfen und später erneut versuchen.",
  retryable: true
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  async function scan(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(35_000)
      });
      const payload = await response.json().catch(() => null);
      setResult(payload?.ok === true || payload?.ok === false ? payload : { ok: false, technicalOutcome: fallbackTechnicalOutcome });
    } catch {
      setResult({ ok: false, technicalOutcome: fallbackTechnicalOutcome });
    } finally {
      setLoading(false);
    }
  }

  const presentation = result?.ok && result.verdict ? getVerdictPresentation(result.verdict.level) : null;
  const technicalOutcome = result && !result.ok ? result.technicalOutcome || fallbackTechnicalOutcome : null;

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="VibeBench Startseite"><span className="brand-mark">VB</span><strong>VibeBench</strong></a>
      <span className="version">Evidence scanner · v0.1.2</span>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span /> Public deployment forensics</p>
        <h1>Was ist<br /><em>sichtbar?</em></h1>
        <p className="lede">VibeBench trennt konkrete Builder-Artefakte von allgemeinen Web-Mustern. Es untersucht öffentliche Evidenz – nicht die Autorenschaft einer Website.</p>
      </div>
      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <label htmlFor="url">Öffentliche Website-URL</label>
        <div className="scan-input">
          <span>URL</span>
          <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" autoComplete="url" inputMode="url" required />
          <button disabled={loading}>{loading ? "Öffentliche Evidenz wird geprüft …" : "Website prüfen →"}</button>
        </div>
        <p>Nur öffentliche HTTP(S)-Seiten · private Netzwerke blockiert · begrenzter HTML- und Same-Origin-Asset-Scan</p>
      </form>
    </section>

    <aside className="evidence-disclosure" aria-label="Wichtige Interpretationsgrenze">
      <span>Holdout-Erkenntnis</span>
      <strong>Ein moderner Stack ist kein AI-Beweis.</strong>
      <p>Frameworks, Libraries und komplexe DOM-Muster werden ausschließlich als technischer Kontext gezeigt. Nur konkrete Builder-Artefakte tragen eine Attribution.</p>
    </aside>

    {result && <section className="results" aria-live="polite" ref={resultsRef} tabIndex={-1}>
      {!result.ok && technicalOutcome ? <div className="error-card">
        <div className="error-code"><span>Technischer Ausgang</span><strong>{technicalOutcome.code.replaceAll("_", " ")}</strong></div>
        <div>
          <p className="eyebrow"><span /> Kein Klassifikationsergebnis</p>
          <h2>{technicalOutcome.title}</h2>
          <p>{technicalOutcome.summary}</p>
          <p className="error-action"><strong>Nächster Schritt:</strong> {technicalOutcome.action}</p>
          {result.error && <details><summary>Technisches Detail</summary><code>{result.error}</code></details>}
        </div>
      </div> : result.ok && result.verdict && presentation ? <>
        <div className={`verdict verdict-${result.verdict.level}`}>
          <div className="verdict-index">01</div>
          <div>
            <p className="eyebrow"><span /> {presentation.eyebrow}</p>
            <h2>{presentation.title}</h2>
            <p>{presentation.summary}</p>
            <div className="claim-boundary">
              <div><span>Aussage</span><strong>{presentation.claim}</strong></div>
              <div><span>Grenze</span><strong>{presentation.boundary}</strong></div>
            </div>
          </div>
          <div className="status-orbit"><span>{presentation.status}</span></div>
        </div>

        <div className="result-grid">
          <article className="direct-card">
            <p className="card-number">02 / Attribution evidence</p>
            <h3>Builder-Artefakte</h3>
            {result.directEvidence?.length ? <div className="chips direct-chips">{result.directEvidence.map((item) => <span key={`${item.label}-${item.marker}`}>{item.label}<small>{item.source === "same-origin-asset" ? "Same-origin asset" : "Page / URL"}{item.marker ? ` · ${item.marker}` : ""}</small></span>)}</div> : <p className="empty-state">Keine direkten Builder-Marker in der URL, im HTML oder in den begrenzt geprüften Same-Origin-Assets gefunden. Das ist keine Human-Zuordnung.</p>}
          </article>
          <article className="context-card">
            <p className="card-number">03 / Non-attributive context</p>
            <div className="context-label">Keine Attribution</div>
            <h3>Stack & Hosting</h3>
            <div className="chips context-chips">{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label)].map((label) => <span key={label}>{label}<small>Context only</small></span>)}</div>
            {!result.stackSignals?.length && !result.contextEvidence?.length && <p className="empty-state">Kein bekannter Stack- oder Hosting-Kontext sichtbar.</p>}
          </article>
          <article className="context-card">
            <p className="card-number">04 / Response context</p>
            <div className="context-label">Keine Attribution</div>
            <h3>Header & Manifest</h3>
            <div className="chips context-chips">{[...(result.headerEvidence || []), ...(result.manifestEvidence || [])].map((item) => <span key={`${item.type}-${item.label}`}>{item.label}<small>Context only</small></span>)}</div>
            {!result.headerEvidence?.length && !result.manifestEvidence?.length && <p className="empty-state">Keine bekannten Hosting-Header und kein gültiges Same-Origin-Manifest gefunden.</p>}
            {result.manifestScan?.linked && !result.manifestScan.validJson && <p className="empty-state">Ein Manifest ist verlinkt, konnte aber nicht als gültiges JSON ausgewertet werden.</p>}
            {result.manifestScan?.validJson && <p className="empty-state">Manifest: {result.manifestScan.bytes.toLocaleString("de-DE")} Bytes{result.manifestScan.truncated ? " · gekürzt" : ""}</p>}
          </article>
          <article className="metrics-card context-card">
            <p className="card-number">05 / Surface metrics</p>
            <div className="context-label">Messwerte, keine Attribution</div>
            <h3>HTML-Struktur</h3>
            <dl>{Object.entries(result.metrics || {}).map(([key, value]) => <div key={key}><dt>{metricLabels[key] || key}</dt><dd>{value.toLocaleString("de-DE")}</dd></div>)}</dl>
            <div className="hint-block">
              <p>Allgemeine Strukturmuster</p>
              {result.structuralHints?.length
                ? <div className="chips hint-chips">{result.structuralHints.map((hint) => <span key={hint}>{structuralHintLabels[hint] || hint}<small>Generic · non-attributive</small></span>)}</div>
                : <p className="empty-state">Keine Kombination allgemeiner Strukturmuster erkannt.</p>}
            </div>
          </article>
        </div>

        <div className="scan-meta">
          <div><span>Resolved URL</span><a href={result.resolvedUrl} target="_blank" rel="noreferrer">{result.resolvedUrl}</a></div>
          <div><span>Target HTTP</span><strong>{result.httpStatus}</strong></div>
          <div><span>Scan time</span><strong>{result.analyzedAt ? new Date(result.analyzedAt).toLocaleString("de-DE") : "—"}</strong></div>
        </div>
        <p className="warning">{result.warning || "Pilotischer Evidenz-Scan – keine kalibrierte AI-Wahrscheinlichkeit und kein Beweis für Autorenschaft."}</p>
      </> : null}
    </section>}

    <section className="method">
      <p className="eyebrow"><span /> Ergebnislogik</p>
      <div className="method-grid">
        <h2>Vier Ausgänge.<br />Keine Blackbox.</h2>
        <ol>
          <li><span>01</span><div><strong>Direkte Evidenz</strong><p>Konkreter, öffentlich sichtbarer Builder-Marker. Hohe Evidenzstufe, aber kein Beweis für Autorenschaft.</p></div></li>
          <li><span>02</span><div><strong>Struktureller Kontext</strong><p>Moderne Stack- und DOM-Muster. Technisch interessant, ausdrücklich ohne AI-Attribution.</p></div></li>
          <li><span>03</span><div><strong>Offenes Ergebnis</strong><p>Keine ausreichende sichtbare Evidenz. Das ist weder eine AI- noch eine Human-Zuordnung.</p></div></li>
          <li><span>04</span><div><strong>Technischer Fehler</strong><p>Blocked, Timeout, Größenlimit oder ungültige URL. Separat berichtet und nie als Klassifikation gezählt.</p></div></li>
        </ol>
      </div>
    </section>

    <footer><strong>VibeBench</strong><p>Evidence research preview · no authorship probability</p><a href="https://github.com/ThorfinnThor/VibeBench">GitHub ↗</a></footer>
  </main>;
}
