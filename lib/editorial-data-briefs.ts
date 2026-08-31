import type { EditorialPage, EditorialSource } from "./editorial-pages";

const methodology: EditorialSource = {
  label: "VibeFootprint methodology",
  href: "/methodology",
  note: "Defines the public-surface evidence boundary and the responsible interpretation of a Vibe-Footprint."
};

const technicalYieldArtifact: EditorialSource = {
  label: "Public technical-yield aggregate (JSON)",
  href: "/data/insights/website-scan-technical-yield-169-sites.json",
  note: "A domain-free public extract containing all counts, outcome shares, cohort yields, intervals and the frozen source-artifact hash used in this brief."
};

const technicalYieldScript: EditorialSource = {
  label: "Technical-yield audit script",
  href: "https://github.com/ThorfinnThor/VibeBench/blob/main/scripts/audit-development-v0_5-option-b-technical-yield.mjs",
  note: "The repository script that derives the frozen audit from the historical browser-surface matrix."
};

const visibleEvaluationArtifact: EditorialSource = {
  label: "Public uncertainty evaluation aggregate (JSON)",
  href: "/data/insights/website-score-uncertainty-81-sites.json",
  note: "A domain-free public extract containing repeated metrics, indeterminate analysis, perturbation results and the frozen source-artifact hash."
};

const visibleEvaluationScript: EditorialSource = {
  label: "Visible-feature evaluation script",
  href: "https://github.com/ThorfinnThor/VibeBench/blob/main/scripts/evaluate-development-v0_5-option-b-visible-v2.mjs",
  note: "The deterministic evaluation implementation used to generate the published aggregate artifact."
};

const confirmationArtifact: EditorialSource = {
  label: "Public blind-confirmation aggregate (JSON)",
  href: "/data/insights/blind-confirmation-integrity-100-sites.json",
  note: "A domain-free public extract containing technical coverage, confusion counts, metrics, the gate decision and the frozen source-artifact hash."
};

const confirmationScript: EditorialSource = {
  label: "Confirmation evaluation script",
  href: "https://github.com/ThorfinnThor/VibeBench/blob/main/scripts/evaluate-confirmation-v0_4.mjs",
  note: "The evaluation logic showing that capture completeness is required in addition to the numerical precision and recall thresholds."
};

export const editorialDataBriefs: Record<string, EditorialPage> = {
  "website-scan-technical-yield-169-sites": {
    slug: "website-scan-technical-yield-169-sites",
    format: "data-brief",
    formatLabel: "Technical yield data brief",
    eyebrow: "VibeFootprint research data · n=169",
    title: "What 169 website retrieval attempts taught us about scan reliability",
    metaTitle: "Website Scan Reliability Across 169 Attempts",
    description: "An aggregate VibeFootprint data brief on 169 historical website retrieval attempts, their technical outcomes and the selection bias created by incomplete capture.",
    dek: "Only 81 of 169 historical retrieval attempts produced usable captures. The failure pattern shows why scan reliability must be reported before any model result—and why a timed-out page must never be silently treated as evidence.",
    scope: "This is a frozen historical audit generated on 13 August 2026, not a measurement of current VibeFootprint uptime or present-day website availability. Domain identities are excluded, and unresolved timeouts remain unresolved.",
    audience: "Website-audit teams, researchers and buyers evaluating scan evidence",
    readingMinutes: 8,
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    dataset: {
      name: "VibeFootprint Option B historical technical-yield audit",
      description: "Aggregate outcomes from 169 historical public-website retrieval attempts, generated without a rescan.",
      temporalCoverage: "2026-08-13",
      measurementTechnique: "Frozen retrospective aggregation of technical capture outcomes with Wilson 95% intervals",
      variablesMeasured: ["attempted captures", "successful captures", "failure outcome", "technical yield", "benchmark cohort"],
      url: technicalYieldArtifact.href
    },
    blocks: [
      {
        type: "prose",
        eyebrow: "Dataset and method",
        heading: "A frozen audit of attempted captures—not a fresh availability test",
        paragraphs: [
          "The audit aggregated 169 retrieval attempts from an existing browser-surface matrix. It did not revisit or rescan any website. Eighty-one attempts produced a technically usable capture and 88 did not, for an observed technical yield of 47.9%. The recorded Wilson 95% interval was 40.5% to 55.4%.",
          "The distinction matters because a website can enter a scoring evaluation only after enough public surface has been captured. A failed capture is missing evidence, not a low score, a high score or a negative website judgment. We therefore report the acquisition funnel before reporting any downstream model metric."
        ],
        bullets: [
          "169 retrieval attempts in the frozen historical matrix",
          "81 usable captures and 88 technical failures",
          "No domains or individual website scores are disclosed",
          "No failed row was converted into a model prediction"
        ]
      },
      {
        type: "matrix",
        heading: "The complete technical outcome distribution",
        intro: "Shares use all 169 attempts as the denominator. The largest failure class cannot be resolved more precisely from the retained historical evidence.",
        columns: ["Recorded outcome", "Count", "Share of attempts", "What may be concluded"],
        rows: [
          ["Successful capture", "81", "47.9%", "Enough public surface was retained for the Development evaluation"],
          ["Navigation timeout, unresolved", "81", "47.9%", "The historical navigation exceeded its budget; no lower-level reason was retained"],
          ["Client blocked", "3", "1.8%", "The client recorded a blocking response for these attempts"],
          ["DNS unresolved", "3", "1.8%", "Name resolution did not complete for these attempts"],
          ["Certificate error", "1", "0.6%", "TLS certificate handling prevented this capture"]
        ]
      },
      {
        type: "matrix",
        heading: "Yield was not evenly distributed across the historical sample",
        intro: "These are benchmark and collection cohorts, not claims about all human-built or AI-assisted websites. The imbalance is relevant because analysis of successful rows alone inherits the capture process.",
        columns: ["Historical segment", "Attempted", "Successful", "Technical yield"],
        rows: [
          ["Stable-human benchmark label", "86", "53", "61.6% (95% interval 51.1–71.2%)"],
          ["Strong-AI benchmark label", "83", "28", "33.7% (95% interval 24.5–44.4%)"],
          ["Existing collection cohort", "38", "37", "97.4% (95% interval 86.5–99.5%)"],
          ["Expansion collection cohort", "131", "44", "33.6% (95% interval 26.1–42.0%)"]
        ]
      },
      {
        type: "scorecard",
        heading: "Four rules for trustworthy website-scan reporting",
        intro: "A scan product should make the evidence pipeline auditable before presenting a precise-looking score.",
        items: [
          { label: "Acquisition", question: "Is capture yield shown before evaluation metrics?", strong: "Attempts, usable captures and failure classes are reported with denominators.", weak: "Only successfully scored pages are shown, hiding how much of the target set disappeared." },
          { label: "Timeouts", question: "Are unresolved failures kept unresolved?", strong: "The report says only that navigation timed out under the recorded budget.", weak: "A timeout is relabelled as offline, blocked or defective without retained evidence." },
          { label: "Selection", question: "Could technical success depend on the benchmark group?", strong: "Yield is compared by relevant cohort and the downstream limitation is stated.", weak: "Complete cases are treated as if they were a random sample of all attempts." },
          { label: "Features", question: "Is operational metadata separated from model evidence?", strong: "Hosting suffix and failure metadata stay outside the scoring feature set.", weak: "Infrastructure or retrieval success becomes a proxy for the benchmark label." }
        ]
      },
      {
        type: "prose",
        eyebrow: "Interpretation",
        heading: "The main result is a selection-bias warning, not a claim about website quality",
        paragraphs: [
          "Technical yield differed by 27.9 percentage points between the two historical benchmark labels. That does not explain why captures failed, and it does not establish a general property of AI-assisted websites. It does mean that model metrics calculated only on the 81 successful captures are exposed to label-dependent selection bias.",
          "For product decisions, the remedy is procedural: preserve richer failure reasons, monitor capture yield by cohort, retry under a documented policy and keep failed retrievals outside the score. The current VibeFootprint result should describe only the evidence actually observed."
        ]
      },
      {
        type: "faq",
        heading: "Questions about the 169-attempt audit",
        items: [
          { question: "Does 47.9% mean the current VibeFootprint scanner fails half the time?", answer: "No. It is the yield of one frozen historical research collection generated on 13 August 2026 without a rescan. It is not a current production-service uptime measurement." },
          { question: "Were the 81 timeouts websites that were offline?", answer: "That cannot be concluded. The retained artifact contains no lower-level reason, so the correct label is unresolved navigation timeout—not offline, unreachable or blocked." },
          { question: "Why publish a weak technical-yield result?", answer: "Because downstream model metrics are easier to overstate when the acquisition funnel is hidden. Publishing the negative result makes the evidence boundary and future collection requirements explicit." }
        ]
      }
    ],
    sources: [technicalYieldArtifact, technicalYieldScript, methodology],
    related: ["vibe-coding-website-audit-framework", "can-you-detect-ai-generated-website-code", "vibe-coding-error-handling"]
  },

  "website-score-uncertainty-81-sites": {
    slug: "website-score-uncertainty-81-sites",
    format: "data-brief",
    formatLabel: "Uncertainty data brief",
    eyebrow: "VibeFootprint research data · n=81",
    title: "What an uncertainty band changed across 81 website evaluations",
    metaTitle: "Website Score Uncertainty Across 81 Evaluations",
    description: "A VibeFootprint data brief on 81 usable website captures, 20 repeated Development evaluations, an indeterminate score band and simulated feature-count perturbations.",
    dek: "Across 20 repeated Development assignments, a 0.38–0.62 indeterminate band withheld a median 13.6% of decisions. Precision improved among decided cases, but unresolved cases still reduced overall positive recall.",
    scope: "This is Development research on 81 technically usable historical captures, not independent validation, a current production benchmark or an authorship probability. Perturbation results are deterministic simulations, not rescans.",
    audience: "Practitioners interpreting website similarity scores and uncertainty",
    readingMinutes: 9,
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    dataset: {
      name: "VibeFootprint visible-feature repeated Development evaluation",
      description: "Aggregate repeated Development metrics, indeterminate decisions and perturbation simulations for 81 technically usable website captures.",
      temporalCoverage: "2026-08-13",
      measurementTechnique: "Twenty deterministic class-stratified assignments with five folds, training-fold-only oversampling and logistic models",
      variablesMeasured: ["precision", "recall", "specificity", "accuracy", "indeterminate coverage", "score perturbation"],
      url: visibleEvaluationArtifact.href
    },
    blocks: [
      {
        type: "prose",
        eyebrow: "Dataset and protocol",
        heading: "Twenty repeated Development assignments on 81 usable captures",
        paragraphs: [
          "The starting collection contained 169 attempted captures. Technical acquisition left 81 usable websites: 28 with the historical strong-AI benchmark label and 53 with the stable-human benchmark label. The evaluation used 20 deterministic, class-stratified assignments with five folds each.",
          "Each training fold used deterministic minority oversampling; test folds were not oversampled. The model was logistic with L2 regularization of 10, a 0.5 decision threshold and a predefined inclusive indeterminate range from 0.38 to 0.62. The resulting scores express orientation toward this Development benchmark—not calibrated authorship probability."
        ]
      },
      {
        type: "matrix",
        heading: "Repeated Development metrics before applying the indeterminate band",
        intro: "The median summarizes the 20 assignments; the P10–P90 range shows variation across those assignments. These are complete-case Development metrics, subject to the acquisition limitation in the 169-attempt audit.",
        columns: ["Metric", "Median", "P10–P90", "Interpretation boundary"],
        rows: [
          ["Precision", "76.7%", "71.0–81.5%", "Share of predicted positive cases carrying the positive benchmark label"],
          ["Recall", "78.6%", "78.6–82.1%", "Share of positive benchmark cases predicted positive"],
          ["Specificity", "86.8%", "83.0–90.6%", "Share of negative benchmark cases predicted negative"],
          ["Accuracy", "85.2%", "81.5–86.4%", "Share of all usable cases matching their benchmark label"],
          ["ROC AUC", "88.2%", "87.2–90.0%", "Ranking performance within this Development sample"]
        ]
      },
      {
        type: "matrix",
        heading: "What changed when scores from 0.38 through 0.62 were left unresolved",
        intro: "An indeterminate band trades decision coverage for cleaner decided cases. Reporting only the improved decided-case metrics would hide the unresolved part of the sample.",
        columns: ["Quantity", "Median across assignments", "Observed range", "Practical meaning"],
        rows: [
          ["Decided coverage", "85.2%", "82.7–90.1%", "Most cases remained outside the indeterminate band"],
          ["Abstention rate", "13.6%", "9.9–17.3%", "Roughly one in seven cases received no binary decision at the median"],
          ["Precision among decided cases", "87.5%", "76.9–91.7%", "Precision rose after excluding ambiguous scores"],
          ["Recall among decided positive cases", "80.8%", "77.8–84.0%", "Recall looks stronger when unresolved positives are omitted"],
          ["Overall positive recall with abstentions unresolved", "75.0%", "67.9–78.6%", "The full decision policy recovered fewer positive cases than the decided-only view suggests"]
        ]
      },
      {
        type: "matrix",
        heading: "A deterministic perturbation simulation produced few boundary changes",
        intro: "Two inverse jitters within ±5% were applied to each non-binary source count. This tests arithmetic sensitivity under a defined simulation; it does not reproduce browser or website change over time.",
        columns: ["Simulation result", "Value", "Unit", "Correct interpretation"],
        rows: [
          ["Comparisons", "3,240", "score comparisons", "All recorded perturbation comparisons in the frozen artifact"],
          ["Median absolute score change", "0.32", "points on a 0–100 scale", "Half of simulated changes were no larger than 0.32 points"],
          ["P90 absolute score change", "1.12", "points on a 0–100 scale", "Ninety percent were no larger than 1.12 points"],
          ["Maximum absolute score change", "5.69", "points on a 0–100 scale", "The most sensitive recorded simulated comparison"],
          ["Binary threshold flips", "0.52%", "of comparisons", "A small share crossed the 0.5 binary threshold"],
          ["Qualitative band changes", "1.91%", "of comparisons", "A larger share crossed one of the broader reporting bands"]
        ]
      },
      {
        type: "prose",
        eyebrow: "Interpretation",
        heading: "An uncertainty band is a decision policy, not an accuracy upgrade",
        paragraphs: [
          "Ten websites were indeterminate by their mean score. That is useful product information: the visible evidence did not justify a crisp binary orientation under the predefined band. The band raised median precision among decided cases from 76.7% to 87.5%, but that comparison is conditional on leaving some cases unresolved.",
          "The responsible product pattern is to show the unresolved state, preserve continuous evidence and avoid translating the orientation score into authorship certainty. A wider or narrower band would change coverage and error trade-offs and therefore needs a documented decision rule rather than post-hoc tuning."
        ],
        bullets: [
          "Report decided-case metrics together with abstention and full-policy recall",
          "Keep Development evaluation separate from independent confirmation",
          "Describe perturbation simulations as simulations, not observed rescans",
          "Treat stable coefficient direction as benchmark association, never causation"
        ]
      },
      {
        type: "faq",
        heading: "Questions about score uncertainty",
        items: [
          { question: "Does an indeterminate result mean the scan failed?", answer: "No. Technical capture can succeed while the measured orientation remains too close to the predefined decision boundary for a responsible binary label." },
          { question: "Did the uncertainty band make the model more accurate?", answer: "It changed the decision policy. Metrics among decided cases improved because ambiguous cases were withheld, while coverage fell and unresolved cases still counted against full-policy recall." },
          { question: "Do the perturbation results prove that live scores never change?", answer: "No. They cover deterministic ±5% count jitters in a frozen simulation. They do not model browser changes, website edits, network behavior or a fresh capture." }
        ]
      }
    ],
    sources: [visibleEvaluationArtifact, visibleEvaluationScript, technicalYieldArtifact, methodology],
    related: ["can-you-detect-ai-generated-website-code", "how-to-tell-if-a-website-was-vibe-coded", "vibe-coding-website-audit-framework"]
  },

  "blind-confirmation-integrity-100-sites": {
    slug: "blind-confirmation-integrity-100-sites",
    format: "data-brief",
    formatLabel: "Integrity gate data brief",
    eyebrow: "VibeFootprint research data · n=100",
    title: "Why 82.4% precision was not enough to pass our model gate",
    metaTitle: "Why 82.4% Precision Did Not Pass the Gate",
    description: "A transparent VibeFootprint data brief showing why a 100-case blind confirmation was rejected despite exceeding its numerical precision and recall thresholds.",
    dek: "The historical blind run reached 82.4% precision and 85.7% recall across 99 successful cases. We still marked the gate as failed because none of those legacy captures contained explicit completeness evidence.",
    scope: "This is a frozen integrity reconstruction of a historical v0.4 confirmation run, not a claim about current production performance. The numeric metrics are reported for transparency but were not promoted as a passed confirmation.",
    audience: "Model reviewers, product teams and buyers evaluating evidence quality",
    readingMinutes: 8,
    publishedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    dataset: {
      name: "VibeFootprint v0.4 blind confirmation integrity reconstruction",
      description: "Aggregate integrity reconstruction for 100 blind confirmation cases with one technical error and 99 legacy captures of unverifiable completeness.",
      temporalCoverage: "2026-08-15",
      measurementTechnique: "Independent blind confirmation reconstruction with a dual metric-and-capture-completeness release gate",
      variablesMeasured: ["technical coverage", "true positives", "false positives", "true negatives", "false negatives", "precision", "recall", "capture completeness"],
      url: confirmationArtifact.href
    },
    blocks: [
      {
        type: "prose",
        eyebrow: "Dataset and gate",
        heading: "A 100-case blind run with two separate release requirements",
        paragraphs: [
          "The independent historical confirmation manifest contained 100 blind cases. Ninety-nine completed technically and one returned an error, giving 99% technical coverage. The pre-existing numerical gate required at least 80% precision and at least 80% recall.",
          "The integrity reconstruction also required explicit proof that each evaluated capture was complete under its capture contract. That second requirement is not cosmetic: a model can appear to meet a threshold while relying on partial or unverifiable inputs."
        ]
      },
      {
        type: "matrix",
        heading: "The 99 technically successful cases produced this confusion matrix",
        intro: "Counts are reproduced from the frozen aggregate artifact. They describe agreement with the blind benchmark labels, not website quality or generated-code share.",
        columns: ["Outcome", "Count", "Plain-language meaning", "Contribution"],
        rows: [
          ["True positive", "42", "Positive benchmark case predicted positive", "Supports precision and recall"],
          ["False positive", "9", "Negative benchmark case predicted positive", "Reduces precision and specificity"],
          ["True negative", "41", "Negative benchmark case predicted negative", "Supports specificity and accuracy"],
          ["False negative", "7", "Positive benchmark case predicted negative", "Reduces recall"]
        ]
      },
      {
        type: "matrix",
        heading: "The numerical metric gate passed",
        intro: "Both primary thresholds exceeded their predefined minimum. The overall release gate still failed because numeric performance was only one required condition.",
        columns: ["Metric", "Observed", "Required threshold", "Threshold result"],
        rows: [
          ["Precision", "82.4%", "At least 80%", "Passed"],
          ["Recall", "85.7%", "At least 80%", "Passed"],
          ["Specificity", "82.0%", "Not a primary gate", "Reported"],
          ["Accuracy", "83.8%", "Not a primary gate", "Reported"],
          ["F1", "84.0%", "Not a primary gate", "Reported"]
        ]
      },
      {
        type: "matrix",
        heading: "The evidence-integrity gate failed",
        intro: "The legacy result rows did not persist explicit capture-completeness state, so completeness could not be reconstructed after the fact.",
        columns: ["Integrity check", "Observed", "Required", "Decision"],
        rows: [
          ["Explicitly complete rows", "0", "Completeness evidence for evaluated captures", "Failed"],
          ["Unverifiable legacy rows", "99", "No unverifiable evaluated rows", "Failed"],
          ["Metric thresholds", "Both passed", "Precision and recall at least 80%", "Passed"],
          ["Overall release gate", "Not passed", "Metrics and capture integrity", "Rejected"]
        ]
      },
      {
        type: "steps",
        heading: "What the failed gate changed in the research process",
        intro: "The practical lesson is to design integrity evidence into capture and evaluation—not to reconstruct it after a promising number appears.",
        items: [
          { title: "Persist capture completeness", action: "Record whether every required surface and artifact completed under the declared contract.", record: "A per-row completion state that can be audited independently of the prediction." },
          { title: "Separate technical, metric and integrity gates", action: "Require each gate explicitly and prevent one successful metric from overriding another failed condition.", record: "A machine-readable release decision with each prerequisite and its result." },
          { title: "Hash immutable inputs and outputs", action: "Bind the manifest, raw results and evaluation artifact to stable hashes before interpretation.", record: "The reconstruction retains SHA-256 identifiers for the manifest and raw results." },
          { title: "Publish the negative decision", action: "Report the observed metrics while preserving the fact that the confirmation was not accepted.", record: "Status: LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE; overall gate passed: false." }
        ]
      },
      {
        type: "prose",
        eyebrow: "Interpretation",
        heading: "Good-looking metrics cannot repair missing provenance",
        paragraphs: [
          "Rejecting the run does not mean its 99 predictions never happened. It means the evidence package was insufficient for the stronger claim that the model had passed confirmation under the complete protocol. The appropriate status preserves both facts: the recorded metrics crossed 80%, and the release gate did not pass.",
          "This is the standard VibeFootprint applies to public claims as well. A score should not imply more than the retained evidence can support, and missing provenance should lower the claim—not be filled with a confident assumption."
        ]
      },
      {
        type: "faq",
        heading: "Questions about the failed confirmation gate",
        items: [
          { question: "Did the model pass the 80/80 metric threshold?", answer: "Yes. The reconstruction recorded 82.4% precision and 85.7% recall. The overall release gate still failed because verified capture completeness was also mandatory." },
          { question: "Why not accept the metrics and add the missing evidence later?", answer: "Completeness evidence describes the inputs used for those exact predictions. It cannot be reliably recreated after the historical captures when the required state was not persisted." },
          { question: "Are these current VibeFootprint production metrics?", answer: "No. They belong to a frozen historical v0.4 confirmation reconstruction evaluated on 15 August 2026 and should not be used as a current production-performance claim." }
        ]
      }
    ],
    sources: [confirmationArtifact, confirmationScript, methodology],
    related: ["can-you-detect-ai-generated-website-code", "how-to-review-ai-generated-frontend-code", "vibe-coding-website-audit-framework"]
  }
};
