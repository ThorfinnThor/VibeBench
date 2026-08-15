const parkingBodyPatterns = [
  { id: "sedo-parking", pattern: /(?:sedoparking\.com|img\.sedoparking\.com|sedo\.com\/search\/details)/i },
  { id: "domain-for-sale", pattern: /(?:this|the) domain (?:name )?(?:is|may be) for sale/i },
  { id: "buy-this-domain", pattern: /buy this domain/i }
];

const interstitialBodyPatterns = [
  { id: "cloudflare-challenge", pattern: /(?:cf-chl-|challenge-platform|checking your browser before accessing)/i },
  { id: "generic-browser-check", pattern: /<title>\s*just a moment[.!…]?\s*<\/title>/i },
  { id: "domain-expired", pattern: /(?:this domain has expired|domain is pending renewal|renewal instructions)/i }
];

export function assessDevelopmentPageQuality({ headers, html = "" }) {
  const signals = [];
  const server = headers?.get?.("server") || "";
  if (/^parking(?:\/|\s|$)/i.test(server)) signals.push("parking-server-header");
  for (const rule of parkingBodyPatterns) {
    if (rule.pattern.test(html)) signals.push(rule.id);
  }
  for (const rule of interstitialBodyPatterns) {
    if (rule.pattern.test(html)) signals.push(rule.id);
  }
  const source = String(html || "").trim();
  if (source.length < 32) signals.push("empty-or-near-empty-document");
  if (!/<(?:html|body|main|article|section|div|form|svg|canvas)\b/i.test(source)) signals.push("no-meaningful-document-structure");
  return {
    eligible: signals.length === 0,
    disqualifying_signals: [...new Set(signals)]
  };
}
