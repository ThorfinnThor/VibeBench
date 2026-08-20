export type SeoLocale = "en" | "de";

export type SeoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoPageContent = {
  locale: SeoLocale;
  slug: string;
  alternateSlug: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  boundary: string;
  sections: SeoSection[];
  faq: { question: string; answer: string }[];
};

export const englishSeoPages: Record<string, SeoPageContent> = {
  methodology: {
    locale: "en",
    slug: "methodology",
    alternateSlug: "methodik",
    eyebrow: "Transparent methodology",
    title: "How the VibeFootprint website scan works",
    metaTitle: "Website Scan Methodology",
    description: "Understand the public evidence, scoring boundary, security checks and limitations behind every VibeFootprint website scan.",
    intro: "VibeFootprint turns publicly delivered website signals into two separate assessments: a qualitative pattern-similarity index and a public security-header baseline. The method is intentionally bounded so the result remains useful without claiming to know who authored a website.",
    boundary: "A Vibe-Footprint is not a percentage of generated code, an authorship verdict or proof that a particular builder was used.",
    sections: [
      { heading: "1. What the scanner collects", paragraphs: ["The scan begins with the public HTML document and its response headers. It may then inspect a bounded selection of same-origin scripts, stylesheets and manifest information over validated, peer-pinned connections.", "No login, repository connection or private source code is requested. The target website can still record the scanner’s ordinary public requests in its server logs."], bullets: ["Public HTML and document metadata", "Selected response headers", "A limited set of same-origin assets", "Public structural and stack signals"] },
      { heading: "2. How the Vibe-Footprint is produced", paragraphs: ["The frozen reference model combines public technical and structural features into a value from 0 to 100. A higher value means that more of the observed surface resembles patterns in the reference corpus; a lower value means less observed similarity.", "The score is an uncalibrated qualitative index. Individual score drivers describe relative model influence rather than additive points, and evidence breadth is reported separately instead of silently changing the score."] },
      { heading: "3. Why security is a separate score", paragraphs: ["The security baseline evaluates selected values in public main-document headers. A strong security score does not lower the Vibe-Footprint, and a high Vibe-Footprint does not reduce the security score.", "Keeping both assessments independent prevents design similarity from being presented as a vulnerability and prevents strong headers from being presented as evidence of originality."], bullets: ["Content Security Policy", "Strict Transport Security", "Frame and content-type protection", "Referrer and permissions policies"] },
      { heading: "4. Interpretation and limitations", paragraphs: ["The public-surface scan does not execute a complete browser, test application behavior or inspect backend systems. It cannot replace repository review, penetration testing, accessibility testing or product QA.", "Results should be used as a prioritized review aid: inspect the cited evidence, decide which changes fit the product, implement them safely and compare a fresh scan after deployment."] }
    ],
    faq: [
      { question: "Can VibeFootprint prove that a website was made with AI?", answer: "No. It measures similarity between observed public website patterns and a reference corpus. It does not establish authorship, causality or generated-code share." },
      { question: "Does the scanner need source-code access?", answer: "No. The standard scan uses the public website surface and a bounded selection of same-origin resources." },
      { question: "Is the security baseline a penetration test?", answer: "No. It is a focused review of selected publicly visible response-header protections." }
    ]
  },
  "vibe-coding-website-checker": {
    locale: "en",
    slug: "vibe-coding-website-checker",
    alternateSlug: "vibe-coding-website-checker",
    eyebrow: "Free public website scan",
    title: "Vibe-coding website checker with actionable results",
    metaTitle: "Vibe Coding Website Checker",
    description: "Check a public website for vibe-coding pattern similarity, security headers and practical improvement opportunities.",
    intro: "VibeFootprint analyzes the public surface of a website and returns a 0–100 pattern-similarity index, a separate security baseline and a report that explains what to review next.",
    boundary: "The checker identifies observable similarities and risks. It does not claim to identify the author or calculate an AI-generated-code percentage.",
    sections: [
      { heading: "What the checker helps you answer", paragraphs: ["A single score without evidence is hard to trust. VibeFootprint pairs the score with evidence breadth, relative score drivers, concrete findings and implementation prompts so teams can decide what deserves attention."], bullets: ["Does the public interface resemble recurring patterns in the reference corpus?", "Which observed signals most influenced that similarity?", "Are important public security headers missing or ineffective?", "What can a designer or developer improve first?"] },
      { heading: "What a high Vibe-Footprint means", paragraphs: ["A high score means that many observed public patterns resemble the reference corpus. It is not automatically a defect count: a website can have high similarity while exposing only a few concrete quality or security findings.", "The full report therefore separates score explanation from actionable issues. Score drivers explain the model result; findings describe changes that have a defensible public basis."] },
      { heading: "Useful for founders, agencies and development teams", paragraphs: ["Founders can use the overview to understand whether a rapidly built website needs a more distinctive design or stronger launch safeguards. Agencies can turn the report into a transparent client conversation. Development teams can copy scoped prompts into their coding workflow and validate the result after deployment."] },
      { heading: "How to use the result", paragraphs: ["Start with high-priority observed findings, then review optional guidance in context. Make changes in the repository, test them normally, deploy and run a new public scan. A lower footprint may indicate more distinct public patterns, while a higher security baseline indicates stronger observed header protection."] }
    ],
    faq: [
      { question: "Is this an AI website detector?", answer: "It addresses that search need more carefully: VibeFootprint checks public pattern similarity but does not present the result as proof of AI authorship." },
      { question: "How long does a scan take?", answer: "The public scan and report-preparation experience is designed to complete in about ten seconds, although network conditions and the target website can affect the technical request." },
      { question: "Can I scan a website I do not own?", answer: "The scanner accesses only public resources, but you should use the result responsibly and avoid presenting it as proof of authorship or wrongdoing." }
    ]
  },
  "vibe-coding-security-checklist": {
    locale: "en",
    slug: "vibe-coding-security-checklist",
    alternateSlug: "vibe-coding-sicherheitscheck",
    eyebrow: "Safer public launches",
    title: "A practical security checklist for vibe-coded websites",
    metaTitle: "Vibe Coding Security Checklist",
    description: "Use this practical checklist to review public security headers, application behavior and repository safeguards before launching an AI-assisted website.",
    intro: "Fast AI-assisted development can shorten the path from idea to deployment, but it does not remove the need for normal security engineering. This checklist separates what VibeFootprint can observe publicly from checks that still require repository and application access.",
    boundary: "The VibeFootprint security baseline covers selected public headers only. Passing it does not certify the application as secure.",
    sections: [
      { heading: "Public protections the scanner can review", paragraphs: ["The scan examines selected response-header values on the main public document. These controls reduce common browser-side exposure when they are configured for the actual application rather than copied as placeholders."], bullets: ["Use HTTPS and a meaningful Strict-Transport-Security policy", "Develop and enforce a restrictive Content Security Policy", "Prevent unwanted framing and MIME-type sniffing", "Limit referrer leakage and unnecessary browser permissions"] },
      { heading: "Repository checks before launch", paragraphs: ["These checks cannot be established from a public URL and should be completed in the codebase and deployment environment."], bullets: ["Remove exposed secrets and rotate anything previously committed", "Review dependencies, lockfiles and known vulnerabilities", "Validate authorization on every privileged server action", "Apply server-side input validation and output encoding", "Separate development, preview and production credentials"] },
      { heading: "Product and workflow checks", paragraphs: ["Exercise login, password reset, forms, payments, uploads and role changes with negative as well as successful cases. Confirm that logs do not contain secrets or unnecessary personal data and that abuse controls exist for expensive endpoints."], bullets: ["Rate-limit scans, messages and generation endpoints", "Test error states without leaking internal details", "Back up critical data and rehearse recovery", "Assign an owner for monitoring and incident response"] },
      { heading: "Turn findings into safe changes", paragraphs: ["Treat generated implementation prompts as scoped starting points, not automatic patches. Review the affected code, test expected and adversarial behavior, deploy through the normal release process and rescan the public surface."] }
    ],
    faq: [
      { question: "Does vibe coding make a website insecure?", answer: "Not by definition. Risk depends on the architecture, implementation, review process and deployment controls—not on the tool used to write code." },
      { question: "What does the security score measure?", answer: "It summarizes selected publicly visible header protections on the main document. It remains independent from the Vibe-Footprint." },
      { question: "What still needs manual testing?", answer: "Authentication, authorization, forms, payments, backend logic, dependencies, secrets, runtime behavior and accessibility require additional testing." }
    ]
  },
  "how-to-tell-if-a-website-was-vibe-coded": {
    locale: "en",
    slug: "how-to-tell-if-a-website-was-vibe-coded",
    alternateSlug: "vibe-coding-website-erkennen",
    eyebrow: "Interpret patterns carefully",
    title: "How to tell if a website shows vibe-coding patterns",
    metaTitle: "How to Tell If a Website Was Vibe Coded",
    description: "Learn which public design and technical patterns may resemble vibe-coded websites—and why no public scan can prove authorship.",
    intro: "There is no single reliable visual marker that proves a website was vibe coded. A useful review looks for combinations of repeated design, structure and implementation signals, then keeps those observations separate from conclusions about authorship.",
    boundary: "Similar patterns can come from templates, design systems, libraries, deadlines or human preference. Pattern similarity is evidence for review, not a verdict.",
    sections: [
      { heading: "Recurring design patterns", paragraphs: ["Highly interchangeable hero sections, repeated rounded cards, decorative gradients, large blur effects and weakly differentiated sections may create a generic impression. None of these is conclusive on its own; many established design systems use the same conventions."], bullets: ["Repeated card compositions with little content hierarchy", "Generic marketing copy that does not explain the product", "Decorative effects used without a functional role", "Inconsistent typography, spacing or interaction states"] },
      { heading: "Public technical and structural signals", paragraphs: ["Delivered HTML and same-origin assets can expose framework conventions, class-token patterns, inline code volume and repeated component structure. Some builders may also leave direct public markers, but absence of a marker does not rule out a tool and presence should be interpreted in context."] },
      { heading: "Quality and security are different questions", paragraphs: ["A website can strongly resemble common vibe-coding patterns and still be functional and secure. It can also look completely custom while exposing serious vulnerabilities. That is why VibeFootprint reports similarity, concrete quality findings and public header protection separately."] },
      { heading: "A responsible assessment process", paragraphs: ["Use multiple observable signals, disclose the limitations, avoid accusations and focus the conversation on improvements. The most useful outcome is not a label; it is a prioritized plan for stronger design decisions, safer engineering and clearer product communication."] }
    ],
    faq: [
      { question: "What is the biggest giveaway of a vibe-coded website?", answer: "There is no universal giveaway. Repeated generic patterns across design, content and implementation are more informative than any single visual feature." },
      { question: "Can builder fingerprints prove which tool was used?", answer: "A direct public marker may support a narrow observation, but markers can be removed, inherited or introduced indirectly. They should not be treated as complete authorship evidence." },
      { question: "Why use a score at all?", answer: "The score compresses many public signals into an orientation value. The evidence and limitations beside it are necessary for responsible interpretation." }
    ]
  }
};

export const germanSeoPages: Record<string, SeoPageContent> = {
  methodik: {
    locale: "de", slug: "methodik", alternateSlug: "methodology", eyebrow: "Transparente Methodik", title: "So funktioniert der VibeFootprint-Website-Scan", metaTitle: "Methodik des Website-Scans", description: "Verstehe Evidenz, Score-Grenzen, Security-Prüfungen und Einschränkungen hinter jedem VibeFootprint-Scan.",
    intro: "VibeFootprint macht aus öffentlich ausgelieferten Website-Signalen zwei getrennte Bewertungen: einen qualitativen Musterähnlichkeitsindex und eine Baseline öffentlich sichtbarer Security-Header.", boundary: "Der Vibe-Footprint ist weder ein Anteil generierten Codes noch ein Beweis für Autorenschaft oder einen bestimmten Builder.",
    sections: [
      { heading: "1. Was der Scanner erfasst", paragraphs: ["Der Scan beginnt mit dem öffentlichen HTML-Dokument und seinen Response-Headern. Anschließend kann er eine begrenzte Auswahl gleich-originiger Skripte, Stylesheets und Manifestinformationen über geprüfte, IP-gepinnte Verbindungen untersuchen.", "Login, Repository oder privater Quellcode werden nicht angefordert."], bullets: ["Öffentliches HTML und Dokumentmetadaten", "Ausgewählte Response-Header", "Begrenzte Auswahl gleich-originiger Assets", "Öffentliche Struktur- und Stack-Signale"] },
      { heading: "2. Wie der Vibe-Footprint entsteht", paragraphs: ["Das eingefrorene Referenzmodell kombiniert öffentliche technische und strukturelle Merkmale zu einem Wert von 0 bis 100. Ein höherer Wert bedeutet mehr beobachtete Ähnlichkeit mit dem Referenzkorpus.", "Der Wert ist ein unkalibrierter qualitativer Index. Score-Treiber zeigen relative Modellwirkung und keine addierbaren Einzelpunkte."] },
      { heading: "3. Warum Security getrennt bewertet wird", paragraphs: ["Die Security-Baseline prüft ausgewählte Werte öffentlich sichtbarer Header. Ein guter Security-Score senkt den Vibe-Footprint nicht – und ein hoher Vibe-Footprint verschlechtert den Security-Score nicht."], bullets: ["Content Security Policy", "Strict Transport Security", "Frame- und Content-Type-Schutz", "Referrer- und Permissions-Policies"] },
      { heading: "4. Interpretation und Grenzen", paragraphs: ["Der Public-Surface-Scan führt keinen vollständigen Browser aus und untersucht weder Backend noch Repository. Er ersetzt keine Penetrationstests, Accessibility-Tests oder Produkt-QA.", "Nutze das Ergebnis als priorisierte Prüfhilfe: Evidenz ansehen, passende Änderungen auswählen, sicher umsetzen und nach dem Deployment erneut scannen."] }
    ],
    faq: [
      { question: "Kann VibeFootprint beweisen, dass eine Website mit AI erstellt wurde?", answer: "Nein. Der Scan misst die Ähnlichkeit öffentlicher Muster mit einem Referenzkorpus und beweist weder Autorenschaft noch Kausalität." },
      { question: "Braucht der Scanner Quellcodezugriff?", answer: "Nein. Der Standardscan verwendet die öffentliche Website und eine begrenzte Auswahl gleich-originiger Ressourcen." },
      { question: "Ist die Security-Baseline ein Penetrationstest?", answer: "Nein. Sie ist eine fokussierte Prüfung ausgewählter öffentlich sichtbarer Header." }
    ]
  },
  "vibe-coding-website-checker": {
    locale: "de", slug: "vibe-coding-website-checker", alternateSlug: "vibe-coding-website-checker", eyebrow: "Kostenloser Public-Surface-Scan", title: "Vibe-Coding-Website-Checker mit konkreten Ergebnissen", metaTitle: "Vibe-Coding-Website-Checker", description: "Prüfe eine öffentliche Website auf Vibe-Coding-Muster, Security-Header und konkrete Verbesserungsmöglichkeiten.",
    intro: "VibeFootprint analysiert die öffentliche Oberfläche einer Website und liefert einen Musterähnlichkeitsindex von 0 bis 100, eine separate Security-Baseline und einen verständlichen Verbesserungsreport.", boundary: "Der Checker erkennt beobachtbare Ähnlichkeiten und Risiken. Er identifiziert weder den Autor noch einen Anteil AI-generierten Codes.",
    sections: [
      { heading: "Welche Fragen der Checker beantwortet", paragraphs: ["Ein Score ohne Evidenz ist schwer einzuordnen. Deshalb verbindet VibeFootprint das Ergebnis mit Auswertungsbreite, Score-Treibern, konkreten Findings und umsetzbaren Prompts."], bullets: ["Ähnelt die Oberfläche wiederkehrenden Mustern im Referenzkorpus?", "Welche Signale beeinflussen die Ähnlichkeit?", "Fehlen wichtige öffentlich sichtbare Security-Header?", "Was sollten Design oder Entwicklung zuerst verbessern?"] },
      { heading: "Was ein hoher Vibe-Footprint bedeutet", paragraphs: ["Ein hoher Wert bedeutet, dass viele beobachtete Muster dem Referenzkorpus ähneln. Er ist keine Fehleranzahl: Eine Website kann eine hohe Ähnlichkeit und trotzdem nur wenige konkrete Qualitäts- oder Security-Findings haben.", "Der Report trennt daher Score-Erklärung und Handlungsbedarf konsequent."] },
      { heading: "Für Gründer, Agenturen und Entwicklungsteams", paragraphs: ["Gründer erkennen, wo eine schnell entwickelte Website eigenständiger oder sicherer werden sollte. Agenturen erhalten eine transparente Grundlage für Kundengespräche. Teams können begrenzte Fix-Prompts übernehmen und das Ergebnis nach dem Deployment neu prüfen."] },
      { heading: "So nutzt du das Ergebnis", paragraphs: ["Beginne mit priorisierten beobachteten Findings und prüfe optionale Hinweise im Produktkontext. Ändere den Code im normalen Workflow, teste, deploye und starte anschließend einen neuen Scan."] }
    ],
    faq: [
      { question: "Ist das ein AI-Website-Detektor?", answer: "VibeFootprint beantwortet diese Suchintention genauer: Der Scan prüft öffentliche Musterähnlichkeit, gibt sie aber nicht als Beweis für AI-Autorenschaft aus." },
      { question: "Wie lange dauert ein Scan?", answer: "Scan und Report-Aufbereitung sind auf etwa zehn Sekunden ausgelegt; Netzwerk und Zielwebsite können die technische Anfrage beeinflussen." },
      { question: "Darf ich fremde Websites scannen?", answer: "Der Scanner verwendet nur öffentliche Ressourcen. Ergebnisse sollten verantwortungsvoll und nie als Beweis für Autorenschaft oder Fehlverhalten dargestellt werden." }
    ]
  },
  "vibe-coding-sicherheitscheck": {
    locale: "de", slug: "vibe-coding-sicherheitscheck", alternateSlug: "vibe-coding-security-checklist", eyebrow: "Sicherer öffentlich starten", title: "Praktische Security-Checkliste für vibe-gecodete Websites", metaTitle: "Vibe-Coding-Security-Checkliste", description: "Prüfe Security-Header, Anwendungsverhalten und Repository-Schutzmaßnahmen vor dem Launch einer AI-unterstützten Website.",
    intro: "AI-unterstützte Entwicklung verkürzt den Weg von der Idee zum Deployment, ersetzt aber keine normale Security-Arbeit. Diese Checkliste trennt öffentlich prüfbare Signale von Aufgaben, die Zugriff auf Anwendung und Repository benötigen.", boundary: "Die VibeFootprint-Security-Baseline deckt ausgewählte öffentliche Header ab. Ein guter Wert zertifiziert die Anwendung nicht als sicher.",
    sections: [
      { heading: "Öffentlich prüfbare Schutzmaßnahmen", paragraphs: ["Der Scan bewertet ausgewählte Headerwerte des Hauptdokuments. Richtig konfiguriert reduzieren sie häufige browserseitige Risiken."], bullets: ["HTTPS und sinnvolle Strict-Transport-Security nutzen", "Restriktive Content Security Policy entwickeln und erzwingen", "Ungewolltes Framing und MIME-Sniffing verhindern", "Referrer-Daten und unnötige Browserrechte begrenzen"] },
      { heading: "Repository-Prüfungen vor dem Launch", paragraphs: ["Diese Punkte lassen sich nicht aus einer öffentlichen URL ableiten und gehören in Codebase und Deployment-Umgebung."], bullets: ["Secrets entfernen und ehemals veröffentlichte Werte rotieren", "Dependencies, Lockfiles und bekannte Schwachstellen prüfen", "Autorisierung für jede privilegierte Serveraktion validieren", "Serverseitige Eingabevalidierung einsetzen", "Development-, Preview- und Production-Zugänge trennen"] },
      { heading: "Produkt- und Workflow-Prüfungen", paragraphs: ["Teste Login, Passwort-Reset, Formulare, Zahlungen, Uploads und Rollenwechsel mit erfolgreichen und negativen Fällen. Prüfe Logs auf Secrets oder unnötige personenbezogene Daten."], bullets: ["Teure Endpunkte mit Rate Limits schützen", "Fehlerzustände ohne interne Details ausliefern", "Backups und Wiederherstellung testen", "Verantwortung für Monitoring und Vorfälle festlegen"] },
      { heading: "Findings sicher umsetzen", paragraphs: ["Behandle generierte Fix-Prompts als begrenzten Ausgangspunkt und nicht als automatischen Patch. Prüfe den betroffenen Code, teste normales und missbräuchliches Verhalten, deploye kontrolliert und scanne erneut."] }
    ],
    faq: [
      { question: "Macht Vibe Coding Websites automatisch unsicher?", answer: "Nein. Das Risiko hängt von Architektur, Implementierung, Review und Deployment ab – nicht allein vom verwendeten Werkzeug." },
      { question: "Was misst der Security-Score?", answer: "Er fasst ausgewählte öffentlich sichtbare Header-Schutzmaßnahmen des Hauptdokuments zusammen und bleibt unabhängig vom Vibe-Footprint." },
      { question: "Was muss zusätzlich manuell getestet werden?", answer: "Authentifizierung, Autorisierung, Formulare, Zahlungen, Backend, Dependencies, Secrets, Laufzeitverhalten und Accessibility benötigen weitere Tests." }
    ]
  },
  "vibe-coding-website-erkennen": {
    locale: "de", slug: "vibe-coding-website-erkennen", alternateSlug: "how-to-tell-if-a-website-was-vibe-coded", eyebrow: "Muster sorgfältig einordnen", title: "Woran man Vibe-Coding-Muster auf Websites erkennt", metaTitle: "Vibe-Coding-Website erkennen", description: "Lerne, welche öffentlichen Design- und Technikmuster vibe-gecodeten Websites ähneln – und warum kein Scan Autorenschaft beweist.",
    intro: "Es gibt kein einzelnes visuelles Merkmal, das Vibe Coding sicher beweist. Eine sinnvolle Prüfung betrachtet Kombinationen aus Design-, Struktur- und Implementierungssignalen und trennt Beobachtung von Aussagen über Autorenschaft.", boundary: "Ähnliche Muster können durch Templates, Designsysteme, Libraries, Zeitdruck oder menschliche Vorlieben entstehen. Musterähnlichkeit ist Prüfevidenz, kein Urteil.",
    sections: [
      { heading: "Wiederkehrende Designmuster", paragraphs: ["Austauschbare Hero-Bereiche, viele abgerundete Karten, dekorative Gradients, Blur-Effekte und wenig differenzierte Sektionen können generisch wirken. Keines dieser Merkmale ist allein aussagekräftig."], bullets: ["Wiederholte Karten ohne klare Inhaltshierarchie", "Generisches Marketing-Wording ohne Produkterklärung", "Dekorative Effekte ohne funktionale Rolle", "Inkonsistente Typografie, Abstände oder Interaktionszustände"] },
      { heading: "Öffentliche technische und strukturelle Signale", paragraphs: ["Ausgeliefertes HTML und gleich-originige Assets können Framework-Konventionen, Class-Token-Muster, Inline-Code und wiederholte Komponentenstrukturen zeigen. Direkte Builder-Marker sind möglich, aber weder ihr Vorhandensein noch ihr Fehlen liefert eine vollständige Aussage."] },
      { heading: "Qualität und Security sind andere Fragen", paragraphs: ["Eine Website kann häufigen Vibe-Coding-Mustern ähneln und trotzdem funktionieren und sicher sein. Eine vollständig individuelle Website kann dagegen ernste Schwachstellen haben. Deshalb trennt VibeFootprint Ähnlichkeit, konkrete Qualitätsfindings und Header-Schutz."] },
      { heading: "Verantwortungsvoll bewerten", paragraphs: ["Nutze mehrere beobachtbare Signale, nenne die Grenzen, vermeide Anschuldigungen und richte das Gespräch auf Verbesserungen. Das sinnvolle Ergebnis ist kein Label, sondern ein Plan für eigenständigeres Design, sichere Entwicklung und klare Kommunikation."] }
    ],
    faq: [
      { question: "Was ist das deutlichste Zeichen für eine vibe-gecodete Website?", answer: "Es gibt kein universelles Zeichen. Wiederkehrende generische Muster über Design, Inhalt und Implementierung sind aussagekräftiger als ein einzelnes Feature." },
      { question: "Beweisen Builder-Fingerprints das verwendete Tool?", answer: "Ein direkter öffentlicher Marker kann eine enge Beobachtung stützen, kann aber entfernt, vererbt oder indirekt eingebracht worden sein." },
      { question: "Warum überhaupt ein Score?", answer: "Der Score verdichtet viele öffentliche Signale zu einem Orientierungswert. Evidenz und Einschränkungen sind für die Einordnung unverzichtbar." }
    ]
  }
};

export const seoPagePairs = Object.values(englishSeoPages).map((page) => ({
  en: `/${page.slug}`,
  de: `/de/${page.alternateSlug}`
}));

