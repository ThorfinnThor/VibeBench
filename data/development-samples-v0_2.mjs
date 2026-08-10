// Reviewed Development-only samples. Each sample uses one of:
// AI_REPLIT_AGENT_NEW, AI_BOLT_NEW, HUMAN_MODERN_SAAS_NEW, HUMAN_MODERN_APP_NEW.
// The build script assigns stable slot IDs in insertion order within each group.
// Never add a target from the completed v0.1 holdout.

const humanLabelLimitation = "Operational Development control: the official public source repository predates 2022-11-30 and links the target, but this does not prove that no later contributor used AI assistance.";

function humanSample({ group, targetUrl, repository, projectStartedAt, baselineLevel, baselineStacks, note }) {
  return {
    group,
    target_url: targetUrl,
    provenance_url: `https://github.com/${repository}`,
    provenance_type: "official_public_source_repository",
    provenance_summary: `Official public repository ${repository} links the target project and provides inspectable development history predating widespread generative web builders.`,
    project_started_at: projectStartedAt,
    label_definition: "Pre-generative public-source project used as an operational Human control.",
    label_limitation: humanLabelLimitation,
    baseline_scan: {
      endpoint: "https://vibe-bench-cyan.vercel.app/api/scan",
      checked_at: "2026-08-10",
      level: baselineLevel,
      stack_signals: baselineStacks
    },
    collected_at: "2026-08-10",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY",
    notes: note
  };
}

function aiSample({ group, targetUrl, provenanceUrl, provenanceLocator, provenanceSummary, baselineLevel, baselineStacks, baselineDirectEvidence = [], note }) {
  return {
    group,
    target_url: targetUrl,
    provenance_url: provenanceUrl,
    provenance_type: "independent_hackathon_submission",
    provenance_locator: provenanceLocator,
    provenance_summary: provenanceSummary,
    label_definition: "Public deployment explicitly documented as built with the named AI builder in a third-party hackathon submission.",
    label_limitation: "Submission provenance documents builder use but does not quantify how much code or design was generated versus manually edited.",
    baseline_scan: {
      endpoint: "https://vibe-bench-cyan.vercel.app/api/scan",
      checked_at: "2026-08-10",
      level: baselineLevel,
      stack_signals: baselineStacks,
      direct_evidence: baselineDirectEvidence
    },
    collected_at: "2026-08-10",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY",
    notes: note
  };
}

export const developmentSamplesV02 = [
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://toomuchforce.com",
    provenanceUrl: "https://devpost.com/software/too-much-force",
    provenanceLocator: "How it was built / Built With / Try it out",
    provenanceSummary: "The Devpost submission states the project was built with Bolt.new and maps the deployed custom domain in Try it out.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Supabase"],
    note: "Public custom-domain Bolt false negative with four modern stack signals."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://bolt-shop.com",
    provenanceUrl: "https://devpost.com/software/bolty-bolt-new-boilerplate-mobile-firebase-stack",
    provenanceLocator: "How it was built / Built With / Try it out",
    provenanceSummary: "The Devpost submission documents Bolt.new as the AI development environment and maps bolt-shop.com as the live deployment.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Supabase"],
    note: "Public custom-domain Bolt false negative with four modern stack signals."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://zropi.com",
    provenanceUrl: "https://devpost.com/software/zropi",
    provenanceLocator: "Foundation / Deployment / Try it out",
    provenanceSummary: "The Devpost submission says Zropi was built entirely through Bolt.new prompts and maps zropi.com as its custom-domain deployment.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Framer Motion", "Lucide"],
    note: "Hard public custom-domain Bolt false negative with five modern stack signals."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://onceupon.fun",
    provenanceUrl: "https://devpost.com/software/once-upon-ai",
    provenanceLocator: "How it was built / Built With / Try it out",
    provenanceSummary: "The Devpost submission states the mobile experience was built entirely with Bolt.new and maps onceupon.fun as the public target.",
    baselineLevel: "indeterminate",
    baselineStacks: [],
    note: "Public custom-domain Bolt control with a sparse public web shell."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://focus-garden.xyz",
    provenanceUrl: "https://devpost.com/software/focus-fuel",
    provenanceLocator: "How it was built / Built With / Try it out",
    provenanceSummary: "The Devpost submission documents Bolt.new use and maps focus-garden.xyz as the live custom-domain deployment.",
    baselineLevel: "indeterminate",
    baselineStacks: [],
    note: "Public custom-domain Bolt control with a sparse public web shell."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://pawformancemode.com",
    provenanceUrl: "https://devpost.com/software/pawformance-mode-ai",
    provenanceLocator: "How it was built / Built With / Try it out",
    provenanceSummary: "The Devpost submission says the app was built 100% in Bolt from a single prompt and maps pawformancemode.com as the public target.",
    baselineLevel: "indeterminate",
    baselineStacks: [],
    note: "Public custom-domain Bolt control with a sparse public web shell."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://no-fila.com",
    provenanceUrl: "https://devpost.com/software/no-fila",
    provenanceLocator: "How it was built / Bolt limitations / Try it out",
    provenanceSummary: "The Devpost submission documents continued Bolt.new development and maps no-fila.com as the deployed custom domain.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS"],
    note: "Public custom-domain Bolt false negative with three modern stack signals."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://ketz.site",
    provenanceUrl: "https://devpost.com/software/ketz-monetize-knowledge-get-trusted-ai-answers",
    provenanceLocator: "Bolt project history / Custom Domain / Try it out",
    provenanceSummary: "The Devpost submission publishes four Bolt project links, documents the custom domain, and maps ketz.site as the live target.",
    baselineLevel: "direct",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Lucide", "Supabase"],
    baselineDirectEvidence: [{ label: "Bolt", source: "same-origin-asset", marker: "bolt.new" }],
    note: "Positive control: v0.1 finds a direct bolt.new marker in a same-origin asset."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://justimagine.online",
    provenanceUrl: "https://devpost.com/software/just-imagine",
    provenanceLocator: "Built With / Try it out",
    provenanceSummary: "The Bolt hackathon Devpost submission documents the Bolt ecosystem and maps justimagine.online as its deployed custom domain.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Supabase"],
    note: "Public custom-domain Bolt false negative with four modern stack signals."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://ellisai.org",
    provenanceUrl: "https://devpost.com/software/ellis-ellisai-org",
    provenanceLocator: "Creator statement / Submitted to / Try it out",
    provenanceSummary: "The Devpost submission states that the creator vibe-coded the website for the Bolt hackathon and maps ellisai.org as the public target.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Lucide", "Supabase"],
    note: "Hard public custom-domain Bolt false negative with five modern stack signals; some interface work had human coder help, which is retained in label_limitation."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://supabase.com",
    repository: "supabase/supabase",
    projectStartedAt: "2019-10-12T05:56:49Z",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "Tailwind CSS", "Radix UI", "Lucide", "Supabase"],
    note: "Hard modern SaaS control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://posthog.com",
    repository: "PostHog/posthog",
    projectStartedAt: "2020-01-23T22:46:58Z",
    baselineLevel: "indicative",
    baselineStacks: ["Tailwind CSS", "Radix UI", "Supabase"],
    note: "Hard modern SaaS control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://appsmith.com",
    repository: "appsmithorg/appsmith",
    projectStartedAt: "2020-06-30T04:07:36Z",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Radix UI"],
    note: "Hard modern SaaS control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://novu.co",
    repository: "novuhq/novu",
    projectStartedAt: "2021-08-26T15:22:44Z",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Radix UI", "Lucide"],
    note: "Hard modern SaaS control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://strapi.io",
    repository: "strapi/strapi",
    projectStartedAt: "2015-09-30T15:34:48Z",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Radix UI"],
    note: "Hard modern SaaS control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://www.getoutline.com",
    repository: "outline/outline",
    projectStartedAt: "2016-05-22T21:31:47Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React"],
    note: "Modern SaaS control with a lower-density baseline result."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://www.tooljet.com",
    repository: "ToolJet/ToolJet",
    projectStartedAt: "2021-03-30T08:51:34Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React"],
    note: "Modern SaaS control with a lower-density baseline result."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://medusajs.com",
    repository: "medusajs/medusa",
    projectStartedAt: "2020-01-18T13:39:04Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React", "Tailwind CSS"],
    note: "Modern SaaS/product control with three recognized stack signals."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://payloadcms.com",
    repository: "payloadcms/payload",
    projectStartedAt: "2021-01-05T18:49:45Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React"],
    note: "Modern SaaS/product control with public source history."
  }),
  humanSample({
    group: "HUMAN_MODERN_SAAS_NEW",
    targetUrl: "https://logto.io",
    repository: "logto-io/logto",
    projectStartedAt: "2021-06-19T03:01:50Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Vite", "Supabase"],
    note: "Modern SaaS control with a different modern stack profile."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://jsonhero.io",
    repository: "triggerdotdev/jsonhero-web",
    projectStartedAt: "2022-03-01T09:33:29Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Tailwind CSS"],
    note: "Interactive JSON explorer explicitly described as built by the Trigger.dev team."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://it-tools.tech",
    repository: "CorentinTh/it-tools",
    projectStartedAt: "2020-04-05T11:50:24Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Vite"],
    note: "Long-running public-source interactive developer toolbox."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://rxresu.me",
    repository: "AmruthPillai/Reactive-Resume",
    projectStartedAt: "2020-03-25T14:08:22Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS"],
    note: "Interactive resume builder with three recognized stack signals."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://carbon.now.sh",
    repository: "carbon-app/carbon",
    projectStartedAt: "2017-06-16T02:50:28Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React"],
    note: "Long-running interactive image generator with modern React delivery."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://responsively.app",
    repository: "responsively-org/responsively-app",
    projectStartedAt: "2019-08-10T02:48:18Z",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Lucide"],
    note: "Hard modern app control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://bundlephobia.com",
    repository: "pastelsky/bundlephobia",
    projectStartedAt: "2017-03-27T17:24:15Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React"],
    note: "Long-running interactive package analysis app."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://readme.so",
    repository: "octokatherine/readme.so",
    projectStartedAt: "2021-04-08T18:11:34Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React", "Tailwind CSS"],
    note: "Interactive drag-and-drop editor with a modern frontend stack."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://roadmap.sh",
    repository: "kamranahmedse/developer-roadmap",
    projectStartedAt: "2017-03-15T13:45:52Z",
    baselineLevel: "indicative",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    note: "Hard modern interactive control; current v0.1 baseline returns indicative."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://monkeytype.com",
    repository: "monkeytypegame/monkeytype",
    projectStartedAt: "2020-05-14T17:41:09Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Tailwind CSS"],
    note: "Long-running interactive typing application."
  }),
  humanSample({
    group: "HUMAN_MODERN_APP_NEW",
    targetUrl: "https://devdocs.io",
    repository: "freeCodeCamp/devdocs",
    projectStartedAt: "2013-10-24T18:16:07Z",
    baselineLevel: "indeterminate",
    baselineStacks: ["Tailwind CSS"],
    note: "Long-running interactive documentation browser."
  })
];
