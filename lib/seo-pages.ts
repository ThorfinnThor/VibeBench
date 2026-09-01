export type SeoLocale = "en";

export type SeoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  relatedResource?: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    linkLabel: string;
  };
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
  relatedLinks?: { href: string; label: string; description: string }[];
};

export const englishSeoPages: Record<string, SeoPageContent> = {
  about: {
    locale: "en",
    slug: "about",
    eyebrow: "Product identity and responsibility",
    title: "What is VibeFootprint?",
    metaTitle: "About VibeFootprint",
    description: "Learn what VibeFootprint is, who publishes its website intelligence, what its public scan measures and where the product deliberately limits its claims.",
    updatedAt: "2026-08-31",
    intro: "VibeFootprint is a website-intelligence product and editorial publisher for teams reviewing websites built at AI speed. It combines a bounded public-surface scan with practical guidance while keeping pattern similarity, security and private implementation claims separate.",
    boundary: "VibeFootprint does not identify an author, calculate generated-code share, certify security or replace repository, accessibility and application testing.",
    sections: [
      { heading: "A direct definition", paragraphs: ["VibeFootprint reviews publicly delivered website evidence. Its scanner reports a qualitative 0–100 pattern-similarity index, a separate baseline for selected public security headers, evidence breadth and bounded recommendations.", "The product is designed for interpretation rather than attribution. Similarity can identify useful review questions, but it cannot prove how a website was created or who wrote its code."] },
      { heading: "Who the product is for", paragraphs: ["Founders can use VibeFootprint to turn an unfamiliar technical surface into concrete questions. Agencies can use the report to structure a client review. Designers and developers can use the evidence and implementation guidance as inputs to normal product, code and release work."], bullets: ["Founders evaluating a fast-built website", "Agencies preparing launches and handoffs", "Designers reviewing interface distinctiveness", "Developers hardening public delivery and implementation quality"] },
      { heading: "Who publishes and maintains the information", paragraphs: ["VibeFootprint is a product of SeitenHafen361, a sole proprietorship owned by Schayan Yousefian in Berlin. SeitenHafen361 is responsible for the public methodology, scan experience, editorial articles and practical guide library on this domain.", "Editorial pages identify VibeFootprint Editorial as the organizational author and show publication information. Technical guidance links to primary standards or first-party documentation where appropriate, and every article states the evidence boundary for its claims."] },
      { heading: "What the scan can and cannot observe", paragraphs: ["The standard scanner requests a public HTML document, selected response headers and a bounded set of same-origin resources over validated connections. It does not request a login, repository or private source code.", "That boundary is why VibeFootprint reports observable public evidence separately from tasks that require application access, specialist testing or business context."], bullets: ["Public HTML and document metadata", "Selected public response-header values", "A bounded selection of same-origin assets", "No private code, account or backend access"] },
      { heading: "Availability and commercial status", paragraphs: ["As of 28 August 2026, VibeFootprint offers one complete website scan for a one-time €4.99 launch price instead of the intended regular €49.99 price. Payment is handled through Stripe Checkout and the scan is bound to the public URL entered at checkout."] },
      { heading: "How to evaluate VibeFootprint responsibly", paragraphs: ["Read the methodology before treating a score as evidence. Use observed findings to prioritize work, keep the Vibe-Footprint separate from the security baseline and verify important changes through the appropriate repository, browser, application or specialist test.", "No implementation on this website guarantees search rankings, AI citations or inclusion in a particular answer system. The editorial library is written to be useful to people first and structured so its factual boundaries can be extracted accurately."] }
    ],
    faq: [
      { question: "Is VibeFootprint an AI-authorship detector?", answer: "No. It measures public-pattern similarity and reports bounded evidence. It does not establish authorship, causality or generated-code share." },
      { question: "Who is responsible for the content?", answer: "VibeFootprint is published by SeitenHafen361, a sole proprietorship owned by Schayan Yousefian in Berlin. Editorial articles identify VibeFootprint Editorial as the organizational author." },
      { question: "How much does VibeFootprint cost?", answer: "During launch, one complete website scan costs €4.99 instead of the intended regular €49.99 price. It is a one-time Stripe payment with no subscription." },
      { question: "Does VibeFootprint guarantee search or AI visibility?", answer: "No. Crawlability, useful content and accurate structure improve readiness, but no page or markup can guarantee ranking, citation or inclusion in a specific search or answer system." }
    ]
  },
  pricing: {
    locale: "en",
    slug: "pricing",
    eyebrow: "Simple launch pricing",
    title: "One website audit. One clear launch price.",
    metaTitle: "Website Audit Pricing: €4.99 Launch Offer",
    description: "Run a free website scan preview, then unlock one complete VibeFootprint audit for €4.99 during launch. No subscription or source-code access.",
    updatedAt: "2026-09-01",
    intro: "Start with a genuine public-surface scan preview for free. If the result is useful, unlock the complete audit for that website for a one-time €4.99 launch price instead of the intended regular €49.99 price.",
    boundary: "The purchase covers one complete audit for the public website URL entered at checkout. It is not a subscription, monitoring plan, penetration test or guarantee of a particular score.",
    sections: [
      { heading: "What you can see before paying", paragraphs: ["The free preview runs the real public-surface scan before checkout. It shows the website’s qualitative Vibe-Footprint, the separate selected security-header baseline, evidence breadth and a high-level issue overview so you can decide whether the detailed report is useful."], bullets: ["Real public website scan preview", "Qualitative 0–100 pattern-similarity index", "Separate selected security-header score", "High-level quality and security issue counts"] },
      { heading: "What the €4.99 full audit unlocks", paragraphs: ["The paid audit reveals the evidence and implementation detail behind the preview. Findings remain separate from score drivers so a similarity signal is not presented as a defect, and public security observations remain independent from the Vibe-Footprint."], bullets: ["Exact upward and downward score drivers", "Prioritized evidence-backed quality findings", "Selected security-header checks and remediation", "Public launch checks and technical evidence", "Individual copy-ready fix prompts", "One combined prompt covering all reported fixes"] },
      { heading: "One-time payment, no subscription", paragraphs: ["The launch price is a single €4.99 payment processed through Stripe Checkout. There is no recurring charge. The checkout identifies the exact public website URL being purchased, and a successful payment unlocks the complete report for that URL.", "The intended regular price is €49.99. The current launch offer may end or change in the future; the amount displayed in Stripe Checkout is the authoritative total before payment."] },
      { heading: "What the purchase does not include", paragraphs: ["VibeFootprint examines a bounded public website surface. Buying the full audit does not expand the scan into private systems or turn the report into a certification."], bullets: ["No repository, account or private source-code access", "No penetration test or compliance certification", "No verification of authentication, databases or backend authorization", "No promise of search ranking, AI citation or business outcome"] },
      { heading: "How to use the audit", paragraphs: ["Run the preview, unlock the report only if its scope matches your decision, then work through the highest-priority observed findings. Apply changes in the normal repository and release process, test the intended behavior and scan the same public URL again after deployment."] }
    ],
    faq: [
      { question: "How much does a VibeFootprint audit cost?", answer: "During the launch offer, one complete website audit costs €4.99 instead of the intended regular €49.99 price." },
      { question: "Is VibeFootprint a subscription?", answer: "No. The €4.99 launch price is a one-time payment for one complete audit of the website URL entered at checkout." },
      { question: "Can I run a scan before paying?", answer: "Yes. The free preview runs the real public-surface scan and shows both independent scores plus a high-level issue overview before checkout." },
      { question: "What happens if the paid scan fails technically?", answer: "The payment remains bound to the same website URL so the scan can be retried. If it cannot be completed, contact info@vibefootprint.com with the Stripe confirmation for support." },
      { question: "Does the audit prove that a website was made with AI?", answer: "No. It reports public-pattern similarity and bounded evidence, not authorship, causality or generated-code share." }
    ]
  },
  methodology: {
    locale: "en",
    slug: "methodology",
    eyebrow: "Transparent methodology",
    title: "How the VibeFootprint website scan works",
    metaTitle: "How the VibeFootprint Website Scan Works",
    description: "See what the website scan measures, how pattern similarity and security stay separate, and why the result cannot prove authorship or generated code.",
    updatedAt: "2026-09-01",
    intro: "VibeFootprint turns publicly delivered website signals into two separate assessments: a qualitative pattern-similarity index and a public security-header baseline. The method is intentionally bounded so the result remains useful without claiming to know who authored a website.",
    boundary: "A Vibe-Footprint is not a percentage of generated code, an authorship verdict or proof that a particular builder was used.",
    sections: [
      { heading: "1. What the scanner collects", paragraphs: ["The scan begins with the public HTML document and its response headers. It may then inspect a bounded selection of same-origin scripts, stylesheets and manifest information over validated, peer-pinned connections.", "No login, repository connection or private source code is requested. The target website can still record the scanner’s ordinary public requests in its server logs."], bullets: ["Public HTML and document metadata", "Selected response headers", "A limited set of same-origin assets", "Public structural and stack signals"] },
      { heading: "2. How the Vibe-Footprint is produced", paragraphs: ["The frozen reference model combines public technical and structural features into a value from 0 to 100. A higher value means that more of the observed surface resembles patterns in the reference corpus; a lower value means less observed similarity.", "The score is an uncalibrated qualitative index. Individual score drivers describe relative model influence rather than additive points, and evidence breadth is reported separately instead of silently changing the score."] },
      { heading: "3. Why security is a separate score", paragraphs: ["The security baseline evaluates selected values in public main-document headers. A strong security score does not lower the Vibe-Footprint, and a high Vibe-Footprint does not reduce the security score.", "Keeping both assessments independent prevents design similarity from being presented as a vulnerability and prevents strong headers from being presented as evidence of originality."], bullets: ["Content Security Policy", "Strict Transport Security", "Frame and content-type protection", "Referrer and permissions policies"] },
      { heading: "4. Interpretation and limitations", paragraphs: ["The public-surface scan does not execute a complete browser, test application behavior or inspect backend systems. It cannot replace repository review, penetration testing, accessibility testing or product QA.", "Results should be used as a prioritized review aid: inspect the cited evidence, decide which changes fit the product, implement them safely and compare a fresh scan after deployment."], relatedResource: { eyebrow: "Complementary diagnostic", title: "Continue with AI-search readiness", description: "VibeFootprint stops at public pattern, quality and security evidence. If your next question is whether answer engines can identify the business, understand its offers and extract citable answers, FindYourAIScore evaluates entity clarity, offer clarity, sourceability, structured data and technical access.", href: "https://www.findyouraiscore.com/", linkLabel: "Check AI-search readiness with FindYourAIScore" } },
      { heading: "5. Automated-system transparency", paragraphs: ["VibeFootprint uses a frozen automated reference model to produce the qualitative pattern-similarity index. The product and model version are displayed with the result so material changes can be distinguished over time.", "The system evaluates a website surface, not a natural person. It does not make legal or similarly significant decisions, and users can request a correction or review by contacting info@vibefootprint.com."] }
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
    eyebrow: "Paid public website scan",
    title: "Vibe-coding website checker with actionable results",
    metaTitle: "AI Website Checker for Public Websites",
    description: "Check a public website for recurring AI-assisted patterns, visible security-header gaps and practical fixes. Start with a free VibeFootprint scan.",
    updatedAt: "2026-09-01",
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
      { question: "Can I scan a website I do not own?", answer: "Only scan websites you own or are authorized to review. Public availability alone does not authorize misuse, mass scanning or presenting a result as proof of authorship or wrongdoing." }
    ]
  },
  "vibe-coding-security-checklist": {
    locale: "en",
    slug: "vibe-coding-security-checklist",
    eyebrow: "Safer public launches",
    title: "A practical security checklist for vibe-coded websites",
    metaTitle: "Website Security Audit Checklist",
    description: "Review security headers, application boundaries and launch safeguards for an AI-assisted website. Know what a public scan can and cannot prove.",
    updatedAt: "2026-09-01",
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
  "ai-website-audit": {
    locale: "en",
    slug: "ai-website-audit",
    eyebrow: "AI-assisted website review",
    title: "A practical AI website audit for launch-ready decisions",
    metaTitle: "AI Website Audit for Launch Readiness",
    description: "Audit an AI-assisted website across public evidence, design, content and security boundaries before you invest in launch or growth.",
    updatedAt: "2026-09-01",
    intro: "An AI website can look finished while still leaving important questions unanswered. VibeFootprint gives founders, agencies and product teams a bounded first review of the delivered website, then points to the checks that need deeper access.",
    boundary: "A public website audit can prioritize visible evidence, but it cannot prove private application security, code authorship, business claims or production readiness on its own.",
    sections: [
      { heading: "What the audit reviews", paragraphs: ["The audit connects public signals to decisions a team can act on: whether the interface feels intentionally designed, whether key content is clear, whether selected browser protections are present and whether the launch surface exposes avoidable quality gaps."], bullets: ["Pattern similarity and evidence breadth", "Visible metadata, structure and content signals", "Selected public security headers", "Prioritized findings with copy-ready implementation prompts"] },
      { heading: "Why the evidence stays separated", paragraphs: ["A recurring interface pattern is not automatically a defect, and a missing header is not evidence about who wrote the code. The report keeps the qualitative Vibe-Footprint, security baseline and practical findings distinct so the next action is easier to judge." ] },
      { heading: "A useful first review for fast-built products", paragraphs: ["Use the audit before a public launch, client handoff or redesign decision. It helps a non-specialist identify the highest-value questions, while giving designers and developers a focused set of changes to inspect in the actual codebase and deployment environment." ] },
      { heading: "What happens after the report", paragraphs: ["Validate every recommendation against the product, make changes through the normal review process, test important user journeys and run a fresh scan after deployment. The goal is a better website and clearer evidence—not a lower score by itself." ] }
    ],
    faq: [
      { question: "What does an AI website audit tell me?", answer: "It summarizes observable public patterns, selected security-header protections and practical website findings, while clearly marking what needs repository or application access." },
      { question: "Does this audit prove a website was made with AI?", answer: "No. The Vibe-Footprint is a qualitative similarity index, not an authorship verdict or generated-code percentage." },
      { question: "Can I try the audit before paying?", answer: "Yes. The real public scan starts with a free preview. The complete report can then be unlocked for the one-time launch price shown at checkout." }
    ],
    relatedLinks: [
      { href: "/vibe-coding-website-checker", label: "See the public website checker", description: "Understand the evidence and boundaries of the free scan before you buy." },
      { href: "/pricing", label: "View the €4.99 launch offer", description: "See exactly what the complete one-time audit includes." },
      { href: "/vibe-coding-website-audit-framework", label: "Read the audit framework", description: "Use the editorial 90-minute framework for deeper review work." },
      { href: "/methodology", label: "Read the scan methodology", description: "Review how similarity, security and limitations are handled." }
    ]
  },
  "website-security-audit": {
    locale: "en",
    slug: "website-security-audit",
    eyebrow: "Public security review",
    title: "Website security audit for AI-assisted launches",
    metaTitle: "Website Security Audit for AI-Assisted Sites",
    description: "Review public security headers and launch safeguards on an AI-assisted website, with clear limits on what a URL scan cannot verify.",
    updatedAt: "2026-09-01",
    intro: "Fast delivery does not remove ordinary security work. This focused audit starts with the public response surface and turns visible gaps into a checklist for the repository, application and deployment team.",
    boundary: "The public baseline is not a penetration test, compliance audit or certification. Authentication, authorization, data handling and backend logic require authorized manual testing.",
    sections: [
      { heading: "What a public security audit can observe", paragraphs: ["A URL-based review can inspect selected response headers and delivered document signals that influence browser behavior. These checks are useful first evidence, not a complete security assessment."], bullets: ["Content Security Policy", "Strict Transport Security", "Frame and MIME-type protections", "Referrer and permissions policies"] },
      { heading: "What still requires access", paragraphs: ["The highest-impact application questions live behind the public surface. Review them in the codebase and runtime with explicit authorization before launch."], bullets: ["Authentication and authorization paths", "Secrets, dependencies and server actions", "Input validation, uploads and payment flows", "Logging, rate limits, backups and recovery"] },
      { heading: "Turn findings into an owned plan", paragraphs: ["Give each finding an owner, evidence target and verification step. Treat generated prompts as reviewable starting points, then test expected and adversarial behavior before deployment." ] },
      { heading: "Use the result responsibly", paragraphs: ["A stronger public baseline reduces some browser-side exposure; it does not certify the application. Rescan after changes and combine the result with threat modeling, code review and appropriate specialist testing." ] }
    ],
    faq: [
      { question: "Is this a penetration test?", answer: "No. It is a bounded public review of selected security headers and launch signals, not an exploit attempt or certification." },
      { question: "Can a public scan find backend vulnerabilities?", answer: "No. Private application logic, authorization, databases, secrets and dependency risk require authorized access and specialized testing." },
      { question: "Who is this useful for?", answer: "Founders, agencies and development teams can use it as a pre-launch evidence pass and as a way to scope the deeper security work that follows." }
    ],
    relatedLinks: [
      { href: "/vibe-coding-security-checklist", label: "Open the security checklist", description: "Work through public, repository and workflow checks before launch." },
      { href: "/guides/security", label: "Browse security guides", description: "Find focused guidance for headers, secrets, abuse controls and recovery." },
      { href: "/vibe-coding-website-checker", label: "Run the public checker", description: "Start with a free scan of the website surface." },
      { href: "/pricing", label: "See the full-audit price", description: "Unlock the complete report for the one-time launch offer." }
    ]
  },
  "ai-generated-frontend-code-review": {
    locale: "en",
    slug: "ai-generated-frontend-code-review",
    eyebrow: "Frontend quality review",
    title: "Review AI-generated frontend code before it reaches production",
    metaTitle: "AI-Generated Frontend Code Review",
    description: "Review AI-generated frontend code for behavior, accessibility, performance, security boundaries and maintainability before production release.",
    updatedAt: "2026-09-01",
    intro: "Generated interfaces often look convincing before their edge cases are exercised. This audit path helps teams connect visible delivery evidence to the repository and browser checks needed for a reliable frontend.",
    boundary: "A public scan can suggest review questions, but it cannot inspect private source code, test every interaction or establish code origin.",
    sections: [
      { heading: "Start with the user journey", paragraphs: ["Review the delivered experience before opening the code. Record the critical path, loading states, errors, keyboard behavior and responsive transitions so implementation findings stay connected to user outcomes." ] },
      { heading: "Inspect the code boundaries", paragraphs: ["In the repository, trace data flow and responsibility boundaries instead of judging code by whether it was generated. Look for duplicated logic, unsafe assumptions, hidden side effects and components that make unrelated changes travel together."], bullets: ["Stable types and explicit data states", "Server and client responsibilities", "Input validation and safe rendering", "Tests for critical journeys and failure states"] },
      { heading: "Check accessibility and performance", paragraphs: ["Exercise the interface with keyboard navigation, zoom, assistive technology and slow networks. Confirm that semantics, focus, status messages, loading behavior and asset delivery support the actual audience." ] },
      { heading: "Make the smallest coherent repair", paragraphs: ["Prioritize changes that improve user outcomes and reduce future change cost. Review generated patches, test regressions and verify the production result rather than optimizing for a diagnostic label." ] }
    ],
    faq: [
      { question: "Can VibeFootprint review my private repository?", answer: "No. The standard product reviews the public website only. Use the report to scope an authorized repository and application review." },
      { question: "Does code quality prove whether AI was used?", answer: "No. Code origin cannot be reliably established from a public pattern score or a visual impression." },
      { question: "What should I review first?", answer: "Start with critical user journeys, data boundaries, accessibility, error handling, security-sensitive actions and the tests that protect them." }
    ],
    relatedLinks: [
      { href: "/how-to-review-ai-generated-frontend-code", label: "Read the frontend review guide", description: "Follow a production-focused review process for generated frontend code." },
      { href: "/guides/engineering", label: "Browse engineering guides", description: "Find practical checks for semantics, performance and maintainability." },
      { href: "/vibe-coding-website-checker", label: "Run a public scan first", description: "Use delivered evidence to choose the next engineering questions." },
      { href: "/pricing", label: "View the complete audit", description: "See the one-time launch price and report contents." }
    ]
  },
  "ai-website-content-audit": {
    locale: "en",
    slug: "ai-website-content-audit",
    eyebrow: "Content clarity and trust",
    title: "AI website content audit for clearer, more credible pages",
    metaTitle: "AI Website Content Audit",
    description: "Audit AI-assisted website copy for clarity, evidence, search intent, trust and calls to action without manufacturing certainty.",
    updatedAt: "2026-09-01",
    intro: "AI-assisted copy can be fluent while remaining vague. This audit helps teams identify where the public page fails to explain the product, support a claim or guide a real visitor toward a useful next step.",
    boundary: "A content audit can assess delivered claims and structure, but it cannot verify business legitimacy, customer relationships, legal compliance or private analytics.",
    sections: [
      { heading: "Make the offer easy to understand", paragraphs: ["A visitor should be able to identify who the product is for, what it does, what happens next and why the claim is credible. Replace broad promises with concrete outcomes, boundaries and evidence that match the actual service." ] },
      { heading: "Review content as evidence", paragraphs: ["Inspect headings, page purpose, metadata, internal links, FAQs and calls to action as one system. Remove filler that sounds authoritative but does not help a visitor decide, compare or complete a task."], bullets: ["One clear search and user intent per page", "Specific claims tied to product behavior", "Visible proof with accurate context", "Descriptive links between related pages"] },
      { heading: "Protect trust in AI-assisted writing", paragraphs: ["Edit for audience, accuracy and accountability. Do not invent customer numbers, expertise, citations or certainty, and keep legal, medical, financial or security claims within the review required for their risk." ] },
      { heading: "Verify discovery and conversion", paragraphs: ["Read the page as a new visitor, follow every important link and test the primary action on mobile. Check rendered content, canonical URLs, structured data and indexability after publishing." ] }
    ],
    faq: [
      { question: "Does this audit generate replacement copy automatically?", answer: "The report provides scoped observations and copy-ready implementation prompts. The business owner remains responsible for factual claims and final editorial approval." },
      { question: "Can a content audit guarantee SEO rankings?", answer: "No. Clear, useful content supports search readiness, but rankings and AI citations depend on many changing systems and cannot be guaranteed." },
      { question: "What pages should I review first?", answer: "Start with the homepage, primary offer or service page, pricing, proof, contact and any page that receives qualified search traffic." }
    ],
    relatedLinks: [
      { href: "/guides/content", label: "Browse content and trust guides", description: "Improve claims, proof, calls to action and policy clarity." },
      { href: "/vibe-coding-seo-mistakes", label: "Read the SEO mistakes guide", description: "Diagnose thin content, metadata and internal discovery failures." },
      { href: "/guides", label: "Explore the full guide library", description: "Connect content work to design, engineering and launch checks." },
      { href: "/vibe-coding-website-checker", label: "Run a public scan", description: "Check the delivered page before and after your content changes." }
    ]
  },
  "website-launch-readiness-audit": {
    locale: "en",
    slug: "website-launch-readiness-audit",
    eyebrow: "Pre-launch decision support",
    title: "Website launch-readiness audit for fast-moving teams",
    metaTitle: "Website Launch Readiness Audit",
    description: "Check whether an AI-assisted website has the public evidence, content, security and release safeguards needed for a responsible launch.",
    updatedAt: "2026-09-01",
    intro: "Launch speed is valuable when the team can explain what was checked and how to recover. This audit gives founders and delivery teams a practical public-surface starting point, with explicit handoffs for deeper verification.",
    boundary: "Launch readiness is a decision supported by evidence, not a certificate. A public scan cannot verify private data flows, backend behavior, ownership or operational resilience.",
    sections: [
      { heading: "Check the public release surface", paragraphs: ["Confirm that the live domain, HTTPS, redirects, metadata, primary heading, visible offer and key calls to action work as one coherent experience. Record the production URL and release version before changes."], bullets: ["Canonical domain and redirect behavior", "Rendered content and mobile layout", "Primary journey, forms and contact path", "Indexability and basic metadata"] },
      { heading: "Assign the deeper checks", paragraphs: ["Repository and runtime owners must verify secrets, dependencies, authorization, backups, monitoring, rate limits, payment behavior and rollback. A checklist is useful only when each item has evidence and an owner." ] },
      { heading: "Use a clear go or no-go decision", paragraphs: ["Define stop conditions for broken critical journeys, unresolved security exposure, missing ownership or an inability to recover. Separate launch blockers from improvements that can be scheduled after release." ] },
      { heading: "Rescan after deployment", paragraphs: ["The production surface is the source of truth for headers, rendering, caching and third-party delivery. Run the public scan again after launch and keep the before-and-after evidence with the release record." ] }
    ],
    faq: [
      { question: "Does a launch audit guarantee a safe release?", answer: "No. It prioritizes public evidence and clarifies deeper checks, but the team remains responsible for application security, operations and the final release decision." },
      { question: "When should I run it?", answer: "Run the preview before launch, after major changes and again on the production domain once the release is live." },
      { question: "What is included in the complete report?", answer: "The full audit adds detailed score drivers, prioritized findings, selected security checks, launch evidence and copy-ready prompts for the reported fixes." }
    ],
    relatedLinks: [
      { href: "/guides/launch", label: "Browse launch workflow guides", description: "Coordinate owners, evidence, stop conditions and rollback." },
      { href: "/vibe-coding-security-checklist", label: "Review the security checklist", description: "Separate public header checks from repository and application work." },
      { href: "/guides/diagnostics", label: "Understand scan interpretation", description: "Keep scores, evidence breadth and limitations in context." },
      { href: "/pricing", label: "See the launch offer", description: "Unlock one complete audit for €4.99 during launch." }
    ]
  }
};
