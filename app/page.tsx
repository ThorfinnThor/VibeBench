"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { parseScanPayload } from "../lib/scan-contract.mjs";
import release from "../release/v0.4.json";

type Evidence = { type: string; label: string; strength: string; source?: string; marker?: string };
type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type ScoreBand = { id: string; label: string; shortLabel: string; summary: string };
type ScoreDriver = { feature: string; label: string; description: string; contribution: number; direction: "raises" | "lowers"; state: "detected" | "not-detected" | "measured"; unit: string };
type SecurityCheck = { id: string; title: string; status: "pass" | "warn" | "fail"; detail: string; action: string };
type Recommendation = { id: string; category: string; priority: "high" | "medium" | "low"; title: string; why: string; action: string; basis: "observed" | "guidance" };
type EvidenceCoverage = { level: "broad" | "standard" | "limited"; label: string; summary: string; affectsScore: false; scope: { html: string; assetsDiscovered: number; assetsSelected: number; assetCandidates: number; assetsFetched: number; assetErrors: number; truncatedAssets: number; manifestLinked: boolean; manifestFetched: boolean } };
type ScanResult = {
  apiVersion: string;
  ok: boolean;
  requestId?: string;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  vibeScore?: { score: number; probability: number; band: ScoreBand; threshold: number; aboveValidatedThreshold: boolean; meaning: string; caveat: string };
  scoreDrivers?: { raises: ScoreDriver[]; lowers: ScoreDriver[]; unit: string; baseLogit: number };
  evidenceCoverage?: EvidenceCoverage;
  security?: { score: number; checks: SecurityCheck[] };
  recommendations?: Recommendation[];
  model?: { version: string; independentHoldout: number; precision: number; recall: number; f1: number; confirmationStatus?: string; performanceClaimCurrent?: boolean };
  directEvidence?: Evidence[];
  directBuilderCount?: number;
  contextEvidence?: Evidence[];
  headerEvidence?: Evidence[];
  manifestEvidence?: Evidence[];
  stackSignals?: string[];
  structuralHints?: string[];
  metrics?: Record<string, number>;
  assetScan?: { discovered: number; selected: number; ignoredByCap: number; candidates: number; fetched: number; errors: number; bytes: number; truncated: number };
  warning?: string;
};

const fallbackTechnicalOutcome: TechnicalOutcome = {
  code: "connection_failed",
  title: "Scan-Dienst nicht erreichbar",
  summary: "Die Website konnte gerade nicht vollständig untersucht werden. Es wurde kein Score erzeugt.",
  action: "URL und Verbindung prüfen und den Scan anschließend erneut starten.",
  retryable: true
};

const incompatibleTechnicalOutcome: TechnicalOutcome = {
  code: "incompatible_response",
  title: "Antwort nicht kompatibel",
  summary: "Der Scan-Dienst hat keine vollständig auswertbare Antwort geliefert. Es wurde kein neues Ergebnis übernommen.",
  action: "Seite neu laden und den Scan erneut starten.",
  retryable: true
};

const cancelledTechnicalOutcome: TechnicalOutcome = {
  code: "scan_cancelled",
  title: "Scan abgebrochen",
  summary: "Der laufende Scan wurde beendet. Ein vorheriges Ergebnis bleibt sichtbar.",
  action: "Den Scan erneut starten, wenn du fortfahren möchtest.",
  retryable: true
};

const clientTimeoutTechnicalOutcome: TechnicalOutcome = {
  code: "client_timeout",
  title: "Scan-Zeitlimit erreicht",
  summary: "Der vollständige Scan konnte nicht innerhalb des gemeinsamen Zeitbudgets abgeschlossen werden. Es wurde kein neues Ergebnis übernommen.",
  action: "Später erneut versuchen oder eine direktere Ziel-URL verwenden.",
  retryable: true
};

const categories = [
  { id: "all", label: "Alle" },
  { id: "security", label: "Sicherheit" },
  { id: "design", label: "Design" },
  { id: "engineering", label: "Engineering" },
  { id: "accessibility", label: "Barrierefreiheit" },
  { id: "content", label: "Inhalt" }
];

const categoryLabels: Record<string, string> = {
  security: "Sicherheit",
  design: "Design",
  engineering: "Engineering",
  accessibility: "Barrierefreiheit",
  content: "Inhalt"
};

const priorityLabels = { high: "Zuerst lösen", medium: "Danach", low: "Optimierung" };
const metricLabels: Record<string, string> = {
  htmlBytes: "HTML-Größe", scriptTags: "Skripte", stylesheetLinks: "Stylesheets", inlineStyles: "Inline-Styles",
  dataAttributes: "Data-Attribute", forms: "Formulare", headings: "Überschriften", images: "Bilder",
  sameOriginAssets: "Geprüfte Assets", assetBytes: "Asset-Größe", assetFetchErrors: "Asset-Fehler", truncatedAssets: "Gekürzte Assets"
};

const structuralHintLabels: Record<string, string> = {
  "dense-modern-stack": "viele moderne Stack-Signale",
  "high-data-attribute-density": "hohe Dichte strukturierter Data-Attribute",
  "script-heavy-static-shell": "skriptlastige Oberfläche ohne Formularstruktur"
};

function formatMetric(key: string, value: number) {
  if (["htmlBytes", "assetBytes"].includes(key)) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} KB`;
    return `${value.toLocaleString("de-DE")} B`;
  }
  return value.toLocaleString("de-DE");
}

function formatInterval(values: number[]) {
  return values.map((value) => (value * 100).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })).join("–");
}

function ScoreRing({ score }: { score: number }) {
  return <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties} aria-label={`${score} von 100`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>von 100</span></div>
  </div>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorResult, setErrorResult] = useState<ScanResult | null>(null);
  const [category, setCategory] = useState("all");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const scanSequenceRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    if ((!result && !errorResult) || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [result, errorResult]);

  const visibleRecommendations = useMemo(() => {
    const items = result?.recommendations || [];
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, result]);

  async function runScan() {
    const requestedUrl = url.trim();
    const sequence = ++scanSequenceRef.current;
    controllerRef.current?.abort("superseded");
    const controller = new AbortController();
    controllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setPendingUrl(requestedUrl);
    setErrorResult(null);
    setCategory("all");
    const timeout = window.setTimeout(() => controller.abort("client-timeout"), 19_000);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: requestedUrl }),
        signal: controller.signal
      });
      const responseRequestId = response.headers.get("x-vibebench-request-id") || undefined;
      const payload = await response.json().catch(() => null);
      const parsed = parseScanPayload(payload) as ScanResult | null;
      if (sequence !== scanSequenceRef.current) return;
      if (!parsed) setErrorResult({ apiVersion: release.apiVersion, ok: false, requestId: responseRequestId, technicalOutcome: incompatibleTechnicalOutcome });
      else if (parsed.ok) setResult(parsed);
      else setErrorResult(parsed);
    } catch {
      if (sequence !== scanSequenceRef.current) return;
      const outcome = controller.signal.aborted
        ? controller.signal.reason === "client-timeout" ? clientTimeoutTechnicalOutcome : cancelledTechnicalOutcome
        : fallbackTechnicalOutcome;
      setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: outcome });
    } finally {
      window.clearTimeout(timeout);
      if (sequence === scanSequenceRef.current && controllerRef.current === controller) {
        controllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
        setPendingUrl(null);
      }
    }
  }

  function scan(event: FormEvent) {
    event.preventDefault();
    if (loadingRef.current) return;
    void runScan();
  }

  function cancelScan() {
    controllerRef.current?.abort("user-cancelled");
  }

  const technicalOutcome = errorResult?.technicalOutcome || null;
  const score = result?.vibeScore?.score ?? 0;
  const observedRecommendations = visibleRecommendations.filter((item) => item.basis !== "guidance");
  const guidanceRecommendations = visibleRecommendations.filter((item) => item.basis === "guidance");
  const resultHost = result?.resolvedUrl ? new URL(result.resolvedUrl).hostname : null;

  return <main id="top">
    <a className="skip-link" href="#scanner">Direkt zum Website-Scan</a>
    <p className="sr-only" role="status" aria-live="polite">{loading ? "Website-Scan läuft." : errorResult ? technicalOutcome?.title : result ? "Neues Scan-Ergebnis ist verfügbar." : ""}</p>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="VibeBench Startseite"><span className="brand-mark">V</span><span><strong>VibeBench</strong><small>Website Forensics</small></span></a>
      <nav aria-label="Seitennavigation"><a href="#scanner">Scan</a><a className="method-link" href="#method">Methodik</a><span className="version">{release.displayVersion}</span></nav>
    </header>

    <section className="hero" id="scanner" tabIndex={-1}>
      <div className="hero-copy">
        <p className="eyebrow">Transparente Research-Beta</p>
        <h1>Wie viel <span>Vibe</span> steckt in deiner Website?</h1>
        <p className="lede">Erhalte einen verständlichen Score von 0 bis 100, erkenne öffentlich sichtbare Vibecoding-Muster und finde konkrete Schritte für mehr Sicherheit, Eigenständigkeit und Qualität.</p>
        <p className="hero-trust"><span aria-hidden="true">✓</span> Transparentes Beta-Modell · qualitative Orientierung mit klarer Unsicherheitsgrenze</p>
      </div>

      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <div className="scan-heading"><span>01</span><div><h2>Website analysieren</h2><p>Öffentliche URL eingeben – der Scan dauert meist wenige Sekunden.</p></div></div>
        <label htmlFor="url">Website-URL</label>
        <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://deine-website.de" autoComplete="url" inputMode="url" required />
        <div className="scan-actions"><button disabled={loading}><span>{loading ? "Website wird untersucht …" : "Kostenlosen Scan starten"}</span><b aria-hidden="true">→</b></button>{loading && <button className="cancel-button" type="button" onClick={cancelScan}>Abbrechen</button>}</div>
        <p className="privacy-note"><span aria-hidden="true">✓</span> Begrenzte, IP-gepinnte GET-Abrufe von öffentlichem HTML und Same-Origin-Assets. Die Zielseite kann diese Abrufe protokollieren. Keine Anmeldung, kein privater Quellcode.</p>
      </form>
    </section>

    <section className="score-explainer" aria-label="Erklärung der Skala">
      <div><strong>0–24</strong><span>Niedrig</span></div><i />
      <div><strong>25–49</strong><span>Leicht</span></div><i />
      <div><strong>50–69</strong><span>Mittel</span></div><i />
      <div><strong>70–84</strong><span>Hoch</span></div><i />
      <div><strong>85–100</strong><span>Sehr hoch</span></div>
      <p>Der Index ist eine unkalibrierte, qualitative Ähnlichkeitsorientierung – keine AI-Wahrscheinlichkeit und kein Prozentanteil AI-generierten Codes. <a href="#method">Methodik und Grenzen</a></p>
    </section>

    {(result || errorResult) && <section className="results" aria-label="Scan-Ergebnisse" ref={resultsRef} tabIndex={-1}>
      {loading && resultHost && <aside className="stale-note"><strong>Vorheriges Ergebnis für {resultHost}</strong><span>Neue Analyse für {pendingUrl} läuft.</span></aside>}
      {errorResult && technicalOutcome ? <div className="error-card">
        <span className="error-symbol" aria-hidden="true">!</span>
        <div><p className="eyebrow">{resultHost ? `Vorheriges Ergebnis für ${resultHost} bleibt erhalten` : "Kein neues Ergebnis erzeugt"}</p><h2>{technicalOutcome.title}</h2><p>{technicalOutcome.summary}</p><p className="error-action"><strong>Nächster Schritt:</strong> {technicalOutcome.action}</p>{technicalOutcome.retryable && <button className="retry-button" type="button" onClick={() => void runScan()} disabled={loading}>Erneut versuchen</button>}{errorResult.requestId && <p className="request-id">Request-ID: <code>{errorResult.requestId}</code></p>}</div>
      </div> : null}
      {result?.ok && result.vibeScore && result.security ? <>
        <div className={`score-hero score-${result.vibeScore.band.id}`}>
          <ScoreRing score={score} />
          <div className="score-copy">
            <p className="eyebrow">Dein Vibe-Footprint</p>
            <h2>{result.vibeScore.band.label}</h2>
            {resultHost && <p className="result-target">Analysiert: <strong>{resultHost}</strong></p>}
            <p>{result.vibeScore.band.summary}</p>
            <div className="score-boundary"><strong>Was das bedeutet</strong><span>{result.vibeScore.meaning} {result.vibeScore.caveat} <a href="#method">Methodik ansehen</a></span></div>
          </div>
          <div className="score-snapshot">
            <p>Scan-Überblick</p>
            <div><span>Auswertungsbreite</span><strong className={`coverage-${result.evidenceCoverage?.level || "standard"}`}>{result.evidenceCoverage?.label || "Standard"}</strong></div>
            <div><span>Sicherheits-Baseline</span><strong>{result.security.score}<small>/100</small></strong></div>
            <div><span>Direkte Marker</span><strong>{result.directEvidence?.length || 0}</strong></div>
            <div><span>Eindeutige Builder</span><strong>{result.directBuilderCount ?? new Set(result.directEvidence?.map((item) => item.label)).size}</strong></div>
          </div>
        </div>

        {result.evidenceCoverage && <aside className={`coverage-note coverage-${result.evidenceCoverage.level}`}><div><strong>Auswertungsbreite: {result.evidenceCoverage.label}</strong><p>{result.evidenceCoverage.summary}</p></div><span>Kein separater Bonus oder Abzug</span></aside>}

        <div className="score-scale" aria-label={`Score ${score} auf einer Skala von 0 bis 100`}>
          <div className="scale-labels"><span>Niedriger Footprint</span><strong>{score}/100</strong><span>Sehr hoher Footprint</span></div>
          <div className="scale-track"><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
        </div>

        <section className="drivers-section">
          <div className="section-heading"><div><p className="eyebrow">Index verständlich gemacht</p><h2>Was beeinflusst das Ergebnis?</h2></div><p>Nur tatsächlich erkannte Binärsignale erscheinen hier. Die Reihenfolge zeigt relative Modellwirkung, keine Punkte auf der 0–100-Skala.</p></div>
          <div className="drivers-grid">
            <article><div className="driver-title raises"><span>↑</span><div><strong>Erhöht den Score</strong><small>stärkere Ähnlichkeit</small></div></div>
              {result.scoreDrivers?.raises.length ? <ul>{result.scoreDrivers.raises.map((driver) => <li key={driver.feature}><span>{driver.description}</span></li>)}</ul> : <p className="empty-state">Keine einzelnen positiven Treiber sichtbar.</p>}
            </article>
            <article><div className="driver-title lowers"><span>↓</span><div><strong>Senkt den Score</strong><small>geringere Ähnlichkeit</small></div></div>
              {result.scoreDrivers?.lowers.length ? <ul>{result.scoreDrivers.lowers.map((driver) => <li key={driver.feature}><span>{driver.description}</span></li>)}</ul> : <p className="empty-state">Keine einzelnen negativen Treiber sichtbar.</p>}
            </article>
          </div>
        </section>

        <section className="recommendations-section">
          <div className="section-heading"><div><p className="eyebrow">Konkreter Verbesserungsplan</p><h2>Was du jetzt verbessern solltest</h2></div><p>Priorisiert nach Wirkung. Arbeite die ersten Punkte ab und scanne die Website danach erneut.</p></div>
          <div className="filter-row" role="group" aria-label="Empfehlungen filtern">{categories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}<span>{item.id === "all" ? result.recommendations?.length || 0 : result.recommendations?.filter((recommendation) => recommendation.category === item.id).length || 0}</span></button>)}</div>
          {!observedRecommendations.length && <p className="healthy-state"><strong>Keine hochkonfidenten Probleme in diesem Bereich erkannt.</strong> Der Scan ist begrenzt; optionale manuelle Prüfungen stehen darunter.</p>}
          {observedRecommendations.length ? <><h3 className="recommendation-group-title">Beobachtete Hinweise</h3><div className="recommendation-list">{observedRecommendations.map((item, index) => <article key={item.id}>
            <div className={`priority priority-${item.priority}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{priorityLabels[item.priority]}</b></div>
            <div className="recommendation-copy"><p>{categoryLabels[item.category] || item.category}</p><h3>{item.title}</h3><span>{item.why}</span></div>
            <div className="recommendation-action"><small>So setzt du es um</small><p>{item.action}</p></div>
          </article>)}</div></> : null}
          {guidanceRecommendations.length ? <><h3 className="recommendation-group-title guidance-title">Optionale manuelle Prüfungen</h3><div className="recommendation-list guidance-list">{guidanceRecommendations.map((item, index) => <article key={item.id}>
            <div className={`priority priority-${item.priority}`}><span>{String(index + 1).padStart(2, "0")}</span><b>Guidance</b></div>
            <div className="recommendation-copy"><p>{categoryLabels[item.category] || item.category}</p><h3>{item.title}</h3><span>{item.why}</span></div>
            <div className="recommendation-action"><small>Manuell prüfen</small><p>{item.action}</p></div>
          </article>)}</div></> : null}
          {!visibleRecommendations.length && <p className="empty-filter">Für diesen Filter gibt es weder ein beobachtetes Finding noch allgemeine Guidance.</p>}
        </section>

        <section className="security-section">
          <div className="security-score"><p className="eyebrow">Security-Baseline</p><strong>{result.security.score}<span>/100</span></strong><h2>Öffentlich sichtbarer Headerschutz</h2><p>Wertbezogene Prüfung ausgewählter Hauptdokument-Header – kein vollständiger Penetrationstest. <a href="#method">Grenzen ansehen</a></p></div>
          <div className="security-checks">{result.security.checks.map((check) => <details key={check.id} className={`security-${check.status}`}>
            <summary><span aria-hidden="true">{check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "×"}</span><strong>{check.title}</strong><small>{check.status === "pass" ? "Wirksam" : check.status === "warn" ? "Prüfen" : "Fehlt/Unwirksam"}</small></summary>
            <p>{check.detail}</p>{check.status !== "pass" && <p><b>Empfehlung:</b> {check.action}</p>}
          </details>)}</div>
        </section>

        <details className="technical-details">
          <summary><span><strong>Technische Evidenz ansehen</strong><small>Builder-Marker, Stack, Messwerte und Scan-Metadaten</small></span><b>+</b></summary>
          <div className="technical-grid">
            <article><h3>Direkte Marker</h3>{result.directEvidence?.length ? <ul>{result.directEvidence.map((item) => <li key={`${item.label}-${item.marker}`}>{item.label}{item.marker ? <small>{item.marker}</small> : null}</li>)}</ul> : <p>Keine direkten Builder-Marker gefunden.</p>}</article>
            <article><h3>Stack & Kontext</h3>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label), ...(result.headerEvidence || []).map((item) => item.label), ...(result.manifestEvidence || []).map((item) => item.label)].length ? <ul>{[...(result.stackSignals || []), ...(result.contextEvidence || []).map((item) => item.label), ...(result.headerEvidence || []).map((item) => item.label), ...(result.manifestEvidence || []).map((item) => item.label)].map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}</ul> : <p>Keine bekannten Stack- oder Kontextsignale sichtbar.</p>}</article>
            <article><h3>Strukturwerte</h3>{result.structuralHints?.length ? <p><strong>Hinweise:</strong> {result.structuralHints.map((hint) => structuralHintLabels[hint] || hint).join(", ")}</p> : null}<dl>{Object.entries(result.metrics || {}).map(([key, value]) => <div key={key}><dt>{metricLabels[key] || key}</dt><dd>{formatMetric(key, value)}</dd></div>)}</dl></article>
            <article><h3>Scan</h3><dl><div><dt>HTTP</dt><dd>{result.httpStatus}</dd></div><div><dt>Assets geladen</dt><dd>{result.assetScan?.fetched || 0}/{result.assetScan?.selected || 0} ausgewählt</dd></div><div><dt>Assets gefunden</dt><dd>{result.assetScan?.discovered || 0}</dd></div><div><dt>Auswertungsbreite</dt><dd>{result.evidenceCoverage?.label || "Standard"}</dd></div><div><dt>Modell</dt><dd>{result.model?.version || "v0.4"}</dd></div><div><dt>Zeitpunkt</dt><dd>{result.analyzedAt ? new Date(result.analyzedAt).toLocaleString("de-DE") : "—"}</dd></div></dl></article>
          </div>
          <a className="resolved-url" href={result.resolvedUrl} target="_blank" rel="noreferrer">{result.resolvedUrl} ↗</a>
        </details>

        <p className="warning"><strong>Wichtige Grenze:</strong> {result.warning}</p>
      </> : null}
    </section>}

    <section className="method" id="method">
      <div className="section-heading"><div><p className="eyebrow">So funktioniert VibeBench</p><h2>Von sichtbaren Mustern zu klaren nächsten Schritten.</h2></div><p>Der Scan untersucht nur das, was eine öffentliche Website ausliefert. Kein Login, kein Repository und kein privater Quellcode werden benötigt.</p></div>
      <div className="method-grid">
        <article><span>01</span><h3>Öffentliche Oberfläche scannen</h3><p>HTML, Response-Header und eine begrenzte Auswahl gleich-originiger Skripte und Stylesheets über geprüfte, IP-gepinnte Verbindungen.</p></article>
        <article><span>02</span><h3>Muster mit {release.displayVersion} bewerten</h3><p>Das Modell kombiniert öffentlich sichtbare technische und strukturelle Signale zu einem unkalibrierten Ähnlichkeitsindex von 0 bis 100.</p></article>
        <article><span>03</span><h3>Hinweise sauber trennen</h3><p>Beobachtete technische Findings werden von optionaler manueller Guidance getrennt und nach Wirkung geordnet.</p></article>
      </div>
      <div className="method-validation">
        <div><span>Legacy-Precision</span><strong>{(release.confirmation.precision * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</strong><small>Historisch · 95-%-Wilson-Intervall: {formatInterval(release.confirmation.precisionWilson95)} %</small></div>
        <div><span>Legacy-Recall</span><strong>{(release.confirmation.recall * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</strong><small>Historisch · 95-%-Wilson-Intervall: {formatInterval(release.confirmation.recallWilson95)} %</small></div>
        <div><span>Legacy-Abdeckung</span><strong>{release.confirmation.successful}/{release.confirmation.total}</strong><small>Capture-Vollständigkeit nachträglich nicht belegbar</small></div>
        <p><strong>Kein aktueller Leistungsnachweis:</strong> Diese eingefrorenen {release.displayVersion}-Werte bleiben als Legacy-Ergebnis dokumentiert. Sie validieren weder einzelne Score-Bänder noch eine AI-Wahrscheinlichkeit und werden erst nach Stabilisierung des neuen isolierten Collectors durch eine frische unabhängige Confirmation ersetzt.</p>
        <p><strong>Datenschutz und Betrieb:</strong> VibeBench speichert eingegebene Ziel-URLs nicht in einer Ergebnisdatenbank und schreibt sie nicht in die eigenen Diagnose-Events. Die Zielwebsite kann die begrenzten öffentlichen Abrufe wie jeden anderen Websitebesuch protokollieren. Für die Beta gelten technische Kapazitäts- und IP-basierte Abruflimits.</p>
      </div>
    </section>

    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">V</span><span><strong>VibeBench</strong><small>Website Forensics</small></span></a><p>Vibe-Footprint & Security-Baseline · Produkt {release.productVersion} · Modell {release.displayVersion} Beta</p><a href="#method">Methodik & Grenzen ↑</a></footer>
  </main>;
}
