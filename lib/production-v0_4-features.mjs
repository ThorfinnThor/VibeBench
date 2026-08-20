const encoder = new TextEncoder();
const count = (text, pattern) => (text.match(pattern) || []).length;

export function collectProductionExtendedMetrics(html, assetText) {
  const combined = `${html}\n${assetText}`;
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = visible.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || [];
  const classValues = [...html.matchAll(/\sclass=["']([^"']*)["']/gi)].map((match) => match[1]);
  const classTokens = classValues.flatMap((value) => value.split(/\s+/).filter(Boolean));
  const externalHosts = new Set([...combined.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)(?=[:/"'`\s)])/gi)].map((match) => match[1].toLowerCase().replace(/^www\./, "")));
  const shadcnVariables = ["background", "foreground", "card", "popover", "primary", "secondary", "muted", "accent", "destructive", "border", "input", "ring", "radius"];
  return {
    html_bytes: encoder.encode(html).length,
    visible_text_chars: visible.length,
    visible_words: words.length,
    unique_visible_words: new Set(words).size,
    paragraphs: count(html, /<p\b/gi),
    sections: count(html, /<section\b/gi),
    anchors: count(html, /<a\b/gi),
    navs: count(html, /<nav\b/gi),
    footers: count(html, /<footer\b/gi),
    dialogs: count(html, /<(?:dialog)\b|role=["']dialog/gi),
    tables: count(html, /<table\b/gi),
    code_blocks: count(html, /<(?:pre|code)\b/gi),
    canvases: count(html, /<canvas\b/gi),
    videos: count(html, /<video\b/gi),
    meta_tags: count(html, /<meta\b/gi),
    jsonld_scripts: count(html, /<script\b[^>]*application\/ld\+json/gi),
    comments: count(html, /<!--[\s\S]*?-->/g),
    id_attributes: count(html, /\sid=["']/gi),
    role_attributes: count(html, /\srole=["']/gi),
    alt_attributes: count(html, /\salt=["']/gi),
    custom_elements: count(html, /<[a-z][a-z0-9]*-[a-z0-9-]+\b/gi),
    tailwind_like_tokens: classTokens.filter((token) => /^(?:sm:|md:|lg:|xl:|2xl:|hover:|focus:|dark:|group-|peer-|bg-|text-|p[trblxy]?-|m[trblxy]?-|grid|flex|gap-|rounded|shadow|border|w-|h-|max-w-|min-h-)/.test(token)).length,
    arbitrary_class_tokens: classTokens.filter((token) => /\[[^\]]+\]/.test(token)).length,
    css_variables: count(combined, /--[a-z][a-z0-9-]*\s*:/gi),
    gradients: count(combined, /(?:linear|radial|conic)-gradient\s*\(/gi),
    keyframes: count(assetText, /@keyframes\b/gi),
    external_host_count: externalHosts.size,
    shadcn_variable_coverage: shadcnVariables.filter((name) => new RegExp(`--${name}\\s*:`, "i").test(combined)).length,
    data_slot_attributes: count(combined, /data-slot=/gi),
    radix_fingerprints: count(combined, /(?:data-radix-|radix-ui|@radix-ui)/gi),
    lucide_fingerprints: count(combined, /(?:lucide-react|lucide-|data-lucide)/gi),
    cva_fingerprints: count(combined, /(?:class-variance-authority|cva\()/gi),
    tailwind_merge_fingerprints: count(combined, /(?:tailwind-merge|twMerge)/gi),
    next_themes_fingerprints: count(combined, /next-themes/gi),
    sonner_fingerprints: count(combined, /\bsonner\b/gi),
    cmdk_fingerprints: count(combined, /\bcmdk\b/gi),
    recharts_fingerprints: count(combined, /\brecharts\b/gi),
    embla_fingerprints: count(combined, /embla-carousel/gi),
    tanstack_fingerprints: count(combined, /(?:@tanstack|react-query)/gi),
    react_hook_form_fingerprints: count(combined, /react-hook-form/gi),
    zod_fingerprints: count(combined, /(?:\bzod\b|z\.object\()/gi),
    framer_motion_fingerprints: count(combined, /framer-motion/gi),
    ui_cliche_tokens: count(combined, /(?:bg-gradient-to-|backdrop-blur|rounded-2xl|rounded-3xl|shadow-xl|min-h-screen|max-w-7xl|container mx-auto|animate-pulse|group-hover:|from-primary|to-primary)/gi),
    vite_fingerprints: count(combined, /(?:vite\/client|__vite|vite\.svg)/gi),
    next_fingerprints: count(combined, /(?:__next_data__|_next\/static|next-route-announcer)/gi)
  };
}

export function getScoreBand(score) {
  if (score >= 85) return { id: "very-high", label: "Sehr hoher Vibe-Footprint", shortLabel: "Sehr hoch", summary: "Viele öffentlich sichtbare Muster ähneln Websites aus dem validierten Vibecoding-Korpus." };
  if (score >= 70) return { id: "high", label: "Hoher Vibe-Footprint", shortLabel: "Hoch", summary: "Mehrere starke technische Muster sprechen für einen ausgeprägten Vibecoding-Footprint." };
  if (score >= 50) return { id: "medium", label: "Mittlerer Vibe-Footprint", shortLabel: "Mittel", summary: "Die Website zeigt eine gemischte Signatur aus typischen und unspezifischen Mustern." };
  if (score >= 25) return { id: "light", label: "Leichter Vibe-Footprint", shortLabel: "Leicht", summary: "Einige Muster sind sichtbar, die Gesamtähnlichkeit bleibt jedoch begrenzt." };
  return { id: "low", label: "Niedriger Vibe-Footprint", shortLabel: "Niedrig", summary: "Nur wenige öffentlich sichtbare Muster ähneln dem validierten Vibecoding-Korpus." };
}

const featureLabels = {
  "extended:shadcn_variable_coverage": "shadcn-ähnliche Design-Tokens",
  "extended:data_slot_attributes": "wiederkehrende data-slot-Komponenten",
  "extended:radix_fingerprints": "Radix-Komponenten-Fingerprints",
  "extended:lucide_fingerprints": "Lucide-Icon-Fingerprints",
  "extended:cva_fingerprints": "Class-Variance-Authority-Muster",
  "extended:tailwind_merge_fingerprints": "Tailwind-Merge-Muster",
  "extended:ui_cliche_tokens": "häufige AI-UI-Kompositionsmuster",
  "extended:vite_fingerprints": "Vite-Build-Fingerprints",
  "extended:next_fingerprints": "Next.js-Build-Fingerprints",
  "extended:css_variables": "CSS-Token-Dichte",
  "extended:visible_words": "sichtbare Content-Dichte",
  "extended:html_bytes": "HTML-Strukturgröße",
  "metric:asset_bytes_fetched": "Größe der untersuchten Assets",
  "metric:unique_class_tokens": "Vielfalt der CSS-Klassen",
  "metric:data_attributes": "Dichte der data-Attribute",
  "metric:aria_attributes": "Dichte der ARIA-Attribute",
  "artifact:any_direct": "direkter Builder-Marker",
  "hint:count": "kombinierte Strukturhinweise"
};

function readableFeature(name) {
  if (featureLabels[name]) return featureLabels[name];
  if (name.startsWith("stack:")) return `${name.slice(6)}-Signatur`;
  const value = name.split(":").at(-1).replaceAll("_", " ");
  if (name.startsWith("metric:")) return `Strukturwert: ${value}`;
  if (name.startsWith("extended:")) return `Oberflächenmerkmal: ${value}`;
  if (name.startsWith("ratio:")) return `Verhältniswert: ${value}`;
  if (name.startsWith("artifact:")) return `Builder-Artefakt: ${value}`;
  if (name.startsWith("context:")) return `Technischer Kontext: ${value}`;
  if (name.startsWith("header:")) return `Response-Kontext: ${value}`;
  return value;
}

export function explainScore(model, features) {
  return model.feature_names
    .map((name) => {
      const stat = model.standardization[name];
      const rawValue = features[name];
      const transformedValue = (rawValue - stat.mean) / stat.standard_deviation;
      const contribution = model.coefficients[name] * transformedValue;
      const featureType = /^(?:stack|artifact|context|header):/.test(name) ? "binary" : "continuous";
      const present = featureType === "binary" ? rawValue > 0 : null;
      const label = readableFeature(name);
      const direction = contribution >= 0 ? "raises" : "lowers";
      const description = featureType === "binary"
        ? `${label} ${present ? "erkannt" : "nicht erkannt"}; das ${direction === "raises" ? "erhöht" : "senkt"} die Ähnlichkeit relativ zum Trainingsmittel.`
        : `${label} liegt ${rawValue >= stat.mean ? "über" : "unter"} dem Trainingsmittel; das ${direction === "raises" ? "erhöht" : "senkt"} die relative Modellbewertung.`;
      return { feature: name, label, description, contribution, direction, rawValue, transformedValue, trainingBaseline: stat.mean, featureType, state: present === null ? "measured" : present ? "detected" : "not-detected", unit: "relative-logit-contribution", summaryVisible: featureType !== "binary" || present };
    })
    .filter((item) => Math.abs(item.contribution) >= 0.08)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

function headerValue(headers, name) {
  const key = Object.keys(headers || {}).find((item) => item.toLowerCase() === name.toLowerCase());
  return String(key ? headers[key] : "").trim();
}

function parseCsp(value) {
  const directives = new Map();
  for (const part of value.split(";")) {
    const [name, ...tokens] = part.trim().split(/\s+/);
    if (name) directives.set(name.toLowerCase(), tokens.map((token) => token.toLowerCase()));
  }
  return directives;
}

function cspAssessment(value) {
  if (!value) return { status: "fail", detail: "Keine erzwungene Content-Security-Policy im Hauptdokument gefunden." };
  const directives = parseCsp(value);
  if (!directives.has("default-src") && !directives.has("script-src")) return { status: "fail", detail: "Die CSP enthält keine wirksame Default- oder Script-Quellenbegrenzung." };
  const defaultSources = directives.get("default-src") || [];
  const scriptSources = directives.get("script-src") || defaultSources;
  const scriptElementSources = directives.get("script-src-elem") || scriptSources;
  const scriptAttributeSources = directives.get("script-src-attr") || scriptSources;
  const effectiveScriptTokens = [...scriptSources, ...scriptElementSources, ...scriptAttributeSources];
  const sourceTokens = [...directives.entries()].filter(([name]) => /^(?:(?:default|script|style|img|font|connect|media|object|frame|child|worker)-src|script-src-(?:elem|attr)|style-src-(?:elem|attr))$/.test(name)).flatMap(([, tokens]) => tokens);
  const broadScriptSource = effectiveScriptTokens.some((token) => token === "*" || /^(?:https?|data|blob):$/i.test(token) || /:\/\/\*\./.test(token));
  if (broadScriptSource || sourceTokens.includes("*") || sourceTokens.includes("'unsafe-eval'")) return { status: "fail", detail: "Die CSP erlaubt globale, breite Script-Quellen oder unsafe-eval und bietet deshalb keinen belastbaren Basisschutz." };
  if (sourceTokens.includes("'unsafe-inline'")) return { status: "warn", detail: "Die CSP begrenzt Quellen, erlaubt aber weiterhin unsichere Inline-Ausführung oder -Styles." };
  return { status: "pass", detail: "Eine erzwungene und grundlegend restriktive Content-Security-Policy ist gesetzt." };
}

function hstsAssessment(url, value) {
  if (new URL(url).protocol !== "https:") return { status: "fail", detail: "HSTS schützt nur über HTTPS ausgelieferte Seiten." };
  if (!value) return { status: "warn", detail: "Kein HSTS-Header gefunden." };
  const match = value.match(/(?:^|;)\s*max-age\s*=\s*(\d+)/i);
  if (!match || Number(match[1]) <= 0) return { status: "fail", detail: "Der HSTS-Header ist ungültig oder durch max-age=0 deaktiviert." };
  if (Number(match[1]) < 15_552_000) return { status: "warn", detail: "HSTS ist aktiv, aber die max-age liegt unter sechs Monaten." };
  return { status: "pass", detail: "HSTS ist mit einer positiven, langfristigen max-age aktiv." };
}

function framingAssessment(csp, xFrameOptions) {
  const ancestors = parseCsp(csp).get("frame-ancestors");
  if (ancestors?.length && !ancestors.includes("*")) return { status: "pass", detail: "Framing ist über CSP frame-ancestors eingeschränkt." };
  if (/^(?:deny|sameorigin)$/i.test(xFrameOptions.trim())) return { status: "pass", detail: "Framing ist über einen gültigen X-Frame-Options-Wert eingeschränkt." };
  if (ancestors?.includes("*") || xFrameOptions) return { status: "fail", detail: "Die vorhandene Framing-Policy ist ungültig oder erlaubt uneingeschränktes Einbetten." };
  return { status: "fail", detail: "Kein wirksamer Frame-Schutz gefunden." };
}

function referrerAssessment(value) {
  if (!value) return { status: "warn", detail: "Keine Referrer-Policy gefunden." };
  const selected = value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean).at(-1);
  const strong = new Set(["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"]);
  const weak = new Set(["origin", "origin-when-cross-origin", "no-referrer-when-downgrade"]);
  if (strong.has(selected)) return { status: "pass", detail: `Die Referrer-Policy ${selected} begrenzt übertragene URL-Informationen.` };
  if (weak.has(selected)) return { status: "warn", detail: `Die Referrer-Policy ${selected} ist gültig, gibt aber mehr Informationen als nötig weiter.` };
  return { status: "fail", detail: selected === "unsafe-url" ? "unsafe-url überträgt vollständige URL-Informationen und ist keine sichere Baseline." : "Die Referrer-Policy ist ungültig oder nicht als Schutzpolicy einzuordnen." };
}

function permissionsAssessment(value) {
  if (!value) return { status: "warn", detail: "Keine Permissions-Policy gefunden." };
  const entries = value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const sensitive = /^(?:camera|microphone|geolocation|payment|usb|serial|bluetooth)\s*=/;
  if (entries.some((item) => sensitive.test(item) && /=\s*(?:\*|\(\s*\*\s*\))/.test(item))) return { status: "fail", detail: "Die Permissions-Policy erlaubt mindestens eine sensible Browser-Funktion für alle Origins." };
  const disabled = entries.filter((item) => /^(?:camera|microphone|geolocation|payment|usb|serial|bluetooth)\s*=\s*\(\s*\)$/.test(item));
  if (disabled.length >= 2) return { status: "pass", detail: "Mehrere nicht benötigte sensible Browser-Funktionen sind explizit deaktiviert." };
  if (entries.length) return { status: "warn", detail: "Eine Permissions-Policy ist vorhanden, begrenzt sensible Funktionen aber nur teilweise." };
  return { status: "fail", detail: "Die Permissions-Policy ist leer oder nicht auswertbar." };
}

export function auditSecurity(url, headers) {
  const get = (name) => headerValue(headers, name);
  const csp = get("content-security-policy");
  const cspResult = cspAssessment(csp);
  const hstsResult = hstsAssessment(url, get("strict-transport-security"));
  const frameResult = framingAssessment(csp, get("x-frame-options"));
  const referrerResult = referrerAssessment(get("referrer-policy"));
  const permissionsResult = permissionsAssessment(get("permissions-policy"));
  const nosniff = get("x-content-type-options").trim().toLowerCase() === "nosniff";
  const checks = [
    { id: "https", title: "HTTPS transport", status: new URL(url).protocol === "https:" ? "pass" : "fail", detail: new URL(url).protocol === "https:" ? "Die untersuchte Seite wurde verschlüsselt ausgeliefert." : "Die finale URL verwendet kein HTTPS.", action: "HTTPS erzwingen und HTTP dauerhaft auf HTTPS umleiten." },
    { id: "csp", title: "Content Security Policy", ...cspResult, action: "Eine restriktive CSP zunächst im Report-Only-Modus entwickeln und anschließend erzwingen." },
    { id: "hsts", title: "Strict Transport Security", ...hstsResult, action: "Nach vollständiger HTTPS-Migration HSTS mit positiver, ausreichend langer max-age aktivieren." },
    { id: "frame", title: "Clickjacking-Schutz", ...frameResult, action: "CSP frame-ancestors oder X-Frame-Options mit DENY/SAMEORIGIN passend zur Einbettungsstrategie setzen." },
    { id: "nosniff", title: "MIME-Sniffing-Schutz", status: nosniff ? "pass" : "warn", detail: nosniff ? "X-Content-Type-Options ist exakt auf nosniff gesetzt." : "X-Content-Type-Options: nosniff fehlt oder ist ungültig.", action: "X-Content-Type-Options exakt auf nosniff setzen." },
    { id: "referrer", title: "Referrer Policy", ...referrerResult, action: "Eine Policy wie strict-origin-when-cross-origin definieren." },
    { id: "permissions", title: "Permissions Policy", ...permissionsResult, action: "Nicht benötigte Kamera-, Mikrofon-, Standort- und Sensorrechte explizit mit leeren Allowlists deaktivieren." }
  ];
  const weights = { pass: 1, warn: 0.45, fail: 0 };
  return { score: Math.round(100 * checks.reduce((sum, check) => sum + weights[check.status], 0) / checks.length), checks };
}

export function buildRecommendations({ analysis, pageMetrics, extendedMetrics, security }) {
  const recommendations = [];
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const add = (id, category, priority, title, why, action, basis = "observed") => recommendations.push({ id, category, priority, title, why, action, basis });
  for (const check of security.checks.filter((item) => item.status !== "pass")) {
    add(`VF-SEC-${check.id.toUpperCase()}`, "security", check.status === "fail" ? "high" : "medium", check.title, check.detail, check.action);
  }
  if (analysis.directEvidence.length) add("VF-CTX-BUILDER-PROVENANCE", "design", "low", "Builder-Provenienz bewusst entscheiden", "Direkte Builder-Marker legen öffentlich die verwendete Erstellungstechnologie offen, sind aber nicht automatisch ein Qualitätsproblem.", "Prüfen, ob Badge oder Generator-Metadaten zur gewünschten Transparenz und Marke passen. Nur aus einem klaren Brand-, Privacy- oder Release-Grund ändern.", "context");
  if (extendedMetrics.shadcn_variable_coverage >= 8 || extendedMetrics.data_slot_attributes >= 4) add("VF-DES-COMPONENT-SYSTEM", "design", "high", "Das Standard-Component-System individualisieren", "Die ausgelieferten Design-Tokens und Komponenten ähneln stark verbreiteten Starter-Systemen.", "Eigene Typografie, Radien, Spacing, Zustände und Komponenten-Anatomie definieren – nicht nur Farben austauschen.");
  if (extendedMetrics.ui_cliche_tokens >= 8) add("VF-DES-GENERIC-UI", "design", "medium", "Generische AI-UI-Muster reduzieren", "Viele wiederkehrende Gradient-, Blur-, Shadow- und Rounded-Patterns erzeugen einen austauschbaren Eindruck.", "Pro Screen eine klare visuelle Idee wählen und dekorative Effekte entfernen, die keine Hierarchie oder Funktion tragen.");
  if (pageMetrics.asset_bytes_fetched > 900_000) add("VF-ENG-ASSET-PAYLOAD", "engineering", "high", "JavaScript- und CSS-Payload verkleinern", "Die begrenzt untersuchten Same-Origin-Assets sind bereits groß und erhöhen Ladezeit sowie Angriffsfläche.", "Bundle-Analyse durchführen, unbenutzte Libraries entfernen, Routen splitten und schwere Komponenten lazy laden.");
  if (pageMetrics.inline_script_bytes > 80_000) add("VF-ENG-INLINE-JS", "engineering", "medium", "Inline-JavaScript reduzieren", "Große Inline-Skripte erschweren CSP, Caching und Wartbarkeit.", "Skripte in versionierte Module verschieben und eine nonce-/hash-basierte CSP einführen.");
  if (pageMetrics.headings < 2 || extendedMetrics.sections < 1) add("VF-CONTENT-HIERARCHY", "content", "medium", "Informationshierarchie schärfen", "Wenige semantische Überschriften oder Bereiche erschweren Orientierung und wirken wie ein unstrukturierter App-Shell.", "Eine klare H1–H3-Struktur, benannte Bereiche und kurze handlungsorientierte Texte ergänzen.");
  if (!recommendations.some((item) => item.category === "design" && item.basis === "observed")) add("VF-GUIDE-DESIGN", "design", "low", "Visuelle Eigenständigkeit manuell prüfen", "Der begrenzte Oberflächenscan hat kein hochkonfidentes Designproblem erkannt; Produktabsicht und Markenwirkung bleiben eine manuelle Prüfung.", "Typografie, Komponenten-Anatomie, Spacing und visuelle Leitidee auf drei zentralen Screens gegen Starter-Defaults prüfen.", "guidance");
  if (!recommendations.some((item) => item.category === "engineering" && item.basis === "observed")) add("VF-GUIDE-RELEASE", "engineering", "low", "Release-Hygiene manuell bestätigen", "Der öffentliche Scan kann Tests, Secrets, interne Abhängigkeiten und Fehlerpfade im Repository nicht beurteilen.", "Dependency-Audit, Secret-Scan, Typecheck, Tests, Bundle-Budget und kontrollierte Fehleransicht im Release-Prozess prüfen.", "guidance");
  if (!recommendations.some((item) => item.category === "accessibility" && item.basis === "observed")) add("VF-GUIDE-A11Y", "accessibility", "low", "Accessibility-Smoke-Test durchführen", "Der Scan leitet aus der Anzahl von ARIA-Attributen bewusst kein Accessibility-Urteil ab.", "Kernflow nur mit Tastatur durchlaufen, Fokus sichtbar halten, Namen und Labels prüfen, Kontraste messen und mit einem Screenreader testen.", "guidance");
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
