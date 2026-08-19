"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { parseScanPayload } from "../lib/scan-contract.mjs";
import { localizeScanPayload, localizeTechnicalOutcome } from "../lib/scan-localization.mjs";
import { automaticRetryDelayMs, MAX_CLIENT_SCAN_ATTEMPTS, shouldAutomaticallyRetry } from "../lib/client-scan-retry.mjs";
import { buildCustomerReport, customerReportFilename } from "../lib/customer-report.mjs";
import { estimatedScanProgress, remainingRevealDelay, REPORT_READY_HOLD_MS, scanStageIndex } from "../lib/scan-progress.mjs";
import release from "../release/v0.4.json";

type TechnicalOutcome = { code: string; title: string; summary: string; action: string; retryable: boolean };
type ScoreBand = { id: string; label: string; shortLabel: string; summary: string };
type EvidenceCoverage = { level: "broad" | "standard" | "limited"; label: string; summary: string; affectsScore: false; scope: { html: string; assetsDiscovered: number; assetsSelected: number; assetCandidates: number; assetsFetched: number; assetErrors: number; truncatedAssets: number; manifestLinked: boolean; manifestFetched: boolean } };
type CategoryId = "security" | "design" | "engineering" | "accessibility" | "content";
type CategoryOverview = { id: CategoryId; issueCount: number; status: "attention" | "review" | "no-observed-issue" };
type ScanResult = {
  apiVersion: string;
  ok: boolean;
  requestId?: string;
  error?: string;
  technicalOutcome?: TechnicalOutcome;
  resolvedUrl?: string;
  httpStatus?: number;
  analyzedAt?: string;
  vibeScore?: { score: number; band: ScoreBand; meaning: string; caveat: string };
  evidenceCoverage?: EvidenceCoverage;
  security?: { score: number; counts: { pass: number; review: number; missing: number } };
  categoryOverview?: CategoryOverview[];
  reportAccess?: { status: "locked"; previewOnly: true; entitlementRequired: true };
};

type Language = "en" | "de";

const copyByLanguage = {
  en: {
    home: "VibeFootprint home", subtitle: "Website intelligence", scan: "Scan", methodology: "Methodology", beta: "Research Beta",
    heroEyebrow: "Evidence-led website review", heroTitle: <>How much <span>vibe</span> is in your website?</>,
    heroLede: "Get a clear 0–100 footprint, understand the public patterns behind it, and turn the findings into practical security, quality and originality improvements.",
    heroTrust: "Transparent beta model · qualitative orientation with an explicit uncertainty boundary",
    scanTitle: "Analyze a website", scanDescription: "Enter a public URL — the secure scan and report preparation take about 10 seconds.", urlLabel: "Website URL", placeholder: "https://your-website.com", startScan: "Start free scan", scanning: "Scanning website …", cancel: "Cancel",
    privacy: "Bounded, peer-pinned GET requests for public HTML and same-origin assets. The target site may log these requests. No login or private source code.",
    low: "Low", light: "Light", medium: "Medium", high: "High", veryHigh: "Very high",
    scaleNote: <>This qualitative index compares public website patterns with the reference corpus. It does not estimate code origin, generated-code share or authorship. <a href="#method">Read the methodology</a></>,
    results: "Scan results", previous: "Previous result for", newScan: "A new analysis for", noResult: "No new result created", previousKept: "Previous result remains available", yourFootprint: "Your Vibe-Footprint", analyzed: "Analyzed", whatItMeans: "What this means", seeMethod: "See methodology", scanOverview: "Free overview", breadth: "Evidence breadth", securityBaseline: "Security baseline", categoriesFlagged: "Categories with observations", directMarkers: "Direct markers", uniqueBuilders: "Unique builders", noBonus: "No separate score bonus or penalty", footprintScoreType: "Public-pattern similarity", footprintSeparate: "Security findings do not change this score.", securityScoreType: "Public header protection", securitySeparate: "This is independent from the Vibe-Footprint.",
    indexExplained: "Index explained", driversTitle: "What shapes the result?", driversDescription: "Only signals actually observed on the public surface appear here. Order shows relative model influence, not points on the 0–100 scale.", raises: "Raises the score", strongerSimilarity: "stronger similarity", lowers: "Lowers the score", lowerSimilarity: "lower similarity", noPositive: "No individual positive drivers are visible.", noNegative: "No individual negative drivers are visible.",
    improvementEyebrow: "Practical improvement plan", improvementTitle: "What to improve next", improvementDescription: "Prioritized by likely impact. Address the first items, then scan again.", observed: "Observed findings", guidance: "Optional manual checks", doFirst: "Do first", doNext: "Next", optimize: "Optimize", implement: "How to implement", manualCheck: "Manual check", healthy: "No high-confidence issue was found in this area.", noFilter: "This filter has no observed finding or general guidance.",
    security: "Security baseline", headerProtection: "Publicly visible header protection", securityDescription: "Value-based checks of selected main-document headers — not a full penetration test.", limits: "See limits", effective: "Effective", review: "Review", missing: "Missing / ineffective", recommendationLabel: "Recommendation:",
    reportEyebrow: "Free scan summary", reportTitle: "Your decision-ready overview", reportDescription: "The free result shows the two independent scores and the categories that need attention. Detailed evidence remains protected.", reportFootprint: "Pattern similarity", reportSecurity: "Header protection", reportIndependent: "Independent assessments — neither score changes the other.", shareReport: "Share summary", copyReport: "Copy summary", downloadReport: "Download summary", printReport: "Print summary", reportShared: "Summary shared", reportCopied: "Summary copied", reportDownloaded: "Summary downloaded", retrying: "The first attempt did not complete. One automatic retry is running …",
    categoriesEyebrow: "Free category overview", categoriesTitle: "Where attention is needed", categoriesDescription: "Counts summarize observed issues. The full evidence, reasoning and implementation steps are not included in the free response.", attention: "Needs attention", reviewCategory: "Review", clearCategory: "No issue observed", issue: "observed issue", issues: "observed issues",
    lockedEyebrow: "Full diagnostic report", lockedTitle: "Unlock the evidence behind the score", lockedDescription: "Get the exact score drivers, prioritized findings, security checks and implementation steps in a client-ready report.", unlock: "Unlock full report", lockedBadge: "Detailed report locked", lockedIncludes: "Included in the full report", lockedItems: ["Score drivers and signal evidence", "Prioritized design and engineering findings", "Security-header details and remediation", "Technical appendix and implementation plan"], checkoutPending: "Checkout is not connected yet. Pricing and payment setup are the next product decision.", previewLabel: "Confidential diagnostic preview",
    technical: "View technical evidence", technicalDescription: "Builder markers, stack signals, measurements and scan metadata", directEvidence: "Direct markers", noDirect: "No direct builder markers found.", stackContext: "Stack & context", noStack: "No known stack or context signals were visible.", structural: "Structure values", hints: "Hints", loaded: "Assets loaded", selected: "selected", found: "Assets found", model: "Model", time: "Time", viewUrl: "Open resolved URL", importantLimit: "Important boundary", dataProtection: "Data and operation", methodEyebrow: "How VibeFootprint works", methodTitle: "A visible footprint, turned into useful next steps.", methodDescription: "We inspect only what a public website delivers. No login, repository or private source code is required.", methodOneTitle: "Inspect the public surface", methodOneText: "HTML, response headers and a bounded selection of same-origin assets over validated, peer-pinned connections.", methodTwoTitle: "Score visible patterns", methodTwoText: "The frozen model combines public technical and structural signals into an uncalibrated 0–100 similarity index.", methodThreeTitle: "Separate evidence from advice", methodThreeText: "Observed findings stay distinct from optional manual guidance and are ordered by impact.", proofTitle: "Designed for a clear decision", proofText: "Use the footprint to see where a site looks generic, where it needs hardening, and what to improve next — without pretending to know who authored it.", proofPublic: "Public surface only", proofScore: "0–100 qualitative index", proofSecurity: "Separate security baseline", proofPrivacy: "No source access required", footerLine: "Vibe-Footprint & Security-Baseline · Research Beta", backToMethod: "Methodology & limits ↑"
  },
  de: {
    home: "VibeFootprint Startseite", subtitle: "Website-Intelligenz", scan: "Scan", methodology: "Methodik", beta: "Research-Beta", heroEyebrow: "Evidenzbasierte Website-Prüfung", heroTitle: <>Wie viel <span>Vibe</span> steckt in deiner Website?</>, heroLede: "Erhalte einen verständlichen Score von 0 bis 100, erkenne öffentlich sichtbare Muster und finde konkrete Schritte für mehr Sicherheit, Qualität und Eigenständigkeit.", heroTrust: "Transparentes Beta-Modell · qualitative Orientierung mit klarer Unsicherheitsgrenze", scanTitle: "Website analysieren", scanDescription: "Öffentliche URL eingeben – der Scan dauert meist wenige Sekunden.", urlLabel: "Website-URL", placeholder: "https://deine-website.de", startScan: "Kostenlosen Scan starten", scanning: "Website wird untersucht …", cancel: "Abbrechen", privacy: "Begrenzte, IP-gepinnte GET-Abrufe von öffentlichem HTML und gleich-originigen Assets. Die Zielseite kann diese Abrufe protokollieren. Keine Anmeldung, kein privater Quellcode.", low: "Niedrig", light: "Leicht", medium: "Mittel", high: "Hoch", veryHigh: "Sehr hoch", scaleNote: <>Der qualitative Index vergleicht öffentliche Website-Muster mit dem Referenzkorpus. Er misst weder Codeherkunft, Anteil generierten Codes noch Autorenschaft. <a href="#method">Methodik und Grenzen</a></>, results: "Scan-Ergebnisse", previous: "Vorheriges Ergebnis für", newScan: "Neue Analyse für", noResult: "Kein neues Ergebnis erzeugt", previousKept: "Vorheriges Ergebnis bleibt erhalten", yourFootprint: "Dein Vibe-Footprint", analyzed: "Analysiert", whatItMeans: "Was das bedeutet", seeMethod: "Methodik ansehen", scanOverview: "Footprint-Evidenz", breadth: "Auswertungsbreite", securityBaseline: "Sicherheits-Baseline", directMarkers: "Direkte Marker", uniqueBuilders: "Eindeutige Builder", noBonus: "Kein separater Bonus oder Abzug", footprintScoreType: "Ähnlichkeit öffentlicher Muster", footprintSeparate: "Security-Findings verändern diesen Score nicht.", securityScoreType: "Öffentlicher Headerschutz", securitySeparate: "Diese Bewertung ist unabhängig vom Vibe-Footprint.", indexExplained: "Index verständlich gemacht", driversTitle: "Was beeinflusst das Ergebnis?", driversDescription: "Nur tatsächlich erkannte Signale erscheinen hier. Die Reihenfolge zeigt relative Modellwirkung, keine Punkte auf der 0–100-Skala.", raises: "Erhöht den Score", strongerSimilarity: "stärkere Ähnlichkeit", lowers: "Senkt den Score", lowerSimilarity: "geringere Ähnlichkeit", noPositive: "Keine einzelnen positiven Treiber sichtbar.", noNegative: "Keine einzelnen negativen Treiber sichtbar.", improvementEyebrow: "Konkreter Verbesserungsplan", improvementTitle: "Was du jetzt verbessern solltest", improvementDescription: "Priorisiert nach Wirkung. Arbeite die ersten Punkte ab und scanne die Website danach erneut.", observed: "Beobachtete Hinweise", guidance: "Optionale manuelle Prüfungen", doFirst: "Zuerst lösen", doNext: "Danach", optimize: "Optimierung", implement: "So setzt du es um", manualCheck: "Manuell prüfen", healthy: "Keine hochkonfidenten Probleme in diesem Bereich erkannt.", noFilter: "Für diesen Filter gibt es weder ein beobachtetes Finding noch allgemeine Guidance.", security: "Security-Baseline", headerProtection: "Öffentlich sichtbarer Headerschutz", securityDescription: "Wertbezogene Prüfung ausgewählter Hauptdokument-Header – kein vollständiger Penetrationstest.", limits: "Grenzen ansehen", effective: "Wirksam", review: "Prüfen", missing: "Fehlt/Unwirksam", recommendationLabel: "Empfehlung:", reportEyebrow: "Kostenlose Scan-Zusammenfassung", reportTitle: "Deine klare Entscheidungsübersicht", reportDescription: "Das kostenlose Ergebnis zeigt die beiden unabhängigen Scores und betroffene Oberkategorien. Detaillierte Evidenz bleibt geschützt.", reportFootprint: "Musterähnlichkeit", reportSecurity: "Headerschutz", reportIndependent: "Unabhängige Bewertungen – kein Score verändert den anderen.", shareReport: "Zusammenfassung teilen", copyReport: "Zusammenfassung kopieren", downloadReport: "Zusammenfassung laden", printReport: "Zusammenfassung drucken", reportShared: "Zusammenfassung geteilt", reportCopied: "Zusammenfassung kopiert", reportDownloaded: "Zusammenfassung heruntergeladen", retrying: "Der erste Versuch war nicht vollständig. Ein automatischer Wiederholungsversuch läuft …", categoriesEyebrow: "Kostenlose Kategorieübersicht", categoriesTitle: "Wo Handlungsbedarf besteht", categoriesDescription: "Die Zahlen fassen beobachtete Hinweise zusammen. Evidenz, Begründung und Umsetzungsschritte sind nicht Teil der kostenlosen Antwort.", attention: "Handlungsbedarf", reviewCategory: "Prüfen", clearCategory: "Kein Problem beobachtet", issue: "beobachteter Hinweis", issues: "beobachtete Hinweise", lockedEyebrow: "Vollständiger Diagnosebericht", lockedTitle: "Evidenz hinter dem Score freischalten", lockedDescription: "Erhalte exakte Score-Treiber, priorisierte Findings, Sicherheitsprüfungen und Umsetzungsschritte in einem kundenfertigen Report.", unlock: "Vollständigen Report freischalten", lockedBadge: "Detailreport gesperrt", lockedIncludes: "Im vollständigen Report enthalten", lockedItems: ["Score-Treiber und Signal-Evidenz", "Priorisierte Design- und Engineering-Findings", "Security-Header-Details und Maßnahmen", "Technischer Anhang und Umsetzungsplan"], checkoutPending: "Der Checkout ist noch nicht verbunden. Preis und Zahlungsabwicklung sind die nächste Produktentscheidung.", previewLabel: "Vertrauliche Diagnosevorschau", technical: "Technische Evidenz ansehen", technicalDescription: "Builder-Marker, Stack, Messwerte und Scan-Metadaten", directEvidence: "Direkte Marker", noDirect: "Keine direkten Builder-Marker gefunden.", stackContext: "Stack & Kontext", noStack: "Keine bekannten Stack- oder Kontextsignale sichtbar.", structural: "Strukturwerte", hints: "Hinweise", loaded: "Assets geladen", selected: "ausgewählt", found: "Assets gefunden", model: "Modell", time: "Zeitpunkt", viewUrl: "Aufgelöste URL öffnen", importantLimit: "Wichtige Grenze", dataProtection: "Datenschutz und Betrieb", methodEyebrow: "So funktioniert VibeFootprint", methodTitle: "Von sichtbaren Mustern zu klaren nächsten Schritten.", methodDescription: "Der Scan untersucht nur das, was eine öffentliche Website ausliefert. Kein Login, kein Repository und kein privater Quellcode werden benötigt.", methodOneTitle: "Öffentliche Oberfläche scannen", methodOneText: "HTML, Response-Header und eine begrenzte Auswahl gleich-originiger Skripte und Stylesheets über geprüfte, IP-gepinnte Verbindungen.", methodTwoTitle: "Sichtbare Muster bewerten", methodTwoText: "Das eingefrorene Modell kombiniert öffentlich sichtbare technische und strukturelle Signale zu einem unkalibrierten Ähnlichkeitsindex von 0 bis 100.", methodThreeTitle: "Evidenz und Hinweise trennen", methodThreeText: "Beobachtete Findings bleiben von optionaler manueller Guidance getrennt und werden nach Wirkung geordnet.", proofTitle: "Für klare Entscheidungen gebaut", proofText: "Nutze den Footprint, um generische Stellen, Härtungsbedarf und nächste Verbesserungen zu erkennen – ohne vorzugeben, wer die Website erstellt hat.", proofPublic: "Nur öffentliche Oberfläche", proofScore: "Qualitativer Index 0–100", proofSecurity: "Separate Security-Baseline", proofPrivacy: "Kein Quellcodezugriff nötig", footerLine: "Vibe-Footprint & Security-Baseline · Research-Beta", backToMethod: "Methodik & Grenzen ↑"
  }
} as const;

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

const categoryIds: CategoryId[] = ["security", "design", "engineering", "accessibility", "content"];
const categoryLabelsByLanguage = {
  en: { security: "Security", design: "Design", engineering: "Engineering", accessibility: "Accessibility", content: "Content" },
  de: { security: "Sicherheit", design: "Design", engineering: "Engineering", accessibility: "Barrierefreiheit", content: "Inhalt" }
} as const;

const scanProgressCopyByLanguage = {
  en: {
    title: "Scan progress",
    estimated: "The percentage reflects the complete scan and report-preparation flow.",
    preparing: "Analysis complete — preparing your report",
    retrying: "Retrying the secure public request",
    stages: ["Establishing a secure connection", "Reading the public website surface", "Inspecting bounded same-origin assets", "Reviewing public security headers", "Comparing visible patterns", "Preparing the report"],
    completeStages: ["Organizing the collected evidence", "Separating the Vibe-Footprint and security baseline", "Grouping observed issues into categories", "Applying the interpretation boundary", "Protecting detailed report evidence", "Finalizing your free summary"]
  },
  de: {
    title: "Scan-Fortschritt",
    estimated: "Der Prozentwert bildet den vollständigen Scan- und Aufbereitungsprozess ab.",
    preparing: "Analyse abgeschlossen – dein Report wird aufbereitet",
    retrying: "Sicherer öffentlicher Abruf wird wiederholt",
    stages: ["Sichere Verbindung herstellen", "Öffentliche Website-Oberfläche lesen", "Begrenzte Same-Origin-Assets prüfen", "Öffentliche Security-Header bewerten", "Sichtbare Muster vergleichen", "Report aufbereiten"],
    completeStages: ["Gesammelte Evidenz ordnen", "Vibe-Footprint und Sicherheits-Baseline trennen", "Beobachtete Hinweise nach Kategorien gruppieren", "Interpretationsgrenze anwenden", "Detaillierte Report-Evidenz schützen", "Kostenlose Zusammenfassung finalisieren"]
  }
} as const;

function waitForDelay(ms: number, signal: AbortSignal) {
  if (ms <= 0) return Promise.resolve(!signal.aborted);
  if (signal.aborted) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(true); }, ms);
    const onAbort = () => { window.clearTimeout(timer); signal.removeEventListener("abort", onAbort); resolve(false); };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function ScoreRing({ score, language }: { score: number; language: Language }) {
  const label = language === "en" ? "out of 100" : "von 100";
  return <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties} aria-label={`${score} ${label}`}>
    <div className="score-ring-inner"><strong>{score}</strong><span>{label}</span></div>
  </div>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawResult, setRawResult] = useState<ScanResult | null>(null);
  const [errorResult, setErrorResult] = useState<ScanResult | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [technicalScanComplete, setTechnicalScanComplete] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("vibefootprint-language");
    return saved === "de" ? "de" : "en";
  });
  const resultsRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const scanSequenceRef = useRef(0);
  const loadingRef = useRef(false);
  const copy = copyByLanguage[language];
  const categoryLabels = categoryLabelsByLanguage[language];
  const scanProgressCopy = scanProgressCopyByLanguage[language];
  const result = useMemo(() => localizeScanPayload(rawResult, language) as ScanResult | null, [rawResult, language]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem("vibefootprint-language", next);
  }

  useEffect(() => {
    if ((!result && !errorResult) || !resultsRef.current) return;
    resultsRef.current.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [result, errorResult]);

  const reportText = useMemo(() => result?.ok ? buildCustomerReport(result, language) : "", [language, result]);

  async function runScan() {
    const requestedUrl = url.trim();
    const sequence = ++scanSequenceRef.current;
    const scanStartedAt = Date.now();
    controllerRef.current?.abort("superseded");
    loadingRef.current = true;
    setLoading(true);
    setPendingUrl(requestedUrl);
    setErrorResult(null);
    setRetryAttempt(0);
    setScanProgress(0);
    setTechnicalScanComplete(false);
    setReportStatus("");
    setPurchaseNotice("");
    const progressTimer = window.setInterval(() => setScanProgress((current) => Math.max(current, estimatedScanProgress(Date.now() - scanStartedAt))), 120);
    try {
      for (let attempt = 1; attempt <= MAX_CLIENT_SCAN_ATTEMPTS; attempt += 1) {
        const controller = new AbortController();
        controllerRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort("client-timeout"), 19_000);
        let failedResult: ScanResult | null = null;
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
          if (!parsed) failedResult = { apiVersion: release.apiVersion, ok: false, requestId: responseRequestId, technicalOutcome: incompatibleTechnicalOutcome };
          else if (parsed.ok) {
            setTechnicalScanComplete(true);
            const revealReady = await waitForDelay(remainingRevealDelay(scanStartedAt), controller.signal);
            if (!revealReady || sequence !== scanSequenceRef.current) {
              if (sequence === scanSequenceRef.current) setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: cancelledTechnicalOutcome });
              return;
            }
            setScanProgress(100);
            if (!await waitForDelay(REPORT_READY_HOLD_MS, controller.signal) || sequence !== scanSequenceRef.current) return;
            setRawResult(parsed);
            setErrorResult(null);
            return;
          } else failedResult = parsed;
        } catch {
          if (sequence !== scanSequenceRef.current) return;
          const outcome = controller.signal.aborted
            ? controller.signal.reason === "client-timeout" ? clientTimeoutTechnicalOutcome : cancelledTechnicalOutcome
            : fallbackTechnicalOutcome;
          failedResult = { apiVersion: release.apiVersion, ok: false, technicalOutcome: outcome };
        } finally {
          window.clearTimeout(timeout);
        }

        if (sequence !== scanSequenceRef.current || !failedResult?.technicalOutcome) return;
        if (controller.signal.reason === "user-cancelled") {
          setErrorResult(failedResult);
          return;
        }
        if (shouldAutomaticallyRetry(failedResult.technicalOutcome, attempt)) {
          setRetryAttempt(attempt + 1);
          await new Promise((resolve) => window.setTimeout(resolve, automaticRetryDelayMs(failedResult?.technicalOutcome?.code)));
          if (controller.signal.reason === "user-cancelled") {
            setErrorResult({ apiVersion: release.apiVersion, ok: false, technicalOutcome: cancelledTechnicalOutcome });
            return;
          }
          continue;
        }
        setErrorResult(failedResult);
        return;
      }
    } finally {
      window.clearInterval(progressTimer);
      if (sequence === scanSequenceRef.current) {
        controllerRef.current = null;
        loadingRef.current = false;
        setLoading(false);
        setPendingUrl(null);
        setRetryAttempt(0);
        setTechnicalScanComplete(false);
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

  async function copyCustomerReport() {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setReportStatus(copy.reportCopied);
    } catch {
      setReportStatus(language === "en" ? "Copying is not available in this browser." : "Kopieren ist in diesem Browser nicht verfügbar.");
    }
  }

  async function shareCustomerReport() {
    if (!reportText || !result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.reportTitle, text: reportText });
        setReportStatus(copy.reportShared);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyCustomerReport();
  }

  function downloadCustomerReport() {
    if (!reportText || !result) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([reportText], { type: "text/markdown;charset=utf-8" }));
    link.download = customerReportFilename(result, language);
    link.click();
    URL.revokeObjectURL(link.href);
    setReportStatus(copy.reportDownloaded);
  }

  const technicalOutcome = localizeTechnicalOutcome(errorResult?.technicalOutcome || null, language);
  const score = result?.vibeScore?.score ?? 0;
  const resultHost = result?.resolvedUrl ? new URL(result.resolvedUrl).hostname : null;
  const activeScanStage = retryAttempt ? scanProgressCopy.retrying : technicalScanComplete ? scanProgressCopy.completeStages[scanStageIndex(scanProgress)] : scanProgressCopy.stages[scanStageIndex(scanProgress)];

  return <main id="top">
    <a className="skip-link" href="#scanner">{language === "en" ? "Skip to website scan" : "Direkt zum Website-Scan"}</a>
    <p className="sr-only" role="status" aria-live="polite">{loading ? copy.scanning : errorResult ? technicalOutcome?.title : result ? copy.results : ""}</p>
    <header className="topbar">
      <a className="brand" href="#top" aria-label={copy.home}><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></a>
      <nav aria-label={language === "en" ? "Primary navigation" : "Seitennavigation"}><a href="#scanner">{copy.scan}</a><a className="method-link" href="#method">{copy.methodology}</a><span className="version">{copy.beta}</span><div className="language-switcher" role="group" aria-label="Language"><button type="button" className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>🇬🇧 <span>EN</span></button><button type="button" className={language === "de" ? "active" : ""} onClick={() => changeLanguage("de")} aria-pressed={language === "de"}>🇩🇪 <span>DE</span></button></div></nav>
    </header>

    <section className="hero" id="scanner" tabIndex={-1}>
      <div className="hero-copy">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.heroTitle}</h1>
        <p className="lede">{copy.heroLede}</p>
        <p className="hero-trust"><span aria-hidden="true">✓</span> {copy.heroTrust}</p>
      </div>

      <form className="scan-panel" onSubmit={scan} aria-busy={loading}>
        <div className="scan-heading"><span>01</span><div><h2>{copy.scanTitle}</h2><p>{language === "de" ? "Öffentliche URL eingeben – der sichere Scan und die Report-Aufbereitung dauern etwa 10 Sekunden." : copy.scanDescription}</p></div></div>
        <label htmlFor="url">{copy.urlLabel}</label>
        <input id="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={copy.placeholder} autoComplete="url" inputMode="url" required />
        <div className="scan-actions"><button disabled={loading}><span>{loading ? retryAttempt ? copy.retrying : copy.scanning : copy.startScan}</span><b aria-hidden="true">→</b></button>{loading && <button className="cancel-button" type="button" onClick={cancelScan}>{copy.cancel}</button>}</div>
        {loading && <div className="scan-progress" role="status" aria-live="polite">
          <div className="scan-progress-heading"><strong>{scanProgressCopy.title}</strong><span>{scanProgress}%</span></div>
          <div className="scan-progress-track" aria-hidden="true"><i style={{ width: `${scanProgress}%` }} /></div>
          <p>{activeScanStage}</p>
          <small>{scanProgressCopy.estimated}</small>
        </div>}
        <p className="privacy-note"><span aria-hidden="true">✓</span> {copy.privacy}</p>
      </form>
    </section>

    <section className="score-explainer" aria-label={language === "en" ? "Score scale explanation" : "Erklärung der Skala"}>
      <div><strong>0–24</strong><span>{copy.low}</span></div><i />
      <div><strong>25–49</strong><span>{copy.light}</span></div><i />
      <div><strong>50–69</strong><span>{copy.medium}</span></div><i />
      <div><strong>70–84</strong><span>{copy.high}</span></div><i />
      <div><strong>85–100</strong><span>{copy.veryHigh}</span></div>
      <p>{copy.scaleNote}</p>
    </section>

    {(result || errorResult) && <section className="results" aria-label={copy.results} ref={resultsRef} tabIndex={-1}>
      {loading && resultHost && <aside className="stale-note"><strong>{copy.previous} {resultHost}</strong><span>{copy.newScan} {pendingUrl} …</span></aside>}
      {errorResult && technicalOutcome ? <div className="error-card">
        <span className="error-symbol" aria-hidden="true">!</span>
        <div><p className="eyebrow">{resultHost ? `${copy.previous} ${resultHost} · ${copy.previousKept}` : copy.noResult}</p><h2>{technicalOutcome.title}</h2><p>{technicalOutcome.summary}</p><p className="error-action"><strong>{language === "en" ? "Next step:" : "Nächster Schritt:"}</strong> {technicalOutcome.action}</p>{technicalOutcome.retryable && <button className="retry-button" type="button" onClick={() => void runScan()} disabled={loading}>{language === "en" ? "Try again" : "Erneut versuchen"}</button>}{errorResult.requestId && <p className="request-id">Request-ID: <code>{errorResult.requestId}</code></p>}</div>
      </div> : null}
      {result?.ok && result.vibeScore && result.security ? <>
        <div className={`score-hero score-${result.vibeScore.band.id}`}>
          <ScoreRing score={score} language={language} />
          <div className="score-copy">
            <p className="eyebrow">{copy.yourFootprint}</p>
            <p className="score-kind">{copy.footprintScoreType} · <span>{copy.footprintSeparate}</span></p>
            <h2>{result.vibeScore.band.label}</h2>
            {resultHost && <p className="result-target">{copy.analyzed}: <strong>{resultHost}</strong></p>}
            <p>{result.vibeScore.band.summary}</p>
            <div className="score-boundary"><strong>{copy.whatItMeans}</strong><span>{result.vibeScore.meaning} {result.vibeScore.caveat} <a href="#method">{copy.seeMethod}</a></span></div>
          </div>
          <div className="score-snapshot">
            <p>{copy.scanOverview}</p>
            <div><span>{copy.breadth}</span><strong className={`coverage-${result.evidenceCoverage?.level || "standard"}`}>{result.evidenceCoverage?.label || "Standard"}</strong></div>
            <div><span>{copy.securityBaseline}</span><strong>{result.security.score}<small>/100</small></strong></div>
            <div><span>{language === "en" ? "Categories with observations" : "Kategorien mit Hinweisen"}</span><strong>{result.categoryOverview?.filter((item) => item.issueCount > 0).length || 0}<small>/5</small></strong></div>
          </div>
        </div>

        {result.evidenceCoverage && <aside className={`coverage-note coverage-${result.evidenceCoverage.level}`}><div><strong>{copy.breadth}: {result.evidenceCoverage.label}</strong><p>{result.evidenceCoverage.summary}</p></div><span>{copy.noBonus}</span></aside>}

        <div className="score-scale" aria-label={language === "en" ? `Score ${score} on a scale from 0 to 100` : `Score ${score} auf einer Skala von 0 bis 100`}>
          <div className="scale-labels"><span>{language === "en" ? "Lower footprint" : "Niedriger Footprint"}</span><strong>{score}/100</strong><span>{language === "en" ? "Very high footprint" : "Sehr hoher Footprint"}</span></div>
          <div className="scale-track"><i style={{ width: `${score}%` }} /><b style={{ left: `${score}%` }} /></div>
        </div>

        <section className="customer-report" aria-labelledby="customer-report-title">
          <div className="report-heading"><div><p className="eyebrow">{copy.reportEyebrow}</p><h2 id="customer-report-title">{copy.reportTitle}</h2></div><p>{copy.reportDescription}</p></div>
          <div className="report-score-pair">
            <article><span>01 · {copy.reportFootprint}</span><strong>{score}<small>/100</small></strong><p>{result.vibeScore.band.label}</p></article>
            <i aria-hidden="true">≠</i>
            <article><span>02 · {copy.reportSecurity}</span><strong>{result.security.score}<small>/100</small></strong><p>{copy.headerProtection}</p></article>
          </div>
          <p className="report-independence"><span aria-hidden="true">✓</span>{copy.reportIndependent}</p>
          <div className="report-actions">
            <button type="button" onClick={() => void shareCustomerReport()}>{copy.shareReport}</button>
            <button type="button" onClick={() => void copyCustomerReport()}>{copy.copyReport}</button>
            <button type="button" onClick={downloadCustomerReport}>{copy.downloadReport}</button>
            <button type="button" onClick={() => window.print()}>{copy.printReport}</button>
          </div>
          <p className="report-status" role="status" aria-live="polite">{reportStatus}</p>
        </section>

        <section className="category-overview" aria-labelledby="category-overview-title">
          <div className="section-heading"><div><p className="eyebrow">{copy.categoriesEyebrow}</p><h2 id="category-overview-title">{copy.categoriesTitle}</h2></div><p>{copy.categoriesDescription}</p></div>
          <div className="category-overview-grid">
            {categoryIds.map((id, index) => {
              const item = result.categoryOverview?.find((entry) => entry.id === id) || { id, issueCount: 0, status: "no-observed-issue" as const };
              const statusLabel = item.status === "attention" ? copy.attention : item.status === "review" ? copy.reviewCategory : copy.clearCategory;
              return <article key={id} className={`category-card category-${item.status}`}>
                <div><span>{String(index + 1).padStart(2, "0")}</span><b>{statusLabel}</b></div>
                <h3>{categoryLabels[id]}</h3>
                <p>{item.issueCount ? <><strong>{item.issueCount}</strong> {item.issueCount === 1 ? copy.issue : copy.issues}</> : copy.clearCategory}</p>
              </article>;
            })}
          </div>
        </section>

        <section className="locked-report" aria-labelledby="locked-report-title">
          <div className="locked-report-copy">
            <p className="eyebrow">{copy.lockedEyebrow}</p>
            <span className="locked-badge"><i aria-hidden="true">!</i>{copy.lockedBadge}</span>
            <h2 id="locked-report-title">{copy.lockedTitle}</h2>
            <p>{copy.lockedDescription}</p>
            <strong>{copy.lockedIncludes}</strong>
            <ul>{copy.lockedItems.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
            <button type="button" onClick={() => setPurchaseNotice(copy.checkoutPending)}>{copy.unlock}<span aria-hidden="true">→</span></button>
            <p className="purchase-notice" role="status" aria-live="polite">{purchaseNotice}</p>
          </div>
          <div className="locked-preview" aria-label={copy.previewLabel}>
            <div className="locked-preview-document" aria-hidden="true">
              <span className="preview-warning">!</span><i className="preview-line preview-line-long" /><i className="preview-line preview-line-short" />
              <div className="preview-columns"><span /><span /></div>
              <i className="preview-line preview-line-long" /><i className="preview-line preview-line-medium" />
              <div className="preview-alerts"><span /><span /><span /></div>
            </div>
            <div className="locked-preview-overlay"><span aria-hidden="true">🔒</span><strong>{copy.lockedBadge}</strong><small>{copy.previewLabel}</small></div>
          </div>
        </section>
      </> : null}
    </section>}

    <section className="method" id="method">
      <div className="section-heading"><div><p className="eyebrow">{copy.methodEyebrow}</p><h2>{copy.methodTitle}</h2></div><p>{copy.methodDescription}</p></div>
      <div className="method-grid">
        <article><span>01</span><h3>{copy.methodOneTitle}</h3><p>{copy.methodOneText}</p><small className="method-tag">PUBLIC SURFACE</small></article>
        <article><span>02</span><h3>{copy.methodTwoTitle}</h3><p>{copy.methodTwoText}</p><small className="method-tag">QUALITATIVE INDEX</small></article>
        <article><span>03</span><h3>{copy.methodThreeTitle}</h3><p>{copy.methodThreeText}</p><small className="method-tag">ACTIONABLE OUTPUT</small></article>
      </div>
    </section>

    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">V</span><span><strong>VibeFootprint</strong><small>{copy.subtitle}</small></span></a><p>{copy.footerLine} · Product {release.productVersion} · Model {release.displayVersion}</p><a href="#method">{copy.backToMethod}</a></footer>
  </main>;
}
