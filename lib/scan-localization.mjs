const bands = {
  "very-high": { label: "Very high Vibe-Footprint", shortLabel: "Very high", summary: "Many publicly visible patterns resemble websites in the validated vibe-coding corpus." },
  high: { label: "High Vibe-Footprint", shortLabel: "High", summary: "Several strong technical patterns point to a pronounced vibe-coding footprint." },
  medium: { label: "Medium Vibe-Footprint", shortLabel: "Medium", summary: "The website shows a mixed signature of typical and non-specific patterns." },
  light: { label: "Light Vibe-Footprint", shortLabel: "Light", summary: "Some patterns are visible, but overall similarity remains limited." },
  low: { label: "Low Vibe-Footprint", shortLabel: "Low", summary: "Only a few publicly visible patterns resemble the validated vibe-coding corpus." }
};

const verdicts = {
  direct: { eyebrow: "Direct evidence", title: "Visible builder artifact", summary: "The loaded website contains at least one concrete, publicly visible marker of an AI builder." },
  indicative: { eyebrow: "Structural context", title: "General structural patterns", summary: "Several modern stack and DOM patterns are visible. These patterns also occur frequently on human-developed websites." },
  indeterminate: { eyebrow: "No direct evidence", title: "No reliable attribution", summary: "The bounded public scan found no sufficiently specific builder artifact." }
};

const featureLabels = {
  "extended:shadcn_variable_coverage": "shadcn-like design tokens",
  "extended:data_slot_attributes": "recurring data-slot components",
  "extended:radix_fingerprints": "Radix component fingerprints",
  "extended:lucide_fingerprints": "Lucide icon fingerprints",
  "extended:cva_fingerprints": "Class Variance Authority patterns",
  "extended:tailwind_merge_fingerprints": "Tailwind Merge patterns",
  "extended:ui_cliche_tokens": "common AI UI composition patterns",
  "extended:vite_fingerprints": "Vite build fingerprints",
  "extended:next_fingerprints": "Next.js build fingerprints",
  "extended:css_variables": "CSS token density",
  "extended:visible_words": "visible content density",
  "extended:html_bytes": "HTML structure size",
  "metric:asset_bytes_fetched": "size of inspected assets",
  "metric:unique_class_tokens": "CSS class variety",
  "metric:data_attributes": "data-attribute density",
  "metric:aria_attributes": "ARIA attribute density",
  "artifact:any_direct": "direct builder marker",
  "hint:count": "combined structural hints"
};

const recommendationText = {
  "Builder-Provenienz bewusst entscheiden": ["Decide deliberately on builder provenance", "Direct builder markers reveal the publicly visible creation technology, but they are not automatically a quality problem.", "Check whether badges or generator metadata fit the intended transparency and brand. Change them only for a clear brand, privacy or release reason."],
  "Das Standard-Component-System individualisieren": ["Make the default component system your own", "The delivered design tokens and components strongly resemble common starter systems.", "Define your own typography, radii, spacing, states and component anatomy — do not only swap colors."],
  "Generische AI-UI-Muster reduzieren": ["Reduce generic AI UI patterns", "Recurring gradient, blur, shadow and rounded patterns create an interchangeable impression.", "Choose one clear visual idea per screen and remove decoration that carries no hierarchy or function."],
  "JavaScript- und CSS-Payload verkleinern": ["Reduce the JavaScript and CSS payload", "The bounded same-origin assets are already large, increasing load time and attack surface.", "Run a bundle analysis, remove unused libraries, split routes and lazy-load heavy components."],
  "Inline-JavaScript reduzieren": ["Reduce inline JavaScript", "Large inline scripts make CSP, caching and maintenance harder.", "Move scripts into versioned modules and introduce a nonce- or hash-based CSP."],
  "Informationshierarchie schärfen": ["Sharpen the information hierarchy", "Few semantic headings or sections make orientation harder and can feel like an unstructured app shell.", "Add a clear H1–H3 structure, named sections and concise action-oriented copy."],
  "Visuelle Eigenständigkeit manuell prüfen": ["Review visual distinctiveness manually", "The bounded surface scan found no high-confidence design issue; product intent and brand expression still require human review.", "Review typography, component anatomy, spacing and visual direction on three key screens against starter defaults."],
  "Release-Hygiene manuell bestätigen": ["Confirm release hygiene manually", "A public scan cannot assess tests, secrets, internal dependencies or repository error paths.", "Review dependency and secret audits, typechecks, tests, bundle budgets and controlled error views in the release process."],
  "Accessibility-Smoke-Test durchführen": ["Run an accessibility smoke test", "The scan deliberately does not infer an accessibility verdict from ARIA attribute counts.", "Walk through the core flow by keyboard, keep focus visible, check names and labels, measure contrast and test with a screen reader."]
};

const securityCopy = {
  https: {
    pass: ["The inspected page was delivered over an encrypted connection.", "Enforce HTTPS and permanently redirect HTTP to HTTPS."],
    fail: ["The final URL does not use HTTPS.", "Enforce HTTPS and permanently redirect HTTP to HTTPS."]
  },
  csp: {
    fail: ["No enforced Content-Security-Policy was found in the main document.", "Develop a restrictive CSP in Report-Only mode first, then enforce it."],
    warn: ["The CSP limits sources but still allows unsafe inline execution or styles.", "Develop a restrictive CSP in Report-Only mode first, then enforce it."],
    pass: ["An enforced and fundamentally restrictive Content-Security-Policy is set.", "Develop a restrictive CSP in Report-Only mode first, then enforce it."]
  },
  hsts: {
    fail: ["HSTS is invalid or disabled with max-age=0.", "After completing the HTTPS migration, enable HSTS with a positive, sufficiently long max-age."],
    warn: ["HSTS is active, but max-age is below six months.", "After completing the HTTPS migration, enable HSTS with a positive, sufficiently long max-age."],
    pass: ["HSTS is active with a positive, long-term max-age.", "After completing the HTTPS migration, enable HSTS with a positive, sufficiently long max-age."]
  },
  frame: {
    fail: ["No effective frame protection was found.", "Set CSP frame-ancestors or X-Frame-Options to match the embedding strategy."],
    pass: ["Framing is restricted through CSP frame-ancestors or a valid X-Frame-Options value.", "Set CSP frame-ancestors or X-Frame-Options to match the embedding strategy."]
  },
  nosniff: {
    warn: ["X-Content-Type-Options: nosniff is missing or invalid.", "Set X-Content-Type-Options exactly to nosniff."],
    pass: ["X-Content-Type-Options is set exactly to nosniff.", "Set X-Content-Type-Options exactly to nosniff."]
  },
  referrer: {
    warn: ["No Referrer-Policy was found.", "Define a policy such as strict-origin-when-cross-origin."],
    fail: ["The Referrer-Policy is invalid or cannot be classified as a protection policy.", "Define a policy such as strict-origin-when-cross-origin."],
    pass: ["The Referrer-Policy limits the URL information that is transferred.", "Define a policy such as strict-origin-when-cross-origin."]
  },
  permissions: {
    warn: ["A Permissions-Policy is present but only partially limits sensitive capabilities.", "Explicitly disable unused camera, microphone, location and sensor permissions with empty allowlists."],
    fail: ["The Permissions-Policy allows at least one sensitive browser capability for all origins.", "Explicitly disable unused camera, microphone, location and sensor permissions with empty allowlists."],
    pass: ["Several unnecessary sensitive browser capabilities are explicitly disabled.", "Explicitly disable unused camera, microphone, location and sensor permissions with empty allowlists."]
  }
};

const securityTitleToId = {
  "HTTPS transport": "https",
  "Content Security Policy": "csp",
  "Strict Transport Security": "hsts",
  "Clickjacking-Schutz": "frame",
  "Clickjacking protection": "frame",
  "MIME-Sniffing-Schutz": "nosniff",
  "MIME sniffing protection": "nosniff",
  "Referrer Policy": "referrer",
  "Permissions Policy": "permissions"
};
const securityTitles = { https: "HTTPS transport", csp: "Content Security Policy", hsts: "Strict Transport Security", frame: "Clickjacking protection", nosniff: "MIME sniffing protection", referrer: "Referrer Policy", permissions: "Permissions Policy" };

const outcomes = {
  client_rate_limited: ["Beta limit reached", "Too many scans were started for this access in a short period.", "Try again after ten minutes."],
  service_busy: ["Scan service is busy", "The limited beta capacity is currently full.", "Try again in a few seconds."],
  target_scan_in_progress: ["Website is already being analyzed", "A scan for this website is already running.", "Wait briefly for the existing result."],
  invalid_request: ["Invalid request", "The scan request could not be processed as valid JSON.", "Reload the page and start the scan again."],
  invalid_url: ["Invalid URL", "The input is not a valid public website URL.", "Enter a complete domain such as example.com."],
  credentials_not_supported: ["Credentials in URLs are not supported", "VibeFootprint does not process URLs containing a username or password.", "Use a public URL without embedded credentials."],
  unsupported_protocol: ["Protocol not supported", "Only public HTTP and HTTPS websites can be analyzed.", "Use a URL beginning with http:// or https://."],
  private_address: ["Private address blocked", "Local and private network targets are not loaded for security reasons.", "Use a publicly reachable website."],
  access_blocked: ["Website blocked the scan", "The target refused the public request. This is not a classification result.", "The URL can only be assessed if the website permits the bounded public request."],
  not_found: ["Page not found", "The target returned HTTP 404. No website content could be analyzed.", "Check the path and domain."],
  target_rate_limited: ["Website is rate-limiting requests", "The target returned HTTP 429. No classification result is available.", "Try again after a pause."],
  target_temporarily_unavailable: ["Website temporarily unavailable", "The target returned a temporary HTTP status. No classification result is available.", "Try again after a short pause."],
  target_unavailable: ["Website currently unavailable", "The target returned a server error. The scan could not be completed.", "Try again later."],
  target_http_error: ["Website cannot be scanned", "The target returned an HTTP error. No classification result is available.", "Check the URL and public reachability."],
  html_too_large: ["HTML exceeds the safety limit", "The HTML response exceeds the 1.5 MB limit of the safe quick scan.", "A complete result is not possible for this URL with the current quick scan."],
  not_html: ["Not an HTML website", "The URL did not return supported HTML content.", "Use a public HTML page rather than a file or API."],
  ineligible_document: ["No scannable website document", "The response does not represent a complete and unambiguous public website surface.", "Use a direct URL to the actual public website document."],
  unsupported_encoding: ["Character encoding not supported", "The website uses an encoding that the bounded scanner cannot reliably analyze.", "Use a UTF-8 version of the page or wait for an extended scanner."],
  insufficient_evidence: ["Not enough scannable evidence", "Public resources were too incomplete or limited to produce a reliable score.", "Try again later. A technical acquisition failure is not a Vibe-Footprint."],
  redirect_failed: ["Redirect could not be resolved safely", "The redirect chain could not be completed within the security rules.", "Use the final public URL directly if possible."],
  target_timeout: ["Website responds too slowly", "The target did not respond within the bounded time window.", "Try again later."],
  dns_failed: ["Domain could not be resolved", "The domain could not be reliably resolved to a public network address.", "Check the spelling or try again later."],
  connection_failed: ["Scan service unavailable", "The website could not be fully analyzed just now. No score was created.", "Check the URL and connection, then try again."],
  incompatible_response: ["Incompatible response", "The scan service did not return a fully analyzable response.", "Reload the page and try again."],
  scan_cancelled: ["Scan cancelled", "The running scan was stopped. A previous result remains visible.", "Start the scan again when ready."],
  client_timeout: ["Scan time limit reached", "The full scan could not finish within the shared time budget.", "Try again later or use a more direct target URL."]
};

function englishFeatureLabel(feature) {
  if (featureLabels[feature]) return featureLabels[feature];
  const value = feature.split(":").at(-1).replaceAll("_", " ");
  if (feature.startsWith("stack:")) return `${value} signature`;
  if (feature.startsWith("metric:")) return `structure value: ${value}`;
  if (feature.startsWith("extended:")) return `surface signal: ${value}`;
  if (feature.startsWith("ratio:")) return `ratio: ${value}`;
  if (feature.startsWith("artifact:")) return `builder artifact: ${value}`;
  if (feature.startsWith("context:")) return `technical context: ${value}`;
  if (feature.startsWith("header:")) return `response context: ${value}`;
  return value;
}

function localizeDriver(driver) {
  const label = englishFeatureLabel(driver.feature);
  const direction = driver.direction === "raises" ? "raises" : "lowers";
  if (driver.featureType === "binary") {
    return { ...driver, label, description: `${label} ${driver.state === "detected" ? "detected" : "not detected"}; this ${direction} similarity relative to the training average.` };
  }
  const relation = Number.isFinite(driver.rawValue) && Number.isFinite(driver.trainingBaseline) && driver.rawValue >= driver.trainingBaseline ? "above" : "below";
  return { ...driver, label, description: `${label} is ${relation} the training average; this ${direction} the relative model assessment.` };
}

function localizeCoverage(coverage) {
  const labels = { broad: "Broad", standard: "Standard", limited: "Limited" };
  const { assetsFetched, assetCandidates, assetsDiscovered } = coverage.scope;
  const summary = coverage.level === "broad"
    ? assetsDiscovered > assetCandidates ? `HTML and ${assetsFetched} of ${assetCandidates} selected same-origin assets were analyzed; ${assetsDiscovered} matching assets were found in total.` : "HTML and several public same-origin assets were analyzed."
    : coverage.level === "standard"
      ? assetCandidates === 0 ? "The assessment is based on public HTML; no matching external same-origin assets were found." : "Public HTML and part of the discovered same-origin assets were analyzed."
      : "Public HTML was analyzed, but relevant same-origin assets were only partially readable.";
  return { ...coverage, label: labels[coverage.level], summary };
}

export function localizeScanPayload(payload, locale = "en") {
  if (locale !== "en" || !payload) return payload;
  const next = { ...payload };
  if (next.verdict) next.verdict = { ...next.verdict, ...(verdicts[next.verdict.level] || {}) };
  if (next.vibeScore) next.vibeScore = { ...next.vibeScore, band: { ...next.vibeScore.band, ...bands[next.vibeScore.band.id] }, meaning: "Similarity between the publicly visible website patterns and the validated VibeFootprint corpus.", caveat: "The value does not measure generated-code share or authorship." };
  if (next.evidenceCoverage) next.evidenceCoverage = localizeCoverage(next.evidenceCoverage);
  if (next.scoreDrivers) next.scoreDrivers = { ...next.scoreDrivers, raises: next.scoreDrivers.raises.map(localizeDriver), lowers: next.scoreDrivers.lowers.map(localizeDriver) };
  if (next.security?.checks) next.security = { ...next.security, checks: next.security.checks.map((check) => { const copy = securityCopy[check.id]?.[check.status]; return copy ? { ...check, title: securityTitles[check.id] || check.title, detail: copy[0], action: copy[1] } : check; }) };
  if (next.recommendations) next.recommendations = next.recommendations.map((item) => {
    const copy = recommendationText[item.title];
    if (copy) return { ...item, title: copy[0], why: copy[1], action: copy[2] };
    const securityId = securityTitleToId[item.title];
    const security = securityId ? securityCopy[securityId]?.[item.priority === "high" ? "fail" : "warn"] || securityCopy[securityId]?.pass : null;
    return security ? { ...item, why: security[0], action: security[1] } : item;
  });
  if (next.technicalOutcome) next.technicalOutcome = localizeTechnicalOutcome(next.technicalOutcome);
  if (next.warning) next.warning = "The 0–100 index measures uncalibrated similarity to the validated corpus. It does not estimate code origin, generated-code share or authorship.";
  return next;
}

export function localizeTechnicalOutcome(outcome, locale = "en") {
  if (locale !== "en" || !outcome) return outcome;
  const copy = outcomes[outcome.code];
  return copy ? { ...outcome, title: copy[0], summary: copy[1], action: copy[2] } : outcome;
}
