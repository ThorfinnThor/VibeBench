import { lookup } from "node:dns/promises";
import net from "node:net";
import { analyzeHtml } from "../../../lib/analyze-html.mjs";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 5;

function normalizeUrl(value) {
  const input = String(value || "").trim();
  if (!input || input.length > 2048) throw new Error("Bitte eine gültige öffentliche URL eingeben.");
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Nur öffentliche HTTP- und HTTPS-URLs werden unterstützt.");
  url.username = "";
  url.password = "";
  url.hash = "";
  return url;
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const value = address.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb") || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
}

async function validatePublicHost(url) {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Lokale und private Adressen werden nicht gescannt.");
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error("Die URL verweist auf eine lokale oder private Adresse.");
}

async function fetchPublicHtml(initialUrl) {
  let current = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await validatePublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "VibeBench/0.1 (+public website evidence scan)", accept: "text/html,application/xhtml+xml" }
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Weiterleitung ohne Ziel (HTTP ${response.status}).`);
      current = new URL(location, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Unsichere Weiterleitung wurde blockiert.");
      continue;
    }
    if (!response.ok) throw new Error(`Website antwortet mit HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) throw new Error("Die URL liefert keine HTML-Seite.");
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_HTML_BYTES) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("Die HTML-Antwort ist für den sicheren Schnellscan zu groß.");
    const headers = Object.fromEntries(response.headers.entries());
    return { html: new TextDecoder().decode(bytes), url: current.toString(), status: response.status, headers };
  }
  throw new Error("Zu viele Weiterleitungen.");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const inputUrl = normalizeUrl(body?.url);
    const fetched = await fetchPublicHtml(inputUrl);
    const analysis = analyzeHtml(fetched);
    return Response.json({
      ok: true,
      requestedUrl: inputUrl.toString(),
      resolvedUrl: fetched.url,
      httpStatus: fetched.status,
      analyzedAt: new Date().toISOString(),
      ...analysis,
      warning: "Pilotischer Evidenz-Scan – keine kalibrierte AI-Wahrscheinlichkeit und kein Beweis für Autorenschaft."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Der Scan ist fehlgeschlagen.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

