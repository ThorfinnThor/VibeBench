import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const imprint = read("../app/imprint/page.tsx");
const privacy = read("../app/privacy/page.tsx");
const terms = read("../app/terms/page.tsx");
const contact = read("../app/contact/page.tsx");
const home = read("../components/VibeFootprintHome.tsx");
const legalLinks = read("../components/LegalFooterLinks.tsx");
const layout = read("../app/layout.tsx");
const config = read("../next.config.ts");

test("imprint exposes the supplied sole-proprietor identity and direct contact", () => {
  for (const value of ["SeitenHafen361", "Einzelunternehmen", "Schayan Yousefian", "Freienwalder Str. 34", "13359 Berlin", "info@vibefootprint.com"]) {
    assert.match(imprint, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(imprint, /§ 5 DDG/);
  assert.match(imprint, /§ 18 Abs\. 2 MStV/);
});

test("privacy notice documents the actual scan, hosting, analytics and retention boundaries", () => {
  assert.match(privacy, /Vercel Web Analytics/);
  assert.match(privacy, /private, no-store/);
  assert.match(privacy, /Arbeitsspeicher/);
  assert.match(privacy, /Ziel-URL, Domain, IP-Adresse, Request-ID/);
  assert.match(privacy, /Art\. 22 DSGVO/);
  assert.doesNotMatch(home, /window\.localStorage/);
});

test("terms establish a B2B-only individual offer and preserve mandatory liability", () => {
  assert.match(terms, /ausschließlich an Unternehmer/i);
  assert.match(terms, /individuelles Angebot/);
  assert.match(terms, /Websites untersuchen, zu deren Prüfung du berechtigt bist/);
  assert.match(terms, /Vorsatz und grober Fahrlässigkeit/);
  assert.match(terms, /Leben, Körper oder Gesundheit/);
  assert.match(terms, /Zwingende gesetzliche Haftung bleibt unberührt/);
});

test("the customer path is actionable and legal links are globally reusable", () => {
  assert.match(contact, /mailto:info@vibefootprint.com/);
  assert.match(contact, /exclusively to businesses and self-employed professionals/);
  for (const route of ["/contact", "/imprint", "/privacy", "/terms"]) assert.match(legalLinks, new RegExp(route));
});

test("fonts are self-hosted and browser policy contains no Google font origins", () => {
  assert.match(layout, /next\/font\/local/);
  assert.doesNotMatch(config, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(config, /poweredByHeader: false/);
  assert.doesNotMatch(read("../app/globals.css"), /@import url|fonts\.googleapis\.com/);
});
