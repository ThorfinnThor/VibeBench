export const TECHNICAL_SCAN_OUTCOMES = {
  success: { family: "success", retryable: false, label: "Technisch verwertbar" },
  navigation_timeout_unresolved: { family: "timeout", retryable: true, label: "Navigation-Timeout, Ursache unaufgelöst" },
  dns_unresolved: { family: "reachability", retryable: true, label: "DNS-Name nicht auflösbar" },
  certificate_error: { family: "reachability", retryable: false, label: "TLS-Zertifikatsfehler" },
  client_blocked: { family: "blocked", retryable: true, label: "Durch Browser/Client blockiert" },
  http_error: { family: "reachability", retryable: true, label: "HTTP-Fehler" },
  network_error: { family: "reachability", retryable: true, label: "Netzwerkfehler" },
  browser_error: { family: "collector", retryable: true, label: "Browser-/Navigationsfehler" },
  extractor_error: { family: "collector", retryable: true, label: "Extractor-Fehler" },
  unknown_error: { family: "unknown", retryable: true, label: "Unklassifizierter technischer Fehler" }
};

const rules = [
  ["navigation_timeout_unresolved", /navigation[_ -]?timeout|timed?\s*out/i],
  ["dns_unresolved", /err_name_not_resolved|enotfound|dns\s+(?:lookup\s+)?(?:failed|error)/i],
  ["certificate_error", /err_cert_|certificate|tls|ssl/i],
  ["client_blocked", /err_blocked_by_client|blocked\s+by\s+(?:client|browser)/i],
  ["http_error", /\bhttp\s*(?:status|error)?\s*[45]\d\d\b|response\s+[45]\d\d/i],
  ["network_error", /err_connection_|err_network_|econnreset|econnrefused|network\s+error/i],
  ["extractor_error", /extract|evaluate|dom\s+snapshot|serialization|invalid\s+feature/i],
  ["browser_error", /browser\s+use|navigation|net::err_/i]
];

export function classifyTechnicalScanOutcome(row) {
  if (row?.ok === true) return { code: "success", ...TECHNICAL_SCAN_OUTCOMES.success };
  const message = String(row?.error || "");
  const code = rules.find(([, pattern]) => pattern.test(message))?.[0] || "unknown_error";
  return { code, ...TECHNICAL_SCAN_OUTCOMES[code] };
}
