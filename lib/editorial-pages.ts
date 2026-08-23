export type EditorialFormat = "field-guide" | "comparison" | "audit" | "playbook" | "code-review" | "evidence-brief";

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
  }
};

export const allEditorialPages = Object.values(editorialPages);

export function getEditorialPage(slug: string) {
  return editorialPages[slug];
}
