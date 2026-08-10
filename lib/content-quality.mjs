const parkingBodyPatterns = [
  { id: "sedo-parking", pattern: /(?:sedoparking\.com|img\.sedoparking\.com|sedo\.com\/search\/details)/i },
  { id: "domain-for-sale", pattern: /(?:this|the) domain (?:name )?(?:is|may be) for sale/i },
  { id: "buy-this-domain", pattern: /buy this domain/i }
];

export function assessDevelopmentPageQuality({ headers, html = "" }) {
  const signals = [];
  const server = headers?.get?.("server") || "";
  if (/^parking(?:\/|\s|$)/i.test(server)) signals.push("parking-server-header");
  for (const rule of parkingBodyPatterns) {
    if (rule.pattern.test(html)) signals.push(rule.id);
  }
  return {
    eligible: signals.length === 0,
    disqualifying_signals: [...new Set(signals)]
  };
}
