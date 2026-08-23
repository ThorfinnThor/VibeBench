export type EditorialFormat = "field-guide" | "comparison" | "audit" | "playbook" | "code-review" | "evidence-brief" | "threat-model" | "decision-guide" | "seo-clinic" | "debt-ledger" | "handoff-kit" | "test-lab" | "founder-brief" | "cost-model" | "accessibility-lab" | "tool-selection" | "privacy-map" | "migration-runbook";

export type EditorialSource = {
  label: string;
  href: string;
  note: string;
};

export type EditorialBlock =
  | { type: "prose"; eyebrow?: string; heading: string; paragraphs: string[]; bullets?: string[] }
  | { type: "ladder"; heading: string; intro: string; items: { level: string; title: string; evidence: string; interpretation: string }[] }
  | { type: "matrix"; heading: string; intro: string; columns: [string, string, string, string]; rows: [string, string, string, string][] }
  | { type: "steps"; heading: string; intro: string; items: { title: string; action: string; record: string }[] }
  | { type: "scenario"; heading: string; context: string; observations: string[]; conclusion: string }
  | { type: "scorecard"; heading: string; intro: string; items: { label: string; question: string; strong: string; weak: string }[] }
  | { type: "phases"; heading: string; intro: string; phases: { label: string; title: string; outcome: string; actions: string[] }[] }
  | { type: "gates"; heading: string; intro: string; gates: { name: string; pass: string; fail: string; evidence: string }[] }
  | { type: "claims"; heading: string; intro: string; claims: { status: "observable" | "inference" | "unknown"; claim: string; reason: string; wording: string }[] }
  | { type: "risks"; heading: string; intro: string; items: { threat: string; trigger: string; impact: string; control: string; access: string }[] }
  | { type: "decisions"; heading: string; intro: string; items: { question: string; yes: string; no: string; evidence: string }[] }
  | { type: "seoClinic"; heading: string; intro: string; items: { symptom: string; cause: string; repair: string; verify: string }[] }
  | { type: "ledger"; heading: string; intro: string; items: { debt: string; interest: string; signal: string; action: string }[] }
  | { type: "handoff"; heading: string; intro: string; items: { artifact: string; owner: string; acceptance: string; failure: string }[] }
  | { type: "testLab"; heading: string; intro: string; items: { experiment: string; setup: string; assertions: string; negative: string }[] }
  | { type: "controls"; heading: string; intro: string; items: { area: string; founderQuestion: string; risk: string; evidence: string }[] }
  | { type: "costModel"; heading: string; intro: string; items: { center: string; initial: string; recurring: string; trigger: string; decision: string }[] }
  | { type: "accessJourneys"; heading: string; intro: string; items: { journey: string; barrier: string; test: string; repair: string }[] }
  | { type: "toolScore"; heading: string; intro: string; items: { dimension: string; ask: string; strong: string; weak: string; exit: string }[] }
  | { type: "dataFlow"; heading: string; intro: string; items: { stage: string; data: string; purpose: string; risk: string; control: string }[] }
  | { type: "migration"; heading: string; intro: string; items: { phase: string; keep: string; replace: string; proof: string; rollback: string }[] }
  | { type: "faq"; heading: string; items: { question: string; answer: string }[] };

export type EditorialPage = {
  slug: string;
  format: EditorialFormat;
  formatLabel: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  dek: string;
  scope: string;
  audience: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  blocks: EditorialBlock[];
  sources: EditorialSource[];
  related: string[];
};

const methodology = { label: "VibeFootprint methodology", href: "/methodology", note: "Defines the public-surface evidence boundary and the meaning of the similarity index." };
const w3cAccessibility = { label: "W3C Web Accessibility Initiative", href: "https://www.w3.org/WAI/fundamentals/", note: "Primary guidance for treating accessibility as a user requirement rather than a visual preference." };
const owaspTesting = { label: "OWASP Web Security Testing Guide", href: "https://owasp.org/www-project-web-security-testing-guide/", note: "A structured reference for security testing beyond what a public URL scan can establish." };
const webPerformance = { label: "web.dev performance guidance", href: "https://web.dev/learn/performance/", note: "Practical browser-performance guidance and measurement concepts." };
const owaspAsvs = { label: "OWASP Application Security Verification Standard", href: "https://owasp.org/www-project-application-security-verification-standard/", note: "A requirements-based reference for defining and verifying application security controls." };
const nextProduction = { label: "Next.js production checklist", href: "https://nextjs.org/docs/app/guides/production-checklist", note: "Primary framework guidance for production readiness, performance, security and observability." };
const googleJavaScriptSeo = { label: "Google Search: JavaScript SEO basics", href: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics", note: "Primary guidance on how Google processes JavaScript pages and which rendering patterns can affect discovery." };
const googleCanonical = { label: "Google Search: canonical URL guidance", href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls", note: "Primary guidance for consolidating duplicate URLs and keeping indexing signals aligned." };
const githubCodeOwners = { label: "GitHub CODEOWNERS documentation", href: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners", note: "Primary documentation for making repository review ownership explicit." };
const webTesting = { label: "web.dev Learn Testing", href: "https://web.dev/learn/testing/", note: "A practical introduction to automated testing levels, assertions and test design for web applications." };
const wcag = { label: "W3C Web Content Accessibility Guidelines 2.2", href: "https://www.w3.org/TR/WCAG22/", note: "The W3C Recommendation defining testable accessibility success criteria across perceivable, operable, understandable and robust content." };
const ariaPractices = { label: "WAI-ARIA Authoring Practices Guide", href: "https://www.w3.org/WAI/ARIA/apg/", note: "Primary interaction and keyboard-pattern guidance for common accessible widgets." };
const nistPrivacy = { label: "NIST Privacy Framework", href: "https://www.nist.gov/privacy-framework", note: "A voluntary framework for identifying and managing privacy risk through organizational systems and data processing." };
const nistSsdf = { label: "NIST Secure Software Development Framework", href: "https://csrc.nist.gov/Projects/ssdf", note: "A risk-based set of secure software-development practices that can be integrated into different development lifecycles." };
const twelveFactor = { label: "The Twelve-Factor App", href: "https://12factor.net/", note: "A methodology covering portable configuration, dependencies, processes, logs and disposability for web applications." };

export const editorialPages: Record<string, EditorialPage> = {
  "how-to-tell-if-a-website-was-vibe-coded": {
    slug: "how-to-tell-if-a-website-was-vibe-coded",
    format: "field-guide",
    formatLabel: "Diagnostic field guide",
    eyebrow: "Evidence before labels",
    title: "How to know if a website was vibe coded",
    metaTitle: "How to Know If a Website Was Vibe Coded",
    description: "A practical field guide to recognizing vibe-coding patterns without confusing visual similarity, builder traces or quality issues with proof of authorship.",
    dek: "There is no single giveaway. A responsible assessment combines several public signals, tests plausible alternatives and states only what the evidence can support.",
    scope: "This guide helps you review publicly delivered website patterns. It cannot prove who wrote the code, which tool was used throughout a project or what percentage of the code was generated.",
    audience: "Founders, buyers, agencies and reviewers assessing a public website",
    readingMinutes: 11,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "prose", eyebrow: "The short answer", heading: "Look for a pattern cluster, not a visual cliché", paragraphs: [
        "Rounded cards, gradients, oversized headlines and familiar dashboard layouts are common across the modern web. Seeing one of them tells you almost nothing about authorship. The useful question is whether multiple independent parts of the delivered site show the same kind of unedited default thinking.",
        "Start with direct public traces, then move through implementation conventions, design repetition, product-specific content and operational polish. Confidence should decrease—not increase—as you move from a direct marker toward subjective visual impressions."
      ], bullets: ["Separate observation from interpretation in your notes", "Record at least one credible non-AI explanation for every signal", "Treat quality, security and authorship as different questions"] },
      { type: "ladder", heading: "An evidence ladder for public websites", intro: "The levels are ordered by how directly they describe the delivered surface. Even the strongest public evidence usually supports a narrow statement, not a complete origin story.", items: [
        { level: "Level 1", title: "Direct public markers", evidence: "Builder names in generated comments, asset paths, metadata or publicly delivered manifests.", interpretation: "Supports the observation that a tool left a public trace. It does not show how much of the product the tool created or who made the final decisions." },
        { level: "Level 2", title: "Implementation conventions", evidence: "Repeated class-token patterns, unusual inline-code volume, component structures or framework defaults across several pages.", interpretation: "Can strengthen a technical similarity assessment, but templates, libraries and copied components create the same traces." },
        { level: "Level 3", title: "Design pattern clusters", evidence: "The same card rhythm, gradient treatment, icon style, spacing errors and interaction gaps recurring across unrelated sections.", interpretation: "Suggests an under-edited system or common source. It remains weak evidence of a specific authoring method." },
        { level: "Level 4", title: "Content and product fit", evidence: "Generic promises, placeholder proof, inconsistent terminology or pages that do not answer the buyer’s obvious questions.", interpretation: "Useful evidence of insufficient product editing. It is not technical evidence of generated code." },
        { level: "Level 5", title: "Operational quality", evidence: "Broken states, missing metadata, weak headers, inaccessible controls or poor mobile behavior.", interpretation: "Shows launch-readiness work is needed. Human-built and AI-assisted sites can fail in exactly the same ways." }
      ] },
      { type: "matrix", heading: "Common signs and their false positives", intro: "Use the final column before drawing a conclusion. It turns a resemblance into a testable next step.", columns: ["Observation", "Possible vibe-coding explanation", "Plausible alternative", "Best next check"], rows: [
        ["Every section uses rounded cards", "A default component recipe was repeated", "A deliberate design system uses one container primitive", "Check whether hierarchy, spacing and behavior vary meaningfully with the content"],
        ["Copy sounds polished but vague", "Generated copy was accepted without product editing", "The team has not completed positioning work", "Ask whether a specific audience, mechanism and proof are named"],
        ["Class names resemble a popular UI stack", "Generated code selected that stack", "A human developer intentionally uses the same library", "Look for direct markers and consistent engineering conventions, not the library alone"],
        ["Desktop looks complete; mobile feels improvised", "The initial prompt focused on one viewport", "Normal delivery pressure cut responsive QA", "Test navigation, forms, overflow and reading order at several widths"],
        ["Security headers are incomplete", "The generated deployment omitted hardening", "Infrastructure was configured manually but incompletely", "Review the separate security baseline and the actual deployment configuration"]
      ] },
      { type: "steps", heading: "A ten-minute assessment you can repeat", intro: "Use the same sequence for every site. Consistency makes your notes more useful than a first impression.", items: [
        { title: "Define the claim", action: "Write the exact question you are trying to answer: visual similarity, public builder traces, launch quality or code authorship.", record: "One sentence that prevents the review from drifting into a broader accusation." },
        { title: "Walk the real journey", action: "Use the navigation, a form, one error path and a mobile viewport. Do not judge only the hero screenshot.", record: "Page URLs, viewport and the interaction states you observed." },
        { title: "Collect independent signals", action: "Record signals from at least three different domains such as design, content and delivered implementation.", record: "Direct observations, not labels such as ‘looks AI-made’." },
        { title: "Challenge each signal", action: "Name an ordinary template, library, deadline or design-system explanation that could produce the same result.", record: "The alternative explanation and the check that could distinguish it." },
        { title: "State a bounded conclusion", action: "Describe resemblance and review priorities. Avoid claims about hidden source code or authorship.", record: "A conclusion another reviewer could audit from the same public evidence." }
      ] },
      { type: "scenario", heading: "Worked example: a polished SaaS landing page", context: "A landing page has a gradient headline, three rounded feature cards, generic transformation copy and a familiar pricing table. Its forms work, mobile spacing is consistent and no direct builder marker is visible.", observations: [
        "The design motifs are common, but they are applied consistently.",
        "The content lacks product-specific proof, which is an actionable content weakness.",
        "No direct public marker identifies an authoring tool.",
        "The mobile and interaction quality argues against calling the page an unreviewed output."
      ], conclusion: "A responsible conclusion is: ‘The site uses several common contemporary landing-page patterns and would benefit from more product-specific content. The public surface does not establish how it was authored.’" },
      { type: "faq", heading: "Questions people ask after the first review", items: [
        { question: "What is the biggest giveaway of a vibe-coded website?", answer: "There is no universal giveaway. A direct public builder trace is narrower and stronger than a visual impression, while a cluster of unrelated weak signals is more useful than one fashionable design motif." },
        { question: "Can browser developer tools prove that a site was vibe coded?", answer: "They can expose delivered markers, libraries and implementation conventions. They cannot reconstruct private prompts, repository history, authorship or the share of generated code." },
        { question: "Does a high Vibe-Footprint mean the website is bad?", answer: "No. It means the measured public patterns show stronger similarity to the reference corpus. Concrete design, content, engineering and security findings must be reviewed separately." }
      ] }
    ],
    sources: [methodology, { label: "MDN: Inspecting the DOM", href: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools", note: "Background on what browser developer tools can inspect on the delivered page." }, w3cAccessibility],
    related: ["vibe-coded-vs-template-website", "can-you-detect-ai-generated-website-code", "vibe-coding-website-audit-framework"]
  },

  "vibe-coded-vs-template-website": {
    slug: "vibe-coded-vs-template-website",
    format: "comparison",
    formatLabel: "Side-by-side analysis",
    eyebrow: "Do not confuse the source",
    title: "Vibe-coded website vs template website: what can you actually tell?",
    metaTitle: "Vibe-Coded vs Template Website",
    description: "Compare vibe-coded and template-based websites across public signals, design consistency, technical traces and the limits of any outside assessment.",
    dek: "The two can look almost identical because both may begin with shared components and familiar defaults. The meaningful difference is often the editing process—and that process is mostly private.",
    scope: "This comparison describes patterns that can appear on the public surface. It is not a method for assigning authorship or choosing a ‘better’ development approach.",
    audience: "Buyers, agencies and teams comparing website production approaches",
    readingMinutes: 8,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "matrix", heading: "Where the two approaches overlap—and diverge", intro: "Public outputs overlap far more than most detector claims admit. Use the fourth column to turn the comparison into a useful review.", columns: ["Dimension", "Vibe-coded site may show", "Template site may show", "What matters to a user"], rows: [
        ["Starting point", "Generated component and layout suggestions", "Prebuilt theme, blocks and demo content", "Whether the final experience fits the real product"],
        ["Visual repetition", "Prompt-driven repetition across generated sections", "Theme-driven repetition across predefined modules", "Clear hierarchy and meaningful variation"],
        ["Technical traces", "Tool or stack conventions, sometimes direct markers", "Theme assets, vendor paths and framework conventions", "Performance, accessibility and maintainability"],
        ["Content", "Generated placeholders may survive editing", "Demo copy may survive customization", "Specific claims, proof and useful explanations"],
        ["Quality risk", "Fast iteration can skip edge cases", "Theme constraints can hide mismatched behavior", "Tested journeys and predictable recovery"],
        ["Authorship evidence", "Usually unavailable from the public page", "Usually unavailable from the public page", "A transparent production record if origin matters contractually"]
      ] },
      { type: "prose", eyebrow: "The important distinction", heading: "An output can be generic for different reasons", paragraphs: [
        "A template is intentionally reusable. Vibe coding can also converge on reusable patterns because models learn common solutions and developers often ask for familiar interfaces. Both routes can produce a strong site when someone edits the system around a real audience, content model and interaction need.",
        "The inverse is also true: a custom repository can still feel generic, and a purchased template can become highly distinctive. The public result tells you much more about the quality of the final decisions than about the private sequence used to create it."
      ] },
      { type: "scenario", heading: "Comparison case: two identical-looking pricing pages", context: "Site A was generated from a detailed prompt and then reviewed for two weeks. Site B uses a purchased template with custom typography but unchanged content structure.", observations: [
        "Site A may retain code-generation conventions while delivering stronger product-specific explanations.",
        "Site B may have no AI involvement while looking more interchangeable because the content model remains unchanged.",
        "A screenshot-based detector could easily rank the sites in the wrong order.",
        "A product review would focus on comprehension, proof, accessibility and conversion behavior instead."
      ], conclusion: "If procurement or disclosure requires origin evidence, ask for process documentation. If the decision is about website quality, test the delivered experience directly." },
      { type: "steps", heading: "Choose the right evaluation for the decision", intro: "Different questions require different evidence. Do not force one score to answer all of them.", items: [
        { title: "Buying a website", action: "Review maintainability, ownership, licenses, accessibility and acceptance criteria.", record: "Repository access, dependency inventory, design assets and signed delivery criteria." },
        { title: "Assessing originality", action: "Compare narrative, visual system and interactions with close competitors and common templates.", record: "Concrete similarities plus product-specific differences." },
        { title: "Evaluating security", action: "Use public header checks as a starting point, then test authentication, authorization and data handling.", record: "Findings tied to reproducible evidence and severity." },
        { title: "Establishing authorship", action: "Use contracts, repository history, design files and transparent team records.", record: "Provenance evidence—not a public visual guess." }
      ] },
      { type: "faq", heading: "Comparison questions", items: [
        { question: "Is a template website the same as a vibe-coded website?", answer: "No. They describe different production paths, although their public design and implementation patterns can overlap substantially." },
        { question: "Which approach is better for SEO?", answer: "Neither automatically wins. Search performance depends on helpful content, crawlability, technical quality, reputation and how well the page satisfies its audience—not the authoring label." }
      ] }
    ],
    sources: [methodology, { label: "Google: Creating helpful, reliable, people-first content", href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", note: "Explains why purpose, originality and usefulness matter more than the production method alone." }, { label: "Material Design foundations", href: "https://m3.material.io/foundations", note: "An example of widely shared design conventions that can create visual similarity without common authorship." }],
    related: ["how-to-tell-if-a-website-was-vibe-coded", "can-you-detect-ai-generated-website-code", "how-to-make-a-vibe-coded-website-look-less-generic"]
  },

  "vibe-coding-website-audit-framework": {
    slug: "vibe-coding-website-audit-framework",
    format: "audit",
    formatLabel: "90-minute audit framework",
    eyebrow: "From impression to evidence",
    title: "A practical audit framework for vibe-coded websites",
    metaTitle: "Vibe-Coding Website Audit Framework",
    description: "Run a structured 90-minute audit of a vibe-coded or AI-assisted website across product clarity, design, engineering, accessibility, security and launch readiness.",
    dek: "This framework is for improving a real product—not proving how it was built. It produces an evidence packet, clear owners and a short list of changes worth shipping.",
    scope: "The audit combines public review with explicit handoffs for repository and runtime checks. It does not turn Vibe-Footprint similarity into a quality or security grade.",
    audience: "Founders, product teams and agencies preparing an AI-assisted website for users",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "scorecard", heading: "Six lenses—kept deliberately separate", intro: "Score each lens only against its own evidence. Do not average the numbers: a strong visual system must not hide an authorization flaw, and a low Vibe-Footprint must not certify quality.", items: [
        { label: "Product clarity", question: "Can a new visitor identify the audience, job and next action?", strong: "Specific promise, mechanism and proof", weak: "Generic transformation language" },
        { label: "Design distinctiveness", question: "Does the system express product meaning beyond common defaults?", strong: "Intentional hierarchy and recognizable choices", weak: "Interchangeable sections and decoration" },
        { label: "Interaction quality", question: "Do critical, empty, loading and error states support recovery?", strong: "Predictable state and preserved work", weak: "Happy-path-only behavior" },
        { label: "Frontend engineering", question: "Is the delivered interface semantic, responsive and performant?", strong: "Resilient markup and measured delivery", weak: "Visual polish hiding fragile implementation" },
        { label: "Security", question: "Are public protections and private trust boundaries reviewed?", strong: "Layered controls with owners and tests", weak: "Header score treated as certification" },
        { label: "Launch readiness", question: "Can the team detect, communicate and reverse a bad release?", strong: "Monitoring, support and rollback", weak: "A successful build treated as launch proof" }
      ] },
      { type: "phases", heading: "The 90-minute working session", intro: "Time-box the review so it ends with decisions. Deep investigations become assigned follow-up work rather than swallowing the session.", phases: [
        { label: "0–10 min", title: "Frame the product", outcome: "Shared critical journey and risk boundary", actions: ["Name the target user and primary conversion", "Choose one desktop and one mobile journey", "List data, payment or account actions that raise the risk"] },
        { label: "10–30 min", title: "Review the public story", outcome: "Clarity and distinctiveness findings", actions: ["Read the page without internal context", "Compare claims with visible proof", "Mark repeated patterns that flatten hierarchy"] },
        { label: "30–55 min", title: "Exercise behavior", outcome: "Reproducible interaction findings", actions: ["Use keyboard and mobile navigation", "Trigger loading, validation and failure states", "Record data loss, dead ends and unclear recovery"] },
        { label: "55–75 min", title: "Inspect delivery", outcome: "Engineering and public-security evidence", actions: ["Inspect semantics, assets and response headers", "Record performance bottlenecks and third parties", "Separate public observations from repository checks"] },
        { label: "75–90 min", title: "Prioritize and assign", outcome: "Owned release plan", actions: ["Select no more than five immediate changes", "Assign owner, evidence and verification method", "Define what blocks launch and what can follow"] }
      ] },
      { type: "matrix", heading: "A severity model teams can use", intro: "Severity describes user or business impact, not how embarrassing a finding looks in a screenshot.", columns: ["Priority", "Definition", "Example", "Required response"], rows: [
        ["P0 — Stop", "Credible risk of serious harm, data exposure or irreversible loss", "Authorization bypass or exposed production secret", "Stop launch, contain, investigate and retest"],
        ["P1 — Fix before launch", "Critical journey is unsafe, inaccessible or unreliable", "Checkout loses state or login errors reveal accounts", "Assign an owner and block release until verified"],
        ["P2 — Schedule", "Meaningful friction or maintainability cost with a workaround", "Mobile navigation traps focus", "Plan into the next release with acceptance criteria"],
        ["P3 — Consider", "Polish or distinctiveness opportunity without material harm", "Decorative card repetition weakens hierarchy", "Change only when it supports the product system"]
      ] },
      { type: "scenario", heading: "What the audit packet should contain", context: "A useful audit can be handed to someone who did not attend the session and still be implemented safely.", observations: [
        "Canonical URL, viewport, timestamp and release identifier",
        "Observed behavior with a screenshot or response evidence",
        "Why the finding matters to a named user or trust boundary",
        "Priority, owner and the smallest coherent change",
        "A verification step that can fail as well as pass"
      ], conclusion: "If a finding cannot be reproduced or connected to an outcome, keep it as a hypothesis. Do not inflate the action list to make the audit appear more comprehensive." },
      { type: "faq", heading: "Audit questions", items: [
        { question: "Should every high Vibe-Footprint produce many findings?", answer: "No. Similarity drivers explain the score; findings require a defensible quality or security observation. A high score and a short issue list can both be correct." },
        { question: "How often should the audit run?", answer: "Run the focused public review before launch and after material changes. Deeper security, accessibility and application testing should follow the product’s risk and release process." }
      ] }
    ],
    sources: [methodology, owaspTesting, w3cAccessibility, webPerformance],
    related: ["how-to-tell-if-a-website-was-vibe-coded", "how-to-review-ai-generated-frontend-code", "how-to-make-a-vibe-coded-website-look-less-generic"]
  },

  "how-to-make-a-vibe-coded-website-look-less-generic": {
    slug: "how-to-make-a-vibe-coded-website-look-less-generic",
    format: "playbook",
    formatLabel: "Design transformation playbook",
    eyebrow: "Distinctiveness without novelty theatre",
    title: "How to make a vibe-coded website look less generic",
    metaTitle: "Make a Vibe-Coded Website Look Less Generic",
    description: "A practical design and content playbook for turning a generic AI-assisted landing page into a distinctive, credible product experience.",
    dek: "Do not start by swapping the gradient. Start with the product’s specific audience, mechanism and evidence—then let those facts change the page structure.",
    scope: "Distinctiveness should improve recognition and comprehension without sacrificing familiar interaction patterns, accessibility or performance.",
    audience: "Founders and designers refining an AI-assisted marketing website",
    readingMinutes: 10,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "prose", eyebrow: "Why generic happens", heading: "The page was composed before the product story was decided", paragraphs: [
        "Many generic websites are not suffering from the wrong color palette. They are suffering from a content model made of interchangeable labels: hero, three benefits, logo cloud, testimonials, pricing and FAQ. When the information has no product-specific shape, visual styling can only decorate the same skeleton.",
        "A stronger redesign begins by identifying what must be understood, believed and done. The page should then earn each section through that decision rather than through a standard landing-page checklist."
      ] },
      { type: "scorecard", heading: "A five-question originality check", intro: "Answer each question using the live page, not the team’s intention. Weak answers tell you where to edit first.", items: [
        { label: "Audience", question: "Could the headline describe a named competitor equally well?", strong: "The user and job are unmistakable", weak: "‘Build better, faster’ language" },
        { label: "Mechanism", question: "Can a visitor explain how the result is produced?", strong: "Concrete workflow or product artifact", weak: "Benefits without an operating explanation" },
        { label: "Proof", question: "Does each important claim have visible support?", strong: "Real examples, data or constraints", weak: "Untraceable superlatives and logo filler" },
        { label: "Hierarchy", question: "Does the layout change with the importance and kind of information?", strong: "Varied composition with a reason", weak: "Every idea forced into the same card" },
        { label: "Behavior", question: "Does an interaction express something specific about the product?", strong: "Useful preview, comparison or state", weak: "Animation used only as decoration" }
      ] },
      { type: "phases", heading: "Five moves that change the actual system", intro: "Complete them in order. Later visual decisions become easier once the page has product-specific material.", phases: [
        { label: "Move 01", title: "Rewrite the brief as evidence", outcome: "A page objective grounded in facts", actions: ["Name one audience and one urgent job", "List the objections that delay action", "Collect real screenshots, outputs, limits and proof"] },
        { label: "Move 02", title: "Build a content-shaped outline", outcome: "Sections that could not belong to any product", actions: ["Lead with the decision the visitor faces", "Show the mechanism before broad benefits", "Place proof beside the claim it supports"] },
        { label: "Move 03", title: "Reduce the component vocabulary", outcome: "A coherent system instead of many defaults", actions: ["Choose one container logic", "Keep two or three meaningful surface types", "Remove decorative variants without a role"] },
        { label: "Move 04", title: "Create one recognizable signature", outcome: "Memorability tied to product meaning", actions: ["Use a real artifact as the hero visual", "Develop typography around the content voice", "Design one interaction that demonstrates the product"] },
        { label: "Move 05", title: "Test recognition and comprehension", outcome: "Evidence that the redesign works", actions: ["Ask users what the product does after one minute", "Compare the page with close competitors", "Test mobile, keyboard and reduced-motion behavior"] }
      ] },
      { type: "matrix", heading: "Replace cosmetic edits with structural edits", intro: "The right column changes what a visitor understands. That is usually more valuable than making the same component look newer.", columns: ["Generic symptom", "Cosmetic edit", "Structural edit", "Success signal"], rows: [
        ["Vague hero", "New gradient and bolder type", "Name the user, job and mechanism; show a real output", "A new visitor explains the product accurately"],
        ["Too many cards", "Change corner radius", "Group information by decision and use cards only for comparable items", "Scanning order matches importance"],
        ["Empty social proof", "Animate logos", "Replace with sourced outcomes or a transparent early-stage proof strategy", "Claims are credible without decoration"],
        ["Generic feature grid", "Add icons", "Demonstrate one end-to-end workflow with states and constraints", "Visitors understand how value is created"],
        ["Stock CTA", "Use a brighter button", "Match the action to readiness: preview, test, compare or start", "The next step feels specific and low ambiguity"]
      ] },
      { type: "scenario", heading: "A before-and-after example", context: "Before: ‘Transform your workflow with intelligent automation’ above six identical feature cards and an abstract glowing orb.", observations: [
        "The claim identifies neither the user nor the workflow.",
        "The visual cannot prove or explain the mechanism.",
        "The six cards imply equal importance and create no narrative.",
        "A structural rewrite could lead with an actual before-and-after artifact, explain the three-step mechanism and place one sourced result beside it."
      ], conclusion: "The redesigned page may use fewer effects and fewer sections, yet feel more distinctive because its composition could only belong to that product." },
      { type: "faq", heading: "Design questions", items: [
        { question: "Should I remove all gradients, cards and rounded corners?", answer: "No. Remove or vary them when they flatten hierarchy or act as filler. Familiar components are valuable when their role is clear." },
        { question: "Will a redesign automatically lower the Vibe-Footprint?", answer: "Not necessarily. Optimize for a clearer, more distinctive product experience first. The score measures a bounded set of public similarities, not the complete quality of the design." }
      ] }
    ],
    sources: [{ label: "GOV.UK Design Principles", href: "https://www.gov.uk/guidance/government-design-principles", note: "A concise example of starting with user needs and designing with evidence." }, w3cAccessibility, { label: "Material Design foundations", href: "https://m3.material.io/foundations", note: "Useful for distinguishing a coherent shared system from accidental visual repetition." }],
    related: ["vibe-coded-vs-template-website", "vibe-coding-website-audit-framework", "how-to-tell-if-a-website-was-vibe-coded"]
  },

  "how-to-review-ai-generated-frontend-code": {
    slug: "how-to-review-ai-generated-frontend-code",
    format: "code-review",
    formatLabel: "Engineering review gates",
    eyebrow: "Review the behavior, not the confidence",
    title: "How to review AI-generated frontend code before production",
    metaTitle: "Review AI-Generated Frontend Code",
    description: "A production-focused review process for AI-generated frontend code covering behavior, security, accessibility, performance and maintainability.",
    dek: "Generated code should enter the same engineering system as any other change: a bounded diff, explicit acceptance criteria, adversarial tests and an owner who understands the result.",
    scope: "This workflow does not assume generated code is uniquely unsafe. It addresses the speed, volume and plausible-looking failure modes that can make review easier to skip.",
    audience: "Frontend developers, technical founders and reviewers shipping AI-assisted changes",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "prose", eyebrow: "Review principle", heading: "A clean render is not an acceptance test", paragraphs: [
        "Generated components often satisfy the visible happy path while leaving invalid data, loading races, keyboard behavior, permission boundaries and cleanup untested. The reviewer’s job is to recover the hidden contract: what inputs exist, what state may change and what must remain true when something fails.",
        "Keep the change small enough to understand. If a generated diff mixes a dependency migration, redesign, data-model change and new feature, split it before evaluating correctness."
      ] },
      { type: "gates", heading: "Five gates before the code can ship", intro: "A gate passes with evidence, not with ‘looks good’. A failure sends the change back with a specific acceptance condition.", gates: [
        { name: "Behavior", pass: "Critical journeys work for valid, empty, invalid, slow and failed responses.", fail: "State is lost, duplicate actions occur or errors strand the user.", evidence: "Focused tests plus a manual journey on production-like data." },
        { name: "Security and privacy", pass: "Trust decisions remain server-side; inputs, outputs, secrets and data exposure are bounded.", fail: "The client controls authorization, secrets enter the bundle or errors leak internals.", evidence: "Threat-focused review of every data and privilege boundary." },
        { name: "Accessibility", pass: "Native semantics, names, focus, keyboard behavior and status announcements match the interaction.", fail: "A custom visual control cannot be used or understood without a pointer.", evidence: "Keyboard review, accessibility tree inspection and targeted assistive-technology testing." },
        { name: "Performance", pass: "The change has a justified client boundary, bounded dependencies and measured loading impact.", fail: "Large libraries, effects or requests were added for convenience without user value.", evidence: "Bundle or network comparison and a repeatable page-performance check." },
        { name: "Maintainability", pass: "The code has one clear responsibility, stable types and a testable interface.", fail: "Duplicated logic, dead branches or a configurable super-component hide behavior.", evidence: "A reviewer can explain the data flow and change one case without rewriting unrelated paths." }
      ] },
      { type: "matrix", heading: "Plausible-looking frontend failures", intro: "These patterns often survive screenshot review because the failure appears only through timing, input or a different user capability.", columns: ["Pattern", "Why it looks acceptable", "Hidden failure", "Review move"], rows: [
        ["Effect copies props into state", "The first render is correct", "Updates drift or loop as dependencies change", "Remove derived state or document the synchronization contract"],
        ["Clickable div with handlers", "Mouse interaction works", "Keyboard, roles and focus behavior are missing", "Use the native control and test without a pointer"],
        ["Client-side role check", "Unauthorized UI stays hidden", "Direct requests can bypass the visual restriction", "Enforce the permission at the server boundary"],
        ["Broad catch with friendly message", "The UI never shows a stack trace", "Different failures become impossible to diagnose or recover", "Classify expected errors and preserve a request identifier"],
        ["New dependency for one helper", "The implementation is short", "Bundle, supply-chain and maintenance cost grows", "Compare with platform or existing project capabilities"]
      ] },
      { type: "steps", heading: "A review packet for every generated change", intro: "Ask the author—human or agent—to provide this context before the reviewer opens the diff.", items: [
        { title: "Intent", action: "State the user problem, non-goals and acceptance criteria.", record: "A short contract that the code can pass or fail." },
        { title: "Change map", action: "List affected routes, components, data boundaries and dependencies.", record: "A review path that prevents important files from hiding in volume." },
        { title: "Risk notes", action: "Name the most likely security, accessibility, performance and regression risks.", record: "At least one negative test for every material boundary." },
        { title: "Verification", action: "Run focused automation and manually exercise the critical journey.", record: "Commands, environment, screenshots or response evidence." },
        { title: "Ownership", action: "Identify who can explain, monitor and revert the change after release.", record: "An accountable maintainer and rollback condition." }
      ] },
      { type: "faq", heading: "Code-review questions", items: [
        { question: "Should AI-generated code receive a separate coding standard?", answer: "Usually no. Apply the project’s normal standards and add process controls for change size, provenance and verification where generation increases volume or uncertainty." },
        { question: "Can a scanner replace repository review?", answer: "No. A public scan sees delivered output. Authorization, secrets, data access, build configuration, tests and most maintainability concerns require repository or runtime access." }
      ] }
    ],
    sources: [owaspTesting, w3cAccessibility, webPerformance, { label: "React: You Might Not Need an Effect", href: "https://react.dev/learn/you-might-not-need-an-effect", note: "Primary React guidance for avoiding unnecessary synchronization and derived state." }],
    related: ["vibe-coding-website-audit-framework", "can-you-detect-ai-generated-website-code", "how-to-make-a-vibe-coded-website-look-less-generic"]
  },

  "can-you-detect-ai-generated-website-code": {
    slug: "can-you-detect-ai-generated-website-code",
    format: "evidence-brief",
    formatLabel: "Evidence and limits brief",
    eyebrow: "What a detector can honestly claim",
    title: "Can you detect AI-generated website code?",
    metaTitle: "Can You Detect AI-Generated Website Code?",
    description: "Understand what public website analysis can observe, what it may infer and why it cannot prove AI authorship or generated-code percentage.",
    dek: "Public analysis can identify delivered patterns and sometimes direct tool traces. It cannot observe private prompts, deleted markers, repository history or the human decisions between generation and deployment.",
    scope: "This evidence brief concerns public URL analysis. Repository forensics can provide additional provenance evidence, but even that must be interpreted within a documented development process.",
    audience: "Anyone evaluating claims made by AI website or code detectors",
    readingMinutes: 9,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "claims", heading: "Three categories of detector claims", intro: "The safest language changes with the evidence category. Most misleading reports turn an inference into an observation or an unknown into a percentage.", claims: [
        { status: "observable", claim: "The delivered page contains a named builder marker.", reason: "The marker exists in the public response and can be reproduced.", wording: "‘A public marker associated with X was observed at the time of the scan.’" },
        { status: "observable", claim: "The page uses recurring class, structure or design patterns.", reason: "Those patterns can be recorded from delivered HTML and assets.", wording: "‘The public surface contains these measured patterns.’" },
        { status: "inference", claim: "The pattern cluster resembles an AI-assisted reference corpus.", reason: "Similarity depends on the selected features, corpus and model boundary.", wording: "‘The observed surface shows stronger similarity to the reference corpus.’" },
        { status: "inference", claim: "A particular builder may have influenced part of the site.", reason: "A marker or convention can be inherited, copied, removed or introduced indirectly.", wording: "‘This trace is consistent with, but does not establish, use of the tool.’" },
        { status: "unknown", claim: "AI wrote 73% of the website.", reason: "A public response contains no denominator for private source creation or later human edits.", wording: "Do not present this as a measured fact." },
        { status: "unknown", claim: "The website owner personally used AI.", reason: "Authorship and workflow are private provenance questions.", wording: "Ask for repository and process evidence if the distinction is material." }
      ] },
      { type: "prose", eyebrow: "Why certainty breaks down", heading: "The public website is the end of a lossy pipeline", paragraphs: [
        "Between an initial prompt and the page you receive, code may be regenerated, refactored, bundled, minified, copied into another project or mixed with years of human work. Templates and design systems also create the same repeated patterns that detectors may associate with AI-assisted production.",
        "This is a classic correlation problem: a feature can be predictive inside one frozen dataset without being a unique cause in the open web. A model result therefore needs a defined corpus, holdout evaluation, uncertainty and a careful label."
      ], bullets: ["Absence of a marker is not evidence of absence", "Presence of a marker is not a generated-code percentage", "Visual similarity is not a defect count", "Security posture is independent from production method"] },
      { type: "matrix", heading: "Match the method to the claim", intro: "A public scan is useful when the decision fits its evidence boundary. Broader claims need broader access.", columns: ["Question", "Useful evidence", "What remains missing", "Responsible outcome"], rows: [
        ["Does the page resemble common vibe-coding patterns?", "Delivered HTML, assets and visual structure", "Private workflow and complete source", "A bounded similarity assessment"],
        ["Was a builder used somewhere?", "Direct marker plus repository or deployment history", "Who used it and how much it influenced", "A trace with provenance caveats"],
        ["Who authored the product?", "Contracts, commits, design history and team records", "Unrecorded collaboration and edits", "A provenance review, not a URL score"],
        ["Is the website safe?", "Headers, application tests, code review and threat model", "Unknown systems outside the assessment", "Scoped security findings with severity"],
        ["Is the website good?", "User research, accessibility, performance and product outcomes", "Context-specific goals and trade-offs", "A multi-dimensional quality review"]
      ] },
      { type: "scenario", heading: "Why a precise percentage can be less trustworthy", context: "A detector reports ‘87% AI-generated’ after fetching a minified production bundle. The report does not define whether the denominator is files, tokens, components, runtime bytes or model probability.", observations: [
        "The number cannot be independently interpreted without a measurement definition.",
        "Minification and bundling remove or transform much of the original source structure.",
        "Training-corpus similarity does not convert automatically into generated-code share.",
        "The precision of the number may create confidence that the method has not earned."
      ], conclusion: "Prefer a clearly named qualitative index, publish its boundary and show the observations that informed it. Precision in display is not the same as accuracy in meaning." },
      { type: "faq", heading: "Detector questions", items: [
        { question: "Are direct builder fingerprints useless?", answer: "No. They can support a narrow, reproducible observation. The mistake is expanding that observation into a complete claim about authorship or generated-code share." },
        { question: "Why does VibeFootprint still use a 0–100 number?", answer: "The number is an orientation index for similarity within a frozen method. The interface pairs it with evidence breadth, score drivers and explicit limitations so it is not presented as an AI percentage." },
        { question: "Could detection improve with repository access?", answer: "Repository history, source maps and process records can improve provenance analysis, but mixed authorship, copied code and rewritten history still require careful interpretation." }
      ] }
    ],
    sources: [methodology, { label: "NIST guidance on measurement uncertainty", href: "https://www.nist.gov/pml/nist-technical-note-1297", note: "Background on stating measurement results with an explicit uncertainty framework." }, { label: "Google guidance on generative AI content", href: "https://developers.google.com/search/docs/fundamentals/using-gen-ai-content", note: "An example of evaluating usefulness and policy compliance rather than assuming one production method determines quality." }],
    related: ["how-to-tell-if-a-website-was-vibe-coded", "vibe-coded-vs-template-website", "how-to-review-ai-generated-frontend-code"]
  },

  "are-vibe-coded-websites-secure": {
    slug: "are-vibe-coded-websites-secure",
    format: "threat-model",
    formatLabel: "Scenario-based threat model",
    eyebrow: "Security depends on controls, not origin",
    title: "Are vibe-coded websites secure? A practical threat model",
    metaTitle: "Are Vibe-Coded Websites Secure?",
    description: "Assess the security of a vibe-coded or AI-assisted website through concrete threat scenarios, trust boundaries and verification evidence instead of judging its production method.",
    dek: "A vibe-coded website can be secure, and a traditionally coded website can be dangerous. The useful question is whether the deployed system has identified its assets, trust boundaries, abuse paths and tested controls.",
    scope: "A public URL can reveal some headers, delivered scripts and exposed behavior. Authentication, authorization, secret handling, storage, internal APIs and deployment controls require repository, configuration or runtime access.",
    audience: "Founders and technical owners deciding how deeply an AI-assisted website needs to be security-tested",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "prose", eyebrow: "The direct answer", heading: "Vibe coding changes the review pressure, not the security laws", paragraphs: [
        "Fast generation can create more code than a small team can explain, and plausible happy paths can hide missing authorization, unsafe defaults or unbounded inputs. Those are process risks. They do not make every generated component vulnerable, nor do they disappear when a human types the same code manually.",
        "Begin with what the system protects: accounts, payments, private content, uploaded files, administrative actions and operational secrets. Then draw where data crosses from browser to server, from one user role to another and from your application to a third party. Threats become reviewable when tied to a boundary and an impact."
      ], bullets: ["Security headers are a baseline, not an application penetration test", "Client-side hiding is never authorization", "A working demo does not establish safe failure behavior", "Every external integration creates a separate trust decision"] },
      { type: "risks", heading: "Five scenarios that deserve explicit evidence", intro: "Read each row as a miniature threat model. If the scenario is impossible, record why. If it is possible, identify a control and a test before launch.", items: [
        { threat: "A user changes an object ID", trigger: "The browser sends a project, invoice or account identifier", impact: "Another customer’s data or action becomes accessible", control: "Authorize every object on the server against the authenticated principal", access: "API tests, authorization code and representative role accounts" },
        { threat: "Untrusted text reaches an executable context", trigger: "Rich text, search, URL parameters or generated HTML is rendered", impact: "Script execution, data theft or unwanted actions", control: "Context-aware output handling, safe rendering APIs and a restrictive CSP", access: "Rendering code, payload tests and deployed policy" },
        { threat: "A secret moves into the client bundle", trigger: "An SDK key or environment variable is used in client code", impact: "Unauthorized API use or access to privileged data", control: "Keep privileged credentials server-side and rotate exposed values", access: "Built assets, environment configuration and provider permissions" },
        { threat: "An automation repeats a sensitive action", trigger: "Retries, double clicks or replayed requests reach a payment or mutation endpoint", impact: "Duplicate charges, records or messages", control: "Idempotency, transaction boundaries and clear client state", access: "Endpoint behavior, persistence layer and failure tests" },
        { threat: "A third-party script becomes the weakest boundary", trigger: "Analytics, chat, widgets or tag managers execute on every page", impact: "Supply-chain exposure or unnecessary data collection", control: "Minimize vendors, constrain permissions and review data flows", access: "Delivered scripts, vendor settings, contracts and consent behavior" }
      ] },
      { type: "matrix", heading: "What different reviews can and cannot establish", intro: "Use more access only when the risk justifies it. A green public header check should never be presented as complete application security.", columns: ["Review layer", "Useful for", "Blind spot", "Evidence produced"], rows: [
        ["Public surface", "TLS, headers, exposed scripts and observable flows", "Private code, data access and secrets", "Timestamped observations and reproducible requests"],
        ["Repository review", "Authorization paths, validation, dependencies and configuration", "Production drift and live infrastructure", "Reviewed code paths, dependency record and findings"],
        ["Authenticated testing", "Role boundaries, business logic and account behavior", "Untested integrations and unseen roles", "Reproducible abuse cases with scoped impact"],
        ["Deployment review", "Secrets, permissions, logs, backups and isolation", "Unknown application behavior", "Configuration evidence and recovery tests"],
        ["Continuous monitoring", "Unexpected traffic, failures and regression signals", "Vulnerabilities that do not create a visible event", "Alerts, owners and response records"]
      ] },
      { type: "scenario", heading: "Worked threat model: a generated customer portal", context: "A portal uses a hosted authentication provider and a generated dashboard. A user can edit the account ID in a request; the API fetches the record by ID but does not also constrain it to the authenticated organization.", observations: [
        "The login flow is functioning and the visual UI hides other account IDs.",
        "The broken boundary exists in the server query, so a screenshot or header scan cannot see it.",
        "The root issue is missing object-level authorization, not the fact that a generator produced the dashboard.",
        "A negative API test using two organizations would expose the failure and remain valuable after the code is rewritten."
      ], conclusion: "Treat the portal as not ready until the server enforces organization ownership and the cross-account test passes. Record the control as a permanent acceptance condition." },
      { type: "faq", heading: "Security questions without false reassurance", items: [
        { question: "Does a high security-baseline score mean the website is secure?", answer: "No. It summarizes selected publicly visible header protections. Authorization, business logic, secrets, data handling and many runtime risks need deeper access and testing." },
        { question: "Should every small marketing site receive a penetration test?", answer: "Depth should follow the assets and attack surface. A static marketing site still needs safe deployment and dependencies, while accounts, payments, uploads or private data justify substantially deeper review." },
        { question: "Can I fix security by asking an AI coding tool to harden the app?", answer: "It may help implement controls, but the team must define the threat, verify the control independently and retain ownership of the result." }
      ] }
    ],
    sources: [owaspAsvs, owaspTesting, { label: "OWASP Top 10", href: "https://owasp.org/www-project-top-ten/", note: "A high-level awareness document for common web-application risk categories, not a substitute for a system-specific threat model." }],
    related: ["vibe-coding-website-audit-framework", "how-to-review-ai-generated-frontend-code", "is-vibe-coding-ready-for-production"]
  },

  "is-vibe-coding-ready-for-production": {
    slug: "is-vibe-coding-ready-for-production",
    format: "decision-guide",
    formatLabel: "Production decision guide",
    eyebrow: "A prototype is evidence, not a release",
    title: "Is vibe coding ready for production? A decision guide",
    metaTitle: "Is Vibe Coding Ready for Production?",
    description: "Decide whether a vibe-coded or AI-assisted web application is ready for production using explicit ownership, data, recovery, security and operability evidence.",
    dek: "Production readiness is not a property of the tool that created the first version. It is the point at which a team can explain the system, operate it under failure and accept responsibility for what users entrust to it.",
    scope: "This guide sets a decision process, not a universal release certificate. Regulated data, payments, healthcare, safety-critical use and complex permissions require domain-specific standards and independent review.",
    audience: "Founders and engineering leads moving an AI-assisted prototype toward real customers",
    readingMinutes: 11,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "decisions", heading: "The six-question production decision", intro: "Answer in order. A ‘no’ does not mean abandon the product; it identifies the next kind of work. Evidence should be inspectable by someone other than the original builder.", items: [
        { question: "Can a named owner explain the critical data flow?", yes: "Continue to failure behavior.", no: "Map inputs, storage, third parties and privilege boundaries before adding features.", evidence: "A current architecture note and owner for each critical path." },
        { question: "Do failures preserve user data and allow recovery?", yes: "Continue to security and privacy.", no: "Design timeouts, retries, idempotency, backups and user-visible recovery.", evidence: "Negative-path tests and a completed restore exercise." },
        { question: "Are trust decisions enforced outside the browser?", yes: "Continue to operational visibility.", no: "Move authorization and privileged actions to controlled server boundaries.", evidence: "Role tests and reviewed server-side enforcement." },
        { question: "Can the team detect a broken critical journey?", yes: "Continue to change safety.", no: "Add meaningful logs, health signals and owned alerts.", evidence: "A staged incident that produces the expected alert and diagnosis." },
        { question: "Can a change be reviewed, tested and rolled back?", yes: "Continue to legal and product obligations.", no: "Create release criteria, versioned changes and a rehearsed rollback path.", evidence: "A release record with test results and rollback condition." },
        { question: "Are user promises, consent and data obligations accurate?", yes: "A controlled production pilot may be justified.", no: "Resolve policy, retention, accessibility and contractual gaps first.", evidence: "Approved product copy, data map and acceptance criteria." }
      ] },
      { type: "prose", eyebrow: "Choose exposure deliberately", heading: "Production is a series of scopes, not one dramatic switch", paragraphs: [
        "A private prototype can tolerate manual recovery and limited observability because the team controls every user. A public pilot cannot. The responsible move is often to constrain users, data types, permissions and transaction value while the operating evidence grows.",
        "Avoid using ‘beta’ as a substitute for safeguards. A beta label can set expectations about polish, but it does not excuse losing customer data, exposing another account or making a claim the product cannot support."
      ], bullets: ["Define who may enter the pilot", "Exclude data the system is not ready to protect", "Publish the supported journeys and known limitations", "Name the condition that pauses or rolls back the release"] },
      { type: "phases", heading: "A safer path from demo to dependable service", intro: "Each stage changes exposure only after its own evidence exists. The dates may move; the gates should not disappear.", phases: [
        { label: "Stage 01", title: "Internal proof", outcome: "The team understands the system", actions: ["Map critical flows and dependencies", "Remove secrets and mock assumptions", "Create repeatable local and preview builds"] },
        { label: "Stage 02", title: "Controlled pilot", outcome: "Real use inside bounded risk", actions: ["Limit users, data and permissions", "Monitor every critical journey", "Provide a direct support and recovery path"] },
        { label: "Stage 03", title: "Public release", outcome: "Predictable service with accountable ownership", actions: ["Meet security, accessibility and legal criteria", "Operate alerts, backups and incident response", "Measure user outcomes and failure rates"] },
        { label: "Stage 04", title: "Scale", outcome: "Growth without silent fragility", actions: ["Load-test likely bottlenecks", "Review cost and vendor limits", "Assign long-term component and service owners"] }
      ] },
      { type: "scenario", heading: "Decision example: a feedback tool with real customers", context: "The app authenticates users, stores private customer feedback and sends email. The happy path works, but no restore has been attempted, delivery failures are not visible and only the creator understands the database schema.", observations: [
        "The feature set is complete enough for a demo but the operating contract is incomplete.",
        "Private customer content raises the consequence of accidental exposure or loss.",
        "A small invite-only pilot could become reasonable after access tests, backup restoration, delivery monitoring and shared documentation pass.",
        "Opening unrestricted signup now would expand risk faster than operational knowledge."
      ], conclusion: "The correct answer is not ‘vibe coding is production-ready’ or ‘never use it’. This particular service is not yet ready for an unrestricted public release, and its missing evidence defines the next sprint." },
      { type: "faq", heading: "Production-readiness questions", items: [
        { question: "How much human review is enough?", answer: "Enough that accountable owners can explain critical behavior, verify negative paths, operate failures and change the system safely. A fixed percentage of reviewed code does not establish that." },
        { question: "Can a low-risk landing page ship faster than an application?", answer: "Yes. Exposure should follow assets and consequences. A brochure site and a multi-tenant portal need very different evidence." },
        { question: "Does using a mature framework make the app production-ready?", answer: "It supplies useful primitives and guidance, but the application’s data flow, configuration, integrations and operations still determine readiness." }
      ] }
    ],
    sources: [nextProduction, owaspAsvs, { label: "Google SRE Workbook", href: "https://sre.google/workbook/table-of-contents/", note: "Primary operational guidance for reliability practices such as monitoring, incident response and managing risk." }],
    related: ["are-vibe-coded-websites-secure", "how-to-review-ai-generated-frontend-code", "how-to-test-a-vibe-coded-website"]
  },

  "vibe-coding-seo-mistakes": {
    slug: "vibe-coding-seo-mistakes",
    format: "seo-clinic",
    formatLabel: "Technical SEO clinic",
    eyebrow: "Diagnose the rendered result",
    title: "Vibe-coding SEO mistakes: a diagnosis and repair clinic",
    metaTitle: "Vibe-Coding SEO Mistakes and Fixes",
    description: "Diagnose common SEO failures in vibe-coded and AI-assisted websites, from empty rendered content and duplicate canonicals to thin pages and broken internal discovery.",
    dek: "Most SEO failures are not caused by AI itself. They happen when a convincing interface is shipped without checking what search engines can discover, render, consolidate and understand—and whether the page deserves to rank.",
    scope: "This clinic focuses on crawlable public pages and on-page signals. Rankings also depend on competition, reputation, links, user demand and search-engine systems that no page-level audit can control.",
    audience: "Founders and marketers troubleshooting why a polished AI-assisted website is not being discovered",
    readingMinutes: 13,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "seoClinic", heading: "Six symptoms, six different diagnoses", intro: "Do not prescribe more copy until the failure is named. Inspect the final URL and rendered HTML, then repair the narrowest cause and verify it independently.", items: [
        { symptom: "Google sees a nearly empty page", cause: "Critical content depends on client-side code, blocked resources or a failed fetch", repair: "Render indexable content in the initial or server-generated response and handle data failures visibly", verify: "Inspect the rendered HTML and URL Inspection result, not only the browser screenshot" },
        { symptom: "Several URLs compete for the same query", cause: "Generated routes differ only by wording, parameters or trailing variants", repair: "Keep one useful canonical page, redirect true duplicates and consolidate internal links", verify: "Check the declared and Google-selected canonical after recrawl" },
        { symptom: "Pages are discovered but rarely indexed", cause: "The content adds little beyond a repeated template or targets no distinct decision", repair: "Merge overlaps and add original examples, evidence or tools that justify a separate URL", verify: "Review each page beside its nearest sibling and explain the unique user outcome" },
        { symptom: "Important pages stay undiscovered", cause: "Navigation is visual but not built from crawlable links, or pages are isolated", repair: "Use real anchor links from hubs and related content with descriptive context", verify: "Crawl from the home page and confirm the route is reachable without a search box" },
        { symptom: "Search snippets are confusing", cause: "Titles and descriptions are duplicated, generic or disconnected from visible content", repair: "Write a unique promise that the page immediately fulfils and keep headings aligned", verify: "Compare metadata, H1, introduction and actual search intent side by side" },
        { symptom: "Traffic arrives but does not use the product", cause: "The article answers a keyword while hiding the next useful action", repair: "Connect the explanation to a relevant scan, checklist or adjacent decision without interrupting the answer", verify: "Track the path from landing page to meaningful product action, not just page views" }
      ] },
      { type: "prose", eyebrow: "Content quality is part of technical SEO", heading: "Indexable is not the same as worth indexing", paragraphs: [
        "A generator can produce dozens of grammatically clean pages from a spreadsheet. If they repeat the same framework and differ mainly by keywords, they create no new reason for a searcher—or a search engine—to prefer them. Technical correctness cannot manufacture information gain.",
        "Give every page a distinct decision, evidence set and working format. A comparison, threat model, clinic and test protocol should not share the same body with nouns swapped. Merge pages when the reader would take the same action after either one."
      ], bullets: ["One canonical page per primary decision", "Original examples over abstract volume", "Visible authorship and evidence boundaries", "Updates only when the material actually changes"] },
      { type: "matrix", heading: "A compact pre-indexing review", intro: "This is a release check for a page, not a promise of ranking. The final column gives the artifact a reviewer should be able to inspect.", columns: ["Layer", "Question", "Common failure", "Evidence"], rows: [
        ["Discovery", "Can a crawler reach the URL through a normal link?", "Orphan page or click handler without an anchor", "Crawl path and sitemap entry"],
        ["Rendering", "Is the main answer present and stable?", "Loading shell, blocked fetch or client-only failure", "Rendered HTML and failure state"],
        ["Consolidation", "Is one URL clearly canonical?", "Parameters and duplicate routes split signals", "Canonical, redirects and consistent links"],
        ["Intent", "Does the page solve a distinct task?", "Keyword variant of an existing article", "One-sentence user outcome and comparison"],
        ["Evidence", "Are factual claims supported and bounded?", "Confident synthesis without primary sources", "Source notes and visible limitations"],
        ["Experience", "Can mobile and assistive users consume it?", "Overflow, blocked zoom or poor semantics", "Responsive and accessibility review"]
      ] },
      { type: "scenario", heading: "Clinic case: 100 pages, almost no impressions", context: "A site publishes a page for every variation of ‘AI website checker’, ‘AI website detector’ and ‘vibe-code checker’. The introductions and cards are nearly identical, and all pages point to the same scanner.", observations: [
        "The routes are technically crawlable and included in the sitemap.",
        "The pages do not answer materially different decisions or contribute original evidence.",
        "Internal links distribute attention across competing URLs instead of establishing one strong canonical resource.",
        "Keeping one transactional checker and a smaller set of distinct editorial articles creates clearer intent coverage."
      ], conclusion: "The repair is consolidation, not another content wave: redirect duplicates, improve the strongest page and publish a new URL only when it delivers a genuinely different outcome." },
      { type: "faq", heading: "SEO clinic questions", items: [
        { question: "Do AI-written pages automatically rank worse?", answer: "Search systems evaluate usefulness and policy compliance, not a simple production label. Scaled low-value pages remain a risk whether written manually or generated." },
        { question: "Should every article be server-rendered?", answer: "Critical indexable content should be available reliably to crawlers. The right rendering method depends on the framework and content, but a loading shell that requires fragile client execution is avoidable risk." },
        { question: "Will submitting a sitemap index every page?", answer: "No. A sitemap helps discovery; it does not guarantee indexing or ranking. Page quality, canonicalization and crawl accessibility still matter." }
      ] }
    ],
    sources: [googleJavaScriptSeo, googleCanonical, { label: "Google Search: helpful, reliable content", href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", note: "Primary guidance for evaluating whether content is people-first, original and useful." }, { label: "Google Search spam policies", href: "https://developers.google.com/search/docs/essentials/spam-policies", note: "Defines scaled content abuse and other practices that can harm search visibility." }],
    related: ["how-to-tell-if-a-website-was-vibe-coded", "can-you-detect-ai-generated-website-code", "vibe-coding-website-audit-framework"]
  },

  "vibe-coding-technical-debt": {
    slug: "vibe-coding-technical-debt",
    format: "debt-ledger",
    formatLabel: "Technical-debt ledger",
    eyebrow: "Make maintenance cost visible",
    title: "Vibe-coding technical debt: how to find and reduce it",
    metaTitle: "Vibe-Coding Technical Debt Guide",
    description: "Create a practical technical-debt ledger for an AI-assisted web application, prioritize by recurring cost and reduce risk without pausing all product delivery.",
    dek: "The most expensive debt is rarely ugly code in isolation. It is uncertainty that charges interest every time the team changes, diagnoses or operates the product—and nobody can say which behavior is safe to preserve.",
    scope: "Technical debt is contextual. Duplication, dependencies or limited tests become debt when they impose recurring cost or unacceptable risk, not simply because they violate a preferred style.",
    audience: "Founders and engineering teams inheriting a fast-built web application",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "ledger", heading: "A ledger based on interest, not embarrassment", intro: "Record where the cost appears and what would reduce it. This turns ‘the codebase is messy’ into a portfolio of decisions that can compete fairly with feature work.", items: [
        { debt: "Unknown critical behavior", interest: "Every change requires rediscovery and broad manual checking", signal: "Only one person can explain payments, permissions or data mutation", action: "Document the flow and add characterization tests before refactoring" },
        { debt: "Duplicated business rules", interest: "Fixes land in one path while another silently diverges", signal: "The same validation or price logic appears in several components or routes", action: "Choose one owner and contract, then migrate callers incrementally" },
        { debt: "Oversized generated components", interest: "Unrelated UI, data and effects change together", signal: "Small features produce large diffs and surprising regressions", action: "Extract boundaries around behavior, not arbitrary line counts" },
        { debt: "Unowned dependency growth", interest: "Updates, bundle cost and supply-chain review compound", signal: "Multiple packages solve overlapping jobs or have no known reason", action: "Record purpose, owner and removal path; eliminate redundant packages" },
        { debt: "Missing negative-path evidence", interest: "Incidents reveal requirements for the first time", signal: "Only successful demos and snapshot tests exist", action: "Add tests for invalid input, latency, partial failure and denied access" },
        { debt: "Deployment knowledge outside the repository", interest: "Recovery depends on memory and manual dashboard state", signal: "Nobody can reproduce production or list required secrets", action: "Version the configuration contract and rehearse recovery" }
      ] },
      { type: "prose", eyebrow: "Do not start with a rewrite", heading: "First stabilize what users already depend on", paragraphs: [
        "A rewrite removes visible mess but also removes years of discovered edge cases. The safer first move is to observe current behavior, identify critical journeys and place tests around the parts you intend to change. Refactoring becomes valuable when it shortens a known feedback loop or removes a measured failure mode.",
        "AI-assisted cleanup can accelerate mechanical work, but large diffs recreate the review-volume problem that caused the debt. Keep migrations reversible, compare behavior and stop when the promised cost reduction does not appear."
      ], bullets: ["Tie every debt item to a recurring cost or material risk", "Name a smallest useful reduction", "Preserve behavior before improving structure", "Close ledger items only after verifying the expected benefit"] },
      { type: "matrix", heading: "Prioritize debt by product consequence", intro: "Style consistency matters, but it should not outrank a fragile permission boundary or unrecoverable data path.", columns: ["Debt class", "User consequence", "Business consequence", "First intervention"], rows: [
        ["Security boundary", "Exposure or unauthorized action", "Breach, loss of trust or regulatory impact", "Enforce and test the boundary now"],
        ["Data integrity", "Lost, duplicated or inconsistent records", "Support load and irreversible correction", "Add invariants, backups and recovery tests"],
        ["Operational opacity", "Longer outages and unclear errors", "Slow response and concentrated knowledge", "Instrument critical journeys and assign alerts"],
        ["Change friction", "Features and fixes arrive slowly", "Engineering time compounds", "Characterize behavior and isolate one seam"],
        ["Cosmetic inconsistency", "Uneven experience", "Brand and conversion cost", "Fold cleanup into related product work"]
      ] },
      { type: "phases", heading: "A four-week debt reduction rhythm", intro: "This is intentionally compatible with product work. Each week produces an operational asset, not only cleaner code.", phases: [
        { label: "Week 01", title: "Inventory", outcome: "A bounded ledger", actions: ["Map critical journeys and owners", "Record repeated delays and incidents", "Rank cost, consequence and confidence separately"] },
        { label: "Week 02", title: "Stabilize", outcome: "Behavior can be changed safely", actions: ["Add characterization and negative-path tests", "Document deployment and recovery", "Remove exposed secrets and urgent boundary failures"] },
        { label: "Week 03", title: "Create seams", outcome: "Critical changes become smaller", actions: ["Separate policy from presentation", "Consolidate one duplicated rule", "Reduce one oversized dependency or component"] },
        { label: "Week 04", title: "Measure", outcome: "Evidence of lower interest", actions: ["Compare change time and regression rate", "Verify build, bundle and incident signals", "Keep, revise or stop each intervention"] }
      ] },
      { type: "faq", heading: "Technical-debt questions", items: [
        { question: "Is all generated code technical debt?", answer: "No. Debt describes future cost and risk. Clear, tested and owned generated code may be easier to maintain than poorly understood hand-written code." },
        { question: "Should we measure debt by lines of code?", answer: "Line count can describe size but not interest. Track change time, regressions, incident recovery, duplicated decisions and ownership gaps instead." },
        { question: "When is a rewrite justified?", answer: "When the current architecture cannot meet essential requirements and an incremental path has been tested and found inadequate. The rewrite still needs migration, parity and rollback evidence." }
      ] }
    ],
    sources: [{ label: "Martin Fowler: Technical Debt", href: "https://martinfowler.com/bliki/TechnicalDebt.html", note: "The original debt metaphor framed as a trade-off whose interest becomes visible during future change." }, nextProduction, githubCodeOwners],
    related: ["how-to-review-ai-generated-frontend-code", "is-vibe-coding-ready-for-production", "how-to-test-a-vibe-coded-website"]
  },

  "vibe-coding-client-handoff-checklist": {
    slug: "vibe-coding-client-handoff-checklist",
    format: "handoff-kit",
    formatLabel: "Client handoff kit",
    eyebrow: "Transfer capability, not just files",
    title: "Vibe-coding client handoff checklist for agencies and freelancers",
    metaTitle: "Vibe-Coding Client Handoff Checklist",
    description: "Hand over an AI-assisted website with clear ownership, access, deployment, design, dependency and acceptance evidence so the client can operate it without the original builder.",
    dek: "A successful handoff leaves the client able to access, explain, change, deploy and recover the product. A repository link and a screen recording are useful artifacts, but they are not operational independence.",
    scope: "This checklist is a delivery framework, not legal advice. Contracts, intellectual-property terms, licenses, privacy duties and regulated work should be reviewed by qualified professionals in the relevant jurisdiction.",
    audience: "Agencies, freelancers and clients completing delivery of an AI-assisted website",
    readingMinutes: 10,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "handoff", heading: "The seven artifacts that make a handoff usable", intro: "Every artifact needs an owner and an acceptance check. A document that exists but cannot be used by the receiving team has not completed the transfer.", items: [
        { artifact: "Ownership and access register", owner: "Client account owner", acceptance: "The client controls source, hosting, domain, analytics and critical vendor accounts with recovery access", failure: "The builder remains the only administrator or uses a personal account" },
        { artifact: "System map", owner: "Technical maintainer", acceptance: "A new maintainer can trace requests, storage, integrations and trust boundaries", failure: "Architecture exists only in chat history or the creator’s memory" },
        { artifact: "Configuration contract", owner: "Deployment owner", acceptance: "Required variables, scopes and environment differences are documented without exposing secret values", failure: "Production relies on unnamed dashboard settings" },
        { artifact: "Release and rollback runbook", owner: "Release owner", acceptance: "The client can deploy a safe change and restore the last known version", failure: "Only automatic deployment is understood; rollback has never been tried" },
        { artifact: "Design and content source", owner: "Product or brand owner", acceptance: "Fonts, assets, licenses, tokens and editable source are available and linked to the implementation", failure: "The client receives compressed assets or unlicensed placeholders" },
        { artifact: "Quality evidence packet", owner: "Delivery lead", acceptance: "Acceptance journeys, accessibility, performance and security scope are recorded with known limitations", failure: "Approval depends on a visual demo of the happy path" },
        { artifact: "Support boundary", owner: "Commercial owner", acceptance: "Warranty, response path, maintenance scope and end date are explicit", failure: "Both parties assume the other will handle future incidents" }
      ] },
      { type: "prose", eyebrow: "AI-assisted delivery needs ordinary accountability", heading: "Do not hand the client a production mystery", paragraphs: [
        "Prompts can be useful context, but they do not replace requirements, design decisions or a current operating model. Generated explanations can also sound complete while describing code that no longer exists. The receiving team should verify every critical artifact against the actual repository and deployment.",
        "Record material third-party code, assets and licenses regardless of how they entered the project. If production origin matters contractually, define the required evidence before work starts; a public detector cannot reconstruct it at handoff."
      ], bullets: ["Transfer accounts before the final invoice milestone", "Use organization-owned identities and recovery methods", "Remove demo data and personal credentials", "Name known limitations in the acceptance record"] },
      { type: "steps", heading: "Run a 60-minute acceptance session", intro: "The client performs the work while the builder observes. This exposes missing capability more reliably than another presentation.", items: [
        { title: "Recover access", action: "The client signs in through its own identities and confirms account recovery for source, hosting and domain.", record: "Named account owners and recovery methods." },
        { title: "Trace one journey", action: "Follow a real user action through UI, API, storage and third parties.", record: "A corrected system map and unresolved questions." },
        { title: "Change and preview", action: "Make one harmless content or configuration change and inspect it outside production.", record: "The commands, approval path and preview URL." },
        { title: "Release and observe", action: "Deploy the approved change and locate logs or monitoring for the journey.", record: "Release identifier, success signal and responsible owner." },
        { title: "Recover", action: "Revert or roll back the exercise and verify expected behavior.", record: "Recovery time, gaps and final acceptance decision." }
      ] },
      { type: "scenario", heading: "Handoff failure: the site works until the domain expires", context: "A freelancer delivers a live site and repository. Six months later the domain renewal and transactional email provider are still attached to the freelancer’s personal accounts, and the client cannot recover them.", observations: [
        "The code delivery was complete but operational ownership was not.",
        "A repository cannot recover domain control or vendor billing access.",
        "An ownership register tested during acceptance would have exposed the dependency.",
        "The handoff should not be accepted until the client controls the accounts and recovery path."
      ], conclusion: "Define completion as independent operation, not a successful launch. Account transfer is a product requirement when the client is expected to own the service." },
      { type: "faq", heading: "Handoff questions", items: [
        { question: "Should clients receive the prompts?", answer: "Provide material working notes when they help maintain the product or when the contract requires them. Prompts do not replace source, decisions, licenses, tests or operational documentation." },
        { question: "Who should own the Vercel or hosting project?", answer: "The arrangement should match the contract, but a client purchasing an independently operated product usually needs organization-controlled ownership and recovery—not permanent dependence on a personal builder account." },
        { question: "Can a README be the complete handoff?", answer: "It can be the entry point. Acceptance still needs working access, deploy and rollback practice, system ownership and evidence that the instructions match reality." }
      ] }
    ],
    sources: [githubCodeOwners, nextProduction, { label: "GitHub: About README files", href: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes", note: "Primary guidance for repository-level orientation and documentation discoverability." }],
    related: ["is-vibe-coding-ready-for-production", "vibe-coding-technical-debt", "how-to-review-ai-generated-frontend-code"]
  },

  "how-to-test-a-vibe-coded-website": {
    slug: "how-to-test-a-vibe-coded-website",
    format: "test-lab",
    formatLabel: "Website testing lab",
    eyebrow: "Test the contract beyond the demo",
    title: "How to test a vibe-coded website before users do",
    metaTitle: "How to Test a Vibe-Coded Website",
    description: "Build a focused testing plan for a vibe-coded or AI-assisted website across critical journeys, failure states, accessibility, security boundaries and deployment recovery.",
    dek: "The fastest useful test plan does not try to cover every component. It identifies the few promises the product cannot break, then attacks their inputs, timing, permissions and recovery paths with repeatable evidence.",
    scope: "This lab provides a risk-based testing method. It does not prescribe one test runner or replace specialist accessibility, security, privacy, load or compliance assessment where those risks are material.",
    audience: "Builders and product owners preparing an AI-assisted website for external feedback or launch",
    readingMinutes: 13,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "testLab", heading: "Six experiments for the first test lab", intro: "Each experiment begins with a user promise and includes a negative case. Automate the stable assertions; keep exploratory review for behavior that still needs human judgment.", items: [
        { experiment: "Critical journey", setup: "Start from a clean account and complete the product’s primary job", assertions: "The intended outcome occurs once, persists and is visible after reload", negative: "Interrupt the flow, repeat the action and use stale state" },
        { experiment: "Input boundary", setup: "Use empty, long, malformed, duplicated and unexpected values", assertions: "Validation is specific, safe and consistent at the server boundary", negative: "Bypass the visible form and call the endpoint directly" },
        { experiment: "Permission boundary", setup: "Create at least two users or organizations with different roles", assertions: "Every read and mutation enforces the expected principal and scope", negative: "Swap identifiers, reuse links and call hidden actions" },
        { experiment: "Slow and failed dependency", setup: "Delay or fail data, email, payment or other external requests", assertions: "The interface preserves state, communicates status and supports safe retry", negative: "Return partial success, timeout after submission or send the same callback twice" },
        { experiment: "Alternative interaction", setup: "Complete the journey with keyboard, zoom and a narrow viewport", assertions: "Names, focus, reading order, status and layout remain usable", negative: "Open menus near edges, enlarge text and trigger validation without a pointer" },
        { experiment: "Release recovery", setup: "Deploy a known harmless change to a production-like environment", assertions: "Owners can observe the release, detect the success signal and restore the prior version", negative: "Assume the build succeeds while the critical API or environment variable is broken" }
      ] },
      { type: "prose", eyebrow: "A screenshot is one observation", heading: "Generated interfaces need state coverage more than visual applause", paragraphs: [
        "A polished default state can hide an empty list that collapses, a form that submits twice, a permission check that exists only in the client or a loading state that never recovers. Write down the states before choosing tools: initial, loading, empty, partial, success, invalid, denied, failed and recovered.",
        "Do not make every test end-to-end. Small tests are fast and precise for pure rules; integration tests verify important boundaries; browser journeys prove that the assembled product fulfills its promises. The useful portfolio follows risk rather than a fashionable pyramid drawn without context."
      ], bullets: ["Test behavior users depend on, not implementation details", "Include at least one negative assertion per material boundary", "Use production-like configuration without production secrets", "Store commands and evidence beside the change"] },
      { type: "gates", heading: "A release evidence packet", intro: "A test run becomes operational evidence when another person can reproduce it and knows which failure blocks the release.", gates: [
        { name: "Journey", pass: "Critical user outcomes work from a clean state and after recovery.", fail: "The demo requires hidden setup or manual database correction.", evidence: "Named journeys, environment and test results." },
        { name: "Boundary", pass: "Invalid input and unauthorized actions fail safely at controlled boundaries.", fail: "Only the interface prevents an action or errors expose internals.", evidence: "Negative requests and expected status or state." },
        { name: "Accessibility", pass: "Essential flows have usable semantics, keyboard behavior and status communication.", fail: "A user is blocked by custom controls, focus loss or layout overflow.", evidence: "Automated checks plus documented manual interaction." },
        { name: "Resilience", pass: "Retries, partial failures and timeouts preserve consistency.", fail: "Users create duplicate work or cannot tell whether an action succeeded.", evidence: "Fault simulation and recorded recovery behavior." },
        { name: "Release", pass: "The deployed version is observable and recoverable by a named owner.", fail: "Green CI is the only production signal and rollback is theoretical.", evidence: "Release identifier, monitoring link and rollback exercise." }
      ] },
      { type: "scenario", heading: "Testing example: the form that passes every happy-path test", context: "A contact form displays a success state in the browser immediately. The API then calls an email service, which times out. The user retries and creates three records while no email is sent.", observations: [
        "A visual test of the success screen passes even though the product promise fails.",
        "The client treats submission as complete before the authoritative result is known.",
        "Retry behavior is not idempotent and the partial failure is invisible to operators.",
        "A delayed-dependency experiment would expose all three gaps before launch."
      ], conclusion: "Define when the action is actually complete, make retries safe, communicate recoverable failure and alert on the missing downstream result. Then automate the scenario as a regression test." },
      { type: "faq", heading: "Testing questions", items: [
        { question: "How many tests does a small vibe-coded website need?", answer: "There is no meaningful universal count. Cover critical promises, high-consequence boundaries and previously observed failures; avoid inflating numbers with assertions that do not protect behavior." },
        { question: "Can an AI agent test the website it created?", answer: "It can generate and execute useful tests, but independent acceptance criteria and human review remain important because the same assumptions can shape both implementation and tests." },
        { question: "What should be tested manually?", answer: "Exploratory behavior, content comprehension, assistive-technology use, visual hierarchy and unexpected interactions benefit from human judgment, while stable rules and journeys should be automated where practical." }
      ] }
    ],
    sources: [webTesting, w3cAccessibility, owaspTesting, nextProduction],
    related: ["is-vibe-coding-ready-for-production", "how-to-review-ai-generated-frontend-code", "are-vibe-coded-websites-secure"]
  },

  "vibe-coding-for-non-technical-founders": {
    slug: "vibe-coding-for-non-technical-founders",
    format: "founder-brief",
    formatLabel: "Non-technical founder control brief",
    eyebrow: "Ownership without pretending to code",
    title: "Vibe coding for non-technical founders: stay in control",
    metaTitle: "Vibe Coding for Non-Technical Founders",
    description: "A practical operating guide for non-technical founders using vibe coding: retain account ownership, define acceptance evidence and know when specialist review is required.",
    dek: "You do not need to explain every line of code. You do need to know what the product promises, which systems hold customer trust, who can change them and how the business recovers when an assumption fails.",
    scope: "This brief helps founders govern product delivery. It does not turn a checklist into engineering, security, legal or accessibility expertise; high-consequence decisions still need qualified review.",
    audience: "Non-technical founders building or commissioning an AI-assisted web product",
    readingMinutes: 11,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "controls", heading: "Six controls a founder should be able to demonstrate", intro: "These are business-control questions, not coding trivia. Ask the person responsible to show the evidence in the actual accounts and product.", items: [
        { area: "Customer promise", founderQuestion: "Which three user outcomes must work every time?", risk: "The team optimizes screenshots and feature volume without a shared definition of done.", evidence: "Named journeys with success, failure and recovery criteria." },
        { area: "Account ownership", founderQuestion: "Which organization controls source, hosting, domain, email, data and billing?", risk: "A contractor departure or lost personal account can stop the business.", evidence: "Organization-owned administrators, recovery methods and a current access register." },
        { area: "Data responsibility", founderQuestion: "What customer data enters, where does it go and when is it removed?", risk: "The product collects information the team cannot locate, protect or delete.", evidence: "A plain-language data journey matched to real vendors and configuration." },
        { area: "Release safety", founderQuestion: "Who approves a release and how can the previous version be restored?", risk: "Every production change becomes an irreversible experiment on users.", evidence: "A preview, acceptance record, release owner and practiced rollback." },
        { area: "Failure ownership", founderQuestion: "How will we know the core journey is broken, and who responds?", risk: "Customers become the monitoring system and incidents wait for the original builder.", evidence: "Meaningful signal, alert owner, support path and recovery steps." },
        { area: "Specialist boundary", founderQuestion: "Which risks exceed the current team’s expertise?", risk: "Confidence from a working demo substitutes for security, legal or domain review.", evidence: "A written escalation rule for payments, sensitive data, complex permissions and regulated use." }
      ] },
      { type: "prose", eyebrow: "Manage claims, not code volume", heading: "Ask for proof in outcomes a business can understand", paragraphs: [
        "‘The AI says it is secure’ and ‘the build passed’ are not acceptance evidence. Ask to see two users blocked from one another’s data, a failed dependency recover safely, a keyboard-only journey complete and a backup restored. Concrete demonstrations let technical specialists challenge the right boundary later.",
        "Keep changes small enough that a person can review their purpose and consequence. Fast generation is useful when it shortens the route to evidence; it becomes dangerous when output volume makes ownership impossible."
      ], bullets: ["Put acceptance criteria before the implementation prompt", "Separate the Vibe-Footprint from security and product quality", "Require an owner for every critical vendor", "Budget for independent review before high-consequence exposure"] },
      { type: "decisions", heading: "When to stop building and bring in a specialist", intro: "A founder can make the escalation decision without solving the technical problem. A ‘yes’ means the consequence justifies deeper review.", items: [
        { question: "Can one customer action affect another customer’s data or money?", yes: "Request authorization and transaction-focused engineering review.", no: "Continue with ordinary journey testing.", evidence: "Role map, negative API tests and transaction behavior." },
        { question: "Does the product store sensitive, regulated or high-impact information?", yes: "Obtain relevant privacy, security and legal guidance before expanding use.", no: "Still minimize collection and document retention.", evidence: "Data categories, purposes, processors, locations and deletion path." },
        { question: "Would one hour of downtime materially harm customers?", yes: "Define reliability targets, monitoring, response and recovery ownership.", no: "Document the current support and recovery expectation.", evidence: "Critical signal, alert exercise and restore result." },
        { question: "Can nobody besides the builder explain a critical path?", yes: "Pause feature expansion and transfer knowledge through maps, tests and paired review.", no: "Keep ownership current as the product changes.", evidence: "A second person can diagnose and safely change the path." }
      ] },
      { type: "scenario", heading: "Founder case: the launch that depends on one freelancer", context: "The product has early customers, but the repository, domain and database live in the freelancer’s personal accounts. The founder sees a working URL and assumes ownership is complete.", observations: [
        "The business cannot independently recover access or authorize another maintainer.",
        "A technical export alone may not transfer vendor configuration, data or domain control.",
        "The founder can resolve the governance failure without reviewing source code.",
        "Account transfer, recovery verification and a client-operated release should become acceptance conditions."
      ], conclusion: "Pause further dependency on the setup until the company controls critical accounts and another person can operate the service. This is business continuity, not code style." },
      { type: "faq", heading: "Founder questions", items: [
        { question: "Do I need a technical co-founder before launching anything?", answer: "Not universally. Exposure should match team capability. A low-risk prototype can gather learning, while accounts, payments, sensitive data and complex permissions warrant experienced technical ownership sooner." },
        { question: "How can I judge a developer if I cannot review code?", answer: "Judge whether they make risks visible, produce reproducible evidence, transfer ownership, explain trade-offs and invite independent review of important boundaries." },
        { question: "Should I ask for a guarantee that the site is not vibe coded?", answer: "If production provenance matters, define contractual evidence. For quality and risk, evaluate the delivered product, operating controls and ownership directly." }
      ] }
    ],
    sources: [nistSsdf, owaspAsvs, githubCodeOwners],
    related: ["vibe-coding-client-handoff-checklist", "is-vibe-coding-ready-for-production", "how-to-choose-a-vibe-coding-platform"]
  },

  "how-much-does-a-vibe-coded-website-cost": {
    slug: "how-much-does-a-vibe-coded-website-cost",
    format: "cost-model",
    formatLabel: "Total-cost planning model",
    eyebrow: "The first build is only one line item",
    title: "How much does a vibe-coded website really cost?",
    metaTitle: "How Much Does a Vibe-Coded Website Cost?",
    description: "Estimate the real cost of a vibe-coded website across initial build, tools, infrastructure, review, maintenance, recovery and migration instead of comparing prompt prices alone.",
    dek: "Vibe coding can reduce the cost of reaching a useful first version. The total cost depends on what must be owned, verified and operated after that moment—and on how expensive uncertainty becomes when the product changes.",
    scope: "This page provides a planning model rather than market prices or a quote. Vendor pricing, taxes, labor rates and usage costs change by provider, region, contract and product behavior.",
    audience: "Founders and buyers budgeting an AI-assisted website or web application",
    readingMinutes: 10,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "costModel", heading: "The six cost centers in a realistic budget", intro: "Estimate a low, expected and high scenario for each center. Use product exposure and consequence—not excitement about the prototype—to choose the contingency.", items: [
        { center: "Discovery and content", initial: "User journey, page purpose, real content and acceptance criteria", recurring: "Research, copy updates and content governance", trigger: "Generic output creates rework or fails to answer customer objections", decision: "Fund specific inputs before paying for more generated pages" },
        { center: "Build and integration", initial: "Interface, data, authentication, vendors and deployment", recurring: "Feature changes, dependency updates and integration drift", trigger: "The prototype crosses into accounts, transactions or complex state", decision: "Separate a marketing-site estimate from an application estimate" },
        { center: "Quality and specialist review", initial: "Journey, accessibility, security, performance and privacy assessment", recurring: "Regression testing and review after material change", trigger: "Risk grows faster than the original builder’s expertise", decision: "Reserve review budget according to consequence and data sensitivity" },
        { center: "Infrastructure and vendors", initial: "Domains, environments, storage, monitoring and account setup", recurring: "Usage, seats, bandwidth, email, databases and observability", trigger: "Free allowances end or product behavior creates expensive requests", decision: "Model cost per active user and one high-usage scenario" },
        { center: "Operations and support", initial: "Runbooks, alerts, backups, recovery and support setup", recurring: "Incidents, customer support and routine maintenance", trigger: "Real users expect response and data durability", decision: "Assign ownership and response expectations before launch" },
        { center: "Change or exit", initial: "Portable data, source access, licenses and migration path", recurring: "Keeping exports, tests and documentation current", trigger: "Vendor limits, pricing or product needs change", decision: "Price the ability to leave before lock-in makes it urgent" }
      ] },
      { type: "prose", eyebrow: "A useful formula", heading: "Compare total ownership, not day-one invoices", paragraphs: [
        "A practical estimate is: creation plus verification plus twelve months of tools and operations plus an explicit change contingency. Add an exit allowance when the platform controls data, deployment or components that cannot be reproduced elsewhere.",
        "Do not assume a more expensive initial build is safer, or a cheap build is automatically wasteful. The economic advantage appears when the system remains understandable, changes stay small, failures are recoverable and the product reaches evidence of demand sooner."
      ], bullets: ["Estimate the same scope for every delivery option", "Separate fixed costs from usage-sensitive costs", "Name who absorbs defects and maintenance", "Write the assumptions beside the number"] },
      { type: "matrix", heading: "Budget differently by product exposure", intro: "The interface may look similar while the operating cost changes substantially. These are planning directions, not price bands.", columns: ["Product type", "Cost emphasis", "Commonly forgotten", "Budget signal"], rows: [
        ["Static campaign page", "Content, design, accessibility and analytics", "Domain ownership, forms and consent", "Short lifespan with a clear archive plan"],
        ["Company marketing site", "Content system, SEO, performance and maintenance", "Editing workflow and dependency updates", "Named owner after launch"],
        ["Authenticated SaaS pilot", "Data, authorization, monitoring and support", "Negative-path tests and recovery", "Controlled user and data scope"],
        ["Payments or marketplace", "Transactions, fraud, roles and reconciliation", "Idempotency and dispute operations", "Specialist review and incident capacity"],
        ["Sensitive-data product", "Privacy, security, retention and governance", "Processors, deletion and breach response", "Domain-qualified advice before exposure"]
      ] },
      { type: "scenario", heading: "Why the cheapest prototype can become the expensive option", context: "Two proposals deliver the same visible portal. One includes organization-owned accounts, tests, documentation and a client-operated handoff. The other includes only a live URL and promises fast future edits.", observations: [
        "The second proposal may have a lower initial invoice but leaves ownership and maintenance undefined.",
        "Future changes depend on one builder rediscovering undocumented behavior.",
        "Migration or incident recovery becomes an unpriced emergency rather than planned work.",
        "The correct comparison adds the missing verification, ownership and operating obligations to both scopes."
      ], conclusion: "Choose the option with the best cost-to-learning and ownership profile for the product’s real risk—not the lowest visible creation price." },
      { type: "faq", heading: "Cost questions", items: [
        { question: "Is vibe coding cheaper than hiring a developer?", answer: "It can reduce time for some discovery and implementation work. Total cost still depends on complexity, review, operations, ownership and the cost of errors; the categories are not interchangeable." },
        { question: "Can I stay on free plans indefinitely?", answer: "Do not build a budget around that assumption. Model the usage level that would indicate product success and review current vendor terms directly." },
        { question: "What is the most important contingency?", answer: "For a low-risk site it may be content and maintenance; for an application it is often data, security, recovery or migration. Tie contingency to consequence." }
      ] }
    ],
    sources: [twelveFactor, nextProduction, { label: "FinOps Framework", href: "https://www.finops.org/framework/", note: "A practitioner framework for creating visibility, accountability and business value around variable cloud cost." }],
    related: ["how-to-choose-a-vibe-coding-platform", "vibe-coding-technical-debt", "vibe-coding-client-handoff-checklist"]
  },

  "vibe-coding-accessibility-checklist": {
    slug: "vibe-coding-accessibility-checklist",
    format: "accessibility-lab",
    formatLabel: "Accessibility journey lab",
    eyebrow: "Test people doing real work",
    title: "A practical accessibility checklist for vibe-coded websites",
    metaTitle: "Vibe-Coding Accessibility Checklist",
    description: "Test a vibe-coded website through complete accessible journeys covering keyboard use, focus, forms, semantics, zoom, motion and status messages—not screenshots alone.",
    dek: "Generated markup can look correct while hiding broken names, focus order or state communication. Accessibility becomes actionable when you test a user journey, identify the barrier and preserve the repair as a repeatable acceptance condition.",
    scope: "This checklist supports product testing and does not certify WCAG conformance. Formal conformance claims require the applicable standard, scope, testing method and qualified human judgment.",
    audience: "Designers, builders and product owners testing an AI-assisted website",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "accessJourneys", heading: "Six journeys to test before release", intro: "Run these on the assembled page. Automated checks are useful for detectable violations; human interaction reveals whether the journey actually works.", items: [
        { journey: "Understand the page", barrier: "Heading structure, landmarks or link text do not communicate purpose", test: "Navigate headings and landmarks; read links out of surrounding context", repair: "Use native structure and descriptive text that matches the visible hierarchy" },
        { journey: "Navigate without a pointer", barrier: "Controls are unreachable, focus disappears or order conflicts with the layout", test: "Complete the primary task using keyboard input only", repair: "Use native interactive elements, logical order and visible focus" },
        { journey: "Complete and correct a form", barrier: "Labels, requirements and errors are visual but not programmatically associated", test: "Submit empty and invalid values, then locate and fix every error", repair: "Associate names, instructions and errors; preserve entered values and move focus intentionally" },
        { journey: "Use dynamic UI", barrier: "Dialogs, menus, tabs or updates lack correct focus and state behavior", test: "Open, operate and close each widget by keyboard; inspect its accessible name and state", repair: "Prefer native elements or follow the relevant WAI-ARIA interaction pattern completely" },
        { journey: "Read at different perception settings", barrier: "Zoom, text spacing, contrast or narrow layout hides content and controls", test: "Zoom and enlarge text; inspect reflow and essential contrast", repair: "Allow responsive reflow, sufficient contrast and flexible content sizing" },
        { journey: "Receive status and recover", barrier: "Loading, success and error changes are visible but never announced or remain ambiguous", test: "Trigger slow, successful and failed actions with assistive technology", repair: "Expose concise status, retain context and provide a clear recovery action" }
      ] },
      { type: "prose", eyebrow: "Why generated semantics need review", heading: "An ARIA attribute is not evidence that the interaction works", paragraphs: [
        "Generated components may add roles while omitting keyboard behavior, focus management or state updates. Incorrect ARIA can make a native interaction less understandable. Start with the semantic HTML element that already matches the behavior, and use a custom widget only when the product genuinely needs it.",
        "Accessibility also includes content and error recovery. A perfectly named button cannot rescue an unclear task, a destructive action without confirmation or a timeout that discards entered information."
      ], bullets: ["Test the critical journey, not isolated components only", "Include disabled, loading, empty, invalid and error states", "Keep automated findings separate from human-verified usability", "Retest after layout and interaction changes"] },
      { type: "matrix", heading: "Match tools to the question they can answer", intro: "No single tool establishes accessibility. Combine fast automation with browser inspection and representative human use.", columns: ["Method", "Good at", "Cannot establish alone", "Evidence"], rows: [
        ["Automated rules", "Missing names, invalid attributes and some contrast issues", "Comprehension, correct focus flow or complete conformance", "Repeatable violations tied to elements"],
        ["Keyboard review", "Reachability, order, focus and operability", "Screen-reader output or visual perception", "Recorded completion and blockers"],
        ["Accessibility tree", "Computed roles, names, states and relationships", "Whether the content makes sense", "Observed semantic contract"],
        ["Zoom and responsive review", "Reflow, clipping and enlarged-text behavior", "All visual needs or device combinations", "Viewport, settings and screenshots"],
        ["Assistive-technology testing", "Real announcements, navigation and recovery", "Every user’s experience", "Named environment, journey and outcome"]
      ] },
      { type: "scenario", heading: "Accessibility failure: a beautiful custom select", context: "A generated pricing form uses a styled div as a plan selector. It responds to clicks but is skipped by Tab, has no accessible name and does not expose the selected value.", observations: [
        "A screenshot and mouse-only demo show no failure.",
        "Keyboard and assistive-technology users cannot perceive or operate the choice.",
        "Adding only a role would still leave keyboard behavior and state management incomplete.",
        "A native select may satisfy the requirement with less code and a more reliable interaction contract."
      ], conclusion: "Replace the control with a native element unless the custom behavior is essential. Then test naming, keyboard operation, state and error recovery as one journey." },
      { type: "faq", heading: "Accessibility questions", items: [
        { question: "Can an automated score prove accessibility?", answer: "No. Automation catches a valuable subset of issues. Complete conformance and practical usability require scoped human evaluation." },
        { question: "Does semantic HTML matter if the page looks correct?", answer: "Yes. Semantics provide structure, names and behavior used by browsers and assistive technology, and often reduce the amount of custom code required." },
        { question: "Should accessibility wait until the design is finished?", answer: "No. Requirements such as focus order, error recovery and content structure affect component and journey design; late fixes are usually more expensive." }
      ] }
    ],
    sources: [wcag, ariaPractices, w3cAccessibility],
    related: ["how-to-test-a-vibe-coded-website", "vibe-coding-website-audit-framework", "how-to-make-a-vibe-coded-website-look-less-generic"]
  },

  "how-to-choose-a-vibe-coding-platform": {
    slug: "how-to-choose-a-vibe-coding-platform",
    format: "tool-selection",
    formatLabel: "Platform selection scorecard",
    eyebrow: "Choose for the next stage, not the first demo",
    title: "How to choose a vibe-coding platform without getting trapped",
    metaTitle: "How to Choose a Vibe-Coding Platform",
    description: "Compare vibe-coding platforms by ownership, export, data, deployment, security, review and operating fit instead of choosing from one generated demo.",
    dek: "The best tool is not the one that produces the most impressive first screen. It is the one whose constraints match your current stage while preserving enough ownership, evidence and exit capacity for the stage you expect next.",
    scope: "This vendor-neutral scorecard does not rank current products or promise that features and terms remain unchanged. Verify capabilities, prices, data terms and export behavior in the provider’s current documentation and contract.",
    audience: "Founders, agencies and product teams evaluating an AI website or application builder",
    readingMinutes: 12,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "toolScore", heading: "Seven dimensions to test with your own project", intro: "Do not accept a feature-list answer. Ask for a demonstration using the same authentication, data, deployment and ownership constraints your product will face.", items: [
        { dimension: "Source ownership", ask: "Can we obtain the current source and history in an organization-owned repository?", strong: "Documented export with understandable files, dependencies and licenses", weak: "Copy individual snippets or rely on a private generated workspace", exit: "Export, build and make one change outside the platform" },
        { dimension: "Data portability", ask: "Can we export customer data and configuration in documented formats?", strong: "Complete, repeatable export with identifiers and relationships", weak: "Manual download without guarantees or critical provider-only state", exit: "Restore a representative export into a clean environment" },
        { dimension: "Deployment control", ask: "Who controls domains, environments, secrets and rollback?", strong: "Organization-owned deployment with preview and recovery paths", weak: "One opaque production button and no reproducible environment contract", exit: "Deploy the same commit through an independent documented path" },
        { dimension: "Security boundary", ask: "Where are authentication, authorization, secrets and server actions enforced?", strong: "Explicit server boundaries with logs and testable policies", weak: "Security described mainly through hidden UI or broad marketing claims", exit: "Run a negative role test and inspect the authoritative enforcement" },
        { dimension: "Reviewability", ask: "Can our team inspect changes and constrain generated diffs?", strong: "Versioned, scoped changes with tests and approval", weak: "Large rewrites with no stable comparison or rollback", exit: "Review one generated feature as an ordinary pull request" },
        { dimension: "Operating fit", ask: "How do we observe failures, usage limits and vendor incidents?", strong: "Logs, alerts, status, quotas and clear owners", weak: "Only the visual builder indicates whether production works", exit: "Simulate one failed dependency and find the diagnosis" },
        { dimension: "Commercial exit", ask: "What changes when usage, team size or contract needs grow?", strong: "Current terms, predictable cost drivers and a documented termination path", weak: "Essential ownership or export depends on an undefined future plan", exit: "Write the migration steps and price them before committing" }
      ] },
      { type: "prose", eyebrow: "Score against a product stage", heading: "A prototype tool and an operating platform solve different jobs", paragraphs: [
        "For a disposable concept, speed and low setup cost may outweigh deep export and operational controls. The decision changes when the product holds private data, accepts money, has several maintainers or must satisfy a client’s ownership requirements.",
        "Choose a review date and an exit trigger before the tool becomes invisible infrastructure. Triggers might include the first external customer, the first sensitive dataset, a recurring cost threshold or a feature the platform cannot support safely."
      ], bullets: ["Test with a realistic thin slice, not the vendor tutorial", "Use must-have gates before weighted preferences", "Record assumptions and unknowns beside the score", "Repeat the exit test after major platform changes"] },
      { type: "matrix", heading: "Different stages justify different priorities", intro: "This prevents one universal score from rewarding capabilities your project does not need while hiding a future blocker.", columns: ["Stage", "Prioritize", "Accept temporarily", "Do not accept"], rows: [
        ["Concept", "Iteration, previews and disposable experiments", "Manual operation and limited scale", "Loss of important source or confidential data"],
        ["Customer pilot", "Ownership, access controls, logs and recovery", "Bounded users and explicit limitations", "Unverified cross-account behavior"],
        ["Production service", "Reliability, security, portability and maintainability", "Known trade-offs with accountable owners", "Unknown data location or unrehearsed recovery"],
        ["Client delivery", "Transfer, licenses, documentation and acceptance", "Contracted managed service with clear terms", "Permanent dependence not disclosed in the scope"]
      ] },
      { type: "scenario", heading: "Selection example: the fastest tool fails the exit test", context: "Two tools can build the required dashboard. Tool A is faster but exports static screens without the data model. Tool B takes longer and provides a repository, data export and independent deployment path.", observations: [
        "For a disposable internal demonstration, Tool A may be the rational choice.",
        "For a customer portal, the missing data and deployment portability create a material ownership risk.",
        "The decision should be tied to the product stage rather than a blanket tool ranking.",
        "Running the exit test before adding customers turns lock-in from a surprise into a priced trade-off."
      ], conclusion: "Choose the smallest platform commitment that meets today’s non-negotiable controls and preserves a credible route to the next stage." },
      { type: "faq", heading: "Platform-selection questions", items: [
        { question: "Should I always choose the platform with full code export?", answer: "Not for every disposable experiment, but lack of export becomes important when continuity, client ownership or independent maintenance matters. Make the trade-off explicit." },
        { question: "Can I rely on a provider’s security statement?", answer: "Provider controls are one layer. Your application logic, configuration, data use and integrations still require their own evidence and shared-responsibility understanding." },
        { question: "How many platforms should I trial?", answer: "Trial only credible candidates against one representative thin slice. A deeper exit and failure test is more informative than many superficial demos." }
      ] }
    ],
    sources: [twelveFactor, nistSsdf, githubCodeOwners],
    related: ["how-much-does-a-vibe-coded-website-cost", "how-to-migrate-a-vibe-coded-website", "vibe-coding-for-non-technical-founders"]
  },

  "vibe-coding-privacy-risks": {
    slug: "vibe-coding-privacy-risks",
    format: "privacy-map",
    formatLabel: "Privacy data-journey map",
    eyebrow: "Follow the data, not the privacy-page template",
    title: "Vibe-coding privacy risks: map data before launch",
    metaTitle: "Vibe-Coding Privacy Risks",
    description: "Map privacy risks in a vibe-coded website across collection, transmission, storage, use, sharing and deletion, with practical controls and explicit legal boundaries.",
    dek: "A polished privacy notice cannot compensate for data flows the team does not understand. Start with one real user journey and follow each piece of information through the application, vendors, logs, backups and deletion path.",
    scope: "This operational framework is not legal advice and does not establish compliance with any law. Applicable duties depend on jurisdiction, role, data, purpose and contract; obtain qualified advice for your situation.",
    audience: "Founders and product teams adding forms, accounts, analytics or AI services to a website",
    readingMinutes: 13,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "dataFlow", heading: "Trace one field through six stages", intro: "Use actual configuration and provider accounts. If a stage is unknown, record it as an unresolved risk rather than filling the map with an assumption.", items: [
        { stage: "Collection", data: "Fields, files, identifiers and automatically observed device or usage data", purpose: "The exact user or operational need served", risk: "Collecting more than the product needs or surprising the user", control: "Minimize fields, separate required from optional and explain the purpose at the relevant moment" },
        { stage: "Transmission", data: "Request bodies, query strings, headers and third-party SDK events", purpose: "Delivery to the application or a named service", risk: "Sensitive values leak through URLs, analytics, referrers or insecure transport", control: "Keep sensitive values out of URLs, constrain destinations and protect transport" },
        { stage: "Storage", data: "Database records, files, browser storage, logs, caches and backups", purpose: "Current product and recovery requirements", risk: "Unknown copies, excessive access or indefinite retention", control: "Inventory stores, restrict access, set retention and include backups in the policy" },
        { stage: "Use", data: "Profiles, content, behavioral events or derived attributes", purpose: "A specific feature, support task or analysis", risk: "Data is repurposed beyond the context in which it was provided", control: "Limit use to documented purposes and review material changes before activation" },
        { stage: "Sharing", data: "Information sent to infrastructure, analytics, communication or AI providers", purpose: "A named processor function", risk: "Unreviewed sub-processors, regions, training use or broad vendor permissions", control: "Review current terms, configuration, access and necessity before sending data" },
        { stage: "Deletion and recovery", data: "Primary records plus replicas, exports, queues and backups", purpose: "User request, retention limit or account closure", risk: "The UI says deleted while operational copies remain usable indefinitely", control: "Define effective deletion, exceptions, backup aging and a verified end-to-end procedure" }
      ] },
      { type: "prose", eyebrow: "The prompt can also be a data transfer", heading: "Do not paste production information into a tool by default", paragraphs: [
        "Debugging prompts, screenshots and copied logs can contain customer content, tokens, email addresses or internal URLs. The fact that a tool is used for development does not make every production datum necessary for that purpose.",
        "Use synthetic or minimized examples whenever possible. Define which tools are approved for which data, remove secrets before sharing and ensure the team understands current provider settings and contractual terms."
      ], bullets: ["Treat prompts, logs and screenshots as potential data flows", "Use least privilege for builders and integrations", "Keep consent, preference and deletion behavior testable", "Review vendors again when the product purpose changes"] },
      { type: "risks", heading: "Four privacy scenarios hidden by a working interface", intro: "These scenarios are not legal conclusions. They identify operational facts that a privacy or legal review needs.", items: [
        { threat: "Analytics receives form values", trigger: "Automatic event capture observes input or URL state", impact: "Personal or sensitive information reaches an unintended provider", control: "Disable broad capture, allowlist low-risk events and test actual network payloads", access: "Browser network traffic and analytics configuration" },
        { threat: "Deleted accounts persist in backups and vendors", trigger: "The primary record is removed without an end-to-end workflow", impact: "The organization cannot describe or execute effective deletion", control: "Map replicas, define backup aging and verify vendor deletion behavior", access: "Storage, backup, queue and processor procedures" },
        { threat: "Support logs expose secrets or customer content", trigger: "Raw requests and errors are recorded for debugging", impact: "More staff and tools can access data than the product requires", control: "Minimize and redact logs, bound retention and restrict access", access: "Logging code, sample production records and permissions" },
        { threat: "A new AI feature changes data purpose", trigger: "Existing customer content is sent to a model or used for a new analysis", impact: "User expectations, provider terms and risk profile no longer match the original flow", control: "Review necessity, disclosure, configuration and alternatives before launch", access: "Feature specification, provider terms and actual payloads" }
      ] },
      { type: "scenario", heading: "Privacy map example: a newsletter form with hidden reach", context: "The visible form asks only for an email address. The page also sends the URL, referrer, device identifiers and full form interaction to two analytics services, while server logs retain the request indefinitely.", observations: [
        "The visible field list describes only part of the data journey.",
        "Automatic collection expands the number of recipients and retention systems.",
        "A generic privacy notice cannot determine whether each flow is necessary or correctly configured.",
        "Network inspection, log review and vendor configuration are needed before the map is complete."
      ], conclusion: "Minimize the flow to what the newsletter and justified measurement actually need, set retention and permissions, then align the visible explanation with the verified system." },
      { type: "faq", heading: "Privacy questions", items: [
        { question: "Does using an AI builder automatically violate privacy law?", answer: "No. The relevant facts include which data is processed, why, by whom, where, under which terms and controls. Obtain legal advice for applicable obligations." },
        { question: "Is a privacy policy enough for a small website?", answer: "A notice describes practices; it does not create data minimization, access control, retention or deletion. The implementation must match the statement." },
        { question: "Can a public scanner verify privacy compliance?", answer: "No. It may observe some delivered scripts and requests, but purposes, contracts, internal access, storage and deletion require broader evidence." }
      ] }
    ],
    sources: [nistPrivacy, { label: "European Commission: data protection principles", href: "https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr_en", note: "Official high-level explanation of GDPR processing principles; applicability and implementation require case-specific legal analysis." }, owaspAsvs],
    related: ["are-vibe-coded-websites-secure", "vibe-coding-for-non-technical-founders", "how-to-choose-a-vibe-coding-platform"]
  },

  "how-to-migrate-a-vibe-coded-website": {
    slug: "how-to-migrate-a-vibe-coded-website",
    format: "migration-runbook",
    formatLabel: "Incremental migration runbook",
    eyebrow: "Exit without rewriting everything at once",
    title: "How to migrate a vibe-coded website without losing control",
    metaTitle: "How to Migrate a Vibe-Coded Website",
    description: "Plan an incremental migration from a vibe-coding platform or fragile prototype while preserving URLs, data, behavior, ownership and a tested rollback path.",
    dek: "Migration is safest when you first recover the current contract, then replace one boundary at a time. Rewriting the visible interface while ignoring data, identity, domains and operations creates a new product with old users attached.",
    scope: "This runbook is provider-neutral. Actual export capability, licenses, contracts, DNS behavior and data obligations depend on the current and target systems and must be verified before migration.",
    audience: "Teams outgrowing a builder, transferring ownership or reducing platform dependence",
    readingMinutes: 13,
    publishedAt: "2026-08-23",
    updatedAt: "2026-08-23",
    blocks: [
      { type: "migration", heading: "Six phases with a rollback at every boundary", intro: "Keep the current system serving users until the replacement proves the same essential contract. Freeze only what is necessary and record every irreversible step.", items: [
        { phase: "Inventory the live contract", keep: "Current production behavior, URLs and accounts", replace: "Assumptions with an evidence-based system and ownership map", proof: "Critical journeys, dependencies, data stores, vendors, domains and owners are recorded", rollback: "No production change yet; correct the inventory against the live system" },
        { phase: "Secure ownership and exports", keep: "User access and service continuity", replace: "Personal accounts and undocumented provider-only state", proof: "Organization controls source, domain, data exports, billing and recovery", rollback: "Retain current provider access until exported assets are verified" },
        { phase: "Create the target foundation", keep: "Public URLs, content model and essential product rules", replace: "Non-portable build, configuration and deployment assumptions", proof: "A clean environment builds, deploys and observes a representative thin slice", rollback: "Discard the target environment without affecting production" },
        { phase: "Move data and identity", keep: "Stable identifiers, permissions and user expectations", replace: "Provider-specific storage or authentication only after parity tests", proof: "Counts, relationships, role boundaries and recovery flows reconcile", rollback: "Rehearse reverse or repeatable migration before the final cutover" },
        { phase: "Run parallel acceptance", keep: "Current system as the authoritative fallback", replace: "Journeys incrementally behind controlled routing or release scope", proof: "Critical outcomes, accessibility, performance and failure behavior meet acceptance criteria", rollback: "Route users back and preserve writes according to the planned data strategy" },
        { phase: "Cut over and retire", keep: "Monitoring, support, redirects and recoverable archives", replace: "Traffic, integrations and operational ownership", proof: "DNS, redirects, events, email, jobs and alerts work under real traffic", rollback: "Use the time-bounded cutback procedure before old systems are removed" }
      ] },
      { type: "prose", eyebrow: "Preserve the interfaces users depend on", heading: "The migration unit is a contract, not a file", paragraphs: [
        "Exported components can be useful, but users depend on URLs, identities, data relationships, messages, permissions and recovery behavior. Search engines depend on stable canonical URLs and redirects. Operations depend on secrets, schedules, webhooks and alerts that may never appear in the source export.",
        "Write characterization tests around critical behavior before changing architecture. If the existing behavior is wrong, document the intended correction separately so migration parity does not silently become product redesign."
      ], bullets: ["Separate migration, redesign and feature work", "Verify exports before announcing a cutover", "Lower DNS TTL only as part of a documented plan", "Do not delete the old system until recovery and retention duties are resolved"] },
      { type: "matrix", heading: "What commonly gets lost in a code-only migration", intro: "Use this as a discovery list, then remove items that demonstrably do not apply to the product.", columns: ["Surface", "Often missed", "Failure after cutover", "Verification"], rows: [
        ["URLs and SEO", "Canonicals, redirects, metadata and sitemap behavior", "Traffic lands on errors or duplicate pages", "Crawl old and new URL sets and test redirect targets"],
        ["Identity", "Password reset, sessions, roles and external login settings", "Users lose access or gain incorrect permissions", "Role matrix and account recovery rehearsal"],
        ["Data", "Relationships, files, queues, timestamps and deleted states", "Records are incomplete or inconsistent", "Reconciliation queries and sampled journey checks"],
        ["Integrations", "Webhooks, allowlists, schedules and signing secrets", "Payments, email or background work silently stop", "Provider-by-provider event test"],
        ["Operations", "Logs, alerts, backups, support and billing ownership", "The new system fails without diagnosis or recovery", "Incident and restore exercise"],
        ["Licenses", "Fonts, images, packages and builder-specific components", "Use is restricted or assets disappear", "Asset and dependency inventory with terms"]
      ] },
      { type: "scenario", heading: "Migration failure: the homepage moved, the product did not", context: "A team exports the generated frontend and deploys it independently. The old platform still owns authentication, scheduled jobs, file storage and webhook secrets, but the cutover plan treats the repository as complete.", observations: [
        "The visible pages load, creating false confidence.",
        "Account recovery and background workflows fail only after users act.",
        "The team cannot retire the old subscription because critical state remains there.",
        "A system inventory and thin-slice deployment would have exposed the incomplete boundary."
      ], conclusion: "Return to a parallel phase, map the remaining services and migrate one complete journey—including operations—before switching more traffic." },
      { type: "faq", heading: "Migration questions", items: [
        { question: "Should we rewrite the website during migration?", answer: "Avoid combining the projects unless a requirement makes it necessary. Parity, redesign and new features create different failure modes and are easier to verify separately." },
        { question: "Can we migrate if the platform has no source export?", answer: "Possibly, but treat it as rebuilding behavior and migrating data rather than moving code. Verify contractual rights and prioritize portable content, data, domains and user journeys." },
        { question: "When can the old system be deleted?", answer: "After cutover stability, rollback expiry, data reconciliation, retention obligations, billing and recovery evidence are explicitly resolved—not immediately after the new homepage loads." }
      ] }
    ],
    sources: [twelveFactor, googleCanonical, nextProduction],
    related: ["how-to-choose-a-vibe-coding-platform", "vibe-coding-client-handoff-checklist", "vibe-coding-technical-debt"]
  }
};

export const allEditorialPages = Object.values(editorialPages);

export function getEditorialPage(slug: string) {
  return editorialPages[slug];
}
