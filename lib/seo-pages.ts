export type SeoLocale = "en";

export type SeoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SeoPageContent = {
  locale: SeoLocale;
  slug: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  updatedAt?: string;
  intro: string;
  boundary: string;
  sections: SeoSection[];
  faq: { question: string; answer: string }[];
};

export const englishSeoPages: Record<string, SeoPageContent> = {
  about: {
    locale: "en",
    slug: "about",
    eyebrow: "Product identity and responsibility",
    title: "What is VibeFootprint?",
    metaTitle: "About VibeFootprint",
    description: "Learn what VibeFootprint is, who publishes its website intelligence, what its public scan measures and where the product deliberately limits its claims.",
    updatedAt: "2026-08-24",
    intro: "VibeFootprint is a website-intelligence product and editorial publisher for teams reviewing websites built at AI speed. It combines a bounded public-surface scan with practical guidance while keeping pattern similarity, security and private implementation claims separate.",
    boundary: "VibeFootprint does not identify an author, calculate generated-code share, certify security or replace repository, accessibility and application testing.",
    sections: [
      { heading: "A direct definition", paragraphs: ["VibeFootprint reviews publicly delivered website evidence. Its scanner reports a qualitative 0–100 pattern-similarity index, a separate baseline for selected public security headers, evidence breadth and bounded recommendations.", "The product is designed for interpretation rather than attribution. Similarity can identify useful review questions, but it cannot prove how a website was created or who wrote its code."] },
      { heading: "Who the product is for", paragraphs: ["Founders can use VibeFootprint to turn an unfamiliar technical surface into concrete questions. Agencies can use the report to structure a client review. Designers and developers can use the evidence and implementation guidance as inputs to normal product, code and release work."], bullets: ["Founders evaluating a fast-built website", "Agencies preparing launches and handoffs", "Designers reviewing interface distinctiveness", "Developers hardening public delivery and implementation quality"] },
      { heading: "Who publishes and maintains the information", paragraphs: ["VibeFootprint is the named product, website publisher and organization responsible for the public methodology, scan experience, editorial articles and practical guide library on this domain.", "Editorial pages identify VibeFootprint Editorial as the responsible author and show publication information. Technical guidance links to primary standards or first-party documentation where appropriate, and every article states the evidence boundary for its claims."] },
      { heading: "What the scan can and cannot observe", paragraphs: ["The standard scanner requests a public HTML document, selected response headers and a bounded set of same-origin resources over validated connections. It does not request a login, repository or private source code.", "That boundary is why VibeFootprint reports observable public evidence separately from tasks that require application access, specialist testing or business context."], bullets: ["Public HTML and document metadata", "Selected public response-header values", "A bounded selection of same-origin assets", "No private code, account or backend access"] },
      { heading: "Availability and pricing status", paragraphs: ["As of 24 August 2026, the public scan and complete report are available without checkout during product testing. Commercial pricing has not been announced. This status should be treated as time-sensitive product information rather than a permanent pricing promise."] },
      { heading: "How to evaluate VibeFootprint responsibly", paragraphs: ["Read the methodology before treating a score as evidence. Use observed findings to prioritize work, keep the Vibe-Footprint separate from the security baseline and verify important changes through the appropriate repository, browser, application or specialist test.", "No implementation on this website guarantees search rankings, AI citations or inclusion in a particular answer system. The editorial library is written to be useful to people first and structured so its factual boundaries can be extracted accurately."] }
    ],
    faq: [
      { question: "Is VibeFootprint an AI-authorship detector?", answer: "No. It measures public-pattern similarity and reports bounded evidence. It does not establish authorship, causality or generated-code share." },
      { question: "Who is responsible for the content?", answer: "VibeFootprint is the responsible website publisher. Editorial articles identify VibeFootprint Editorial as the organizational author and link to primary guidance where appropriate." },
      { question: "Is VibeFootprint free?", answer: "As of 24 August 2026, the public scan and complete report are available without checkout during product testing. Commercial pricing has not been announced." },
      { question: "Does VibeFootprint guarantee search or AI visibility?", answer: "No. Crawlability, useful content and accurate structure improve readiness, but no page or markup can guarantee ranking, citation or inclusion in a specific search or answer system." }
    ]
  },
  methodology: {
    locale: "en",
    slug: "methodology",
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
  }
};
