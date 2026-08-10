// Reviewed Development-only samples. Each sample uses one of:
// AI_REPLIT_AGENT_NEW, AI_BOLT_NEW, HUMAN_MODERN_SAAS_NEW, HUMAN_MODERN_APP_NEW.
// The build script assigns stable slot IDs in insertion order within each group.
// Never add a target from the completed v0.1 holdout.

const humanLabelLimitation = "Operational Development control: the official public source repository predates 2022-11-30 and links the target, but this does not prove that no later contributor used AI assistance.";

function familyId(targetUrl) {
  return new URL(targetUrl).hostname.toLowerCase().replace(/^www\./, "");
}

function humanSample({ group, targetUrl, repository, projectStartedAt, baselineLevel, baselineStacks, projectFamilyId = familyId(targetUrl), note }) {
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
    project_family_id: projectFamilyId,
    independence_review: "PASS",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY",
    notes: note
  };
}

function aiSample({ group, targetUrl, provenanceUrl, provenanceType = "independent_hackathon_submission", provenanceLocator, provenanceSummary, baselineLevel, baselineStacks, baselineDirectEvidence = [], labelDefinition = "Public deployment explicitly documented as built with the named AI builder in a third-party hackathon submission.", labelLimitation = "Submission provenance documents builder use but does not quantify how much code or design was generated versus manually edited.", projectFamilyId = familyId(targetUrl), note }) {
  return {
    group,
    target_url: targetUrl,
    provenance_url: provenanceUrl,
    provenance_type: provenanceType,
    provenance_locator: provenanceLocator,
    provenance_summary: provenanceSummary,
    label_definition: labelDefinition,
    label_limitation: labelLimitation,
    baseline_scan: {
      endpoint: "https://vibe-bench-cyan.vercel.app/api/scan",
      checked_at: "2026-08-10",
      level: baselineLevel,
      stack_signals: baselineStacks,
      direct_evidence: baselineDirectEvidence
    },
    collected_at: "2026-08-10",
    project_family_id: projectFamilyId,
    independence_review: "PASS",
    development_overlap_check: "PASS",
    holdout_overlap_check: "PASS",
    provenance_review: "PASS",
    status: "READY",
    notes: note
  };
}

export const developmentSamplesV02 = [
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://genaipi.org",
    provenanceUrl: "https://replit.com/customers/genaipi",
    provenanceType: "official_builder_customer_story",
    provenanceLocator: "Building with Replit / The Bottom Line / visit genaipi.org",
    provenanceSummary: "Replit's customer story says GenAIPI was built in days with Replit Agent and maps the product to genaipi.org.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    labelDefinition: "Public custom-domain deployment explicitly mapped to Replit Agent by an official builder customer story.",
    labelLimitation: "The official story documents Replit Agent use but does not expose an independent code-level audit or quantify later manual changes.",
    note: "High-quality official Replit Agent control; v0.1 misses five visible modern stack signals."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://saastr.ai",
    provenanceUrl: "https://replit.com/customers/saastr",
    provenanceType: "official_builder_customer_story",
    provenanceLocator: "Building with Replit / 1. SaaStr.ai Website Ecosystem",
    provenanceSummary: "Replit's customer story lists the SaaStr.ai website ecosystem among Jason Lemkin's Replit production applications.",
    baselineLevel: "indeterminate",
    baselineStacks: ["Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    labelDefinition: "Public custom-domain deployment explicitly mapped to Replit production development by an official builder customer story.",
    labelLimitation: "The customer story documents platform use but does not quantify the share produced by Agent versus subsequent human editing.",
    note: "Official Replit production control with four modern stack signals and no v0.1 attribution."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://clearscribehq.com",
    provenanceUrl: "https://www.linkedin.com/posts/nagib-araman-53a51529_replit-buildathon-buildinpublic-activity-7431084271680995328-p9LG",
    provenanceType: "public_creator_statement",
    provenanceLocator: "Creator launch statement / clearscribehq.com",
    provenanceSummary: "The creator states that ClearScribe AI was built end-to-end with Replit Agent 3 and links clearscribehq.com as the live website.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    labelDefinition: "Public custom-domain deployment explicitly linked to Replit Agent by its creator in a dated launch statement.",
    labelLimitation: "Creator self-report is auditable as provenance but is not an independent code audit and does not quantify manual edits.",
    note: "Creator-documented Replit Agent 3 false negative with five modern stack signals."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://realvsai.com",
    provenanceUrl: "https://www.reddit.com/r/replit/comments/1kd6wjv/my_second_app_using_replit_my_experience_with_the/",
    provenanceType: "public_creator_statement",
    provenanceLocator: "Original post / second app URL",
    provenanceSummary: "The creator's dated account of building a second app with the Replit agent links realvsai.com as the deployment.",
    baselineLevel: "indeterminate",
    baselineStacks: [],
    labelDefinition: "Public custom-domain deployment explicitly linked to Replit Agent by its creator in a dated build report.",
    labelLimitation: "Creator self-report documents Agent use but also describes deliberate technical choices and does not quantify manual code changes.",
    note: "Sparse custom-domain Replit Agent control with no v0.1-visible stack or builder evidence."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://podcast.thekamclub.com",
    provenanceUrl: "https://replit.discourse.group/t/how-to-create-an-automated-podcast-website-with-replit/6034",
    provenanceType: "public_creator_statement",
    provenanceLocator: "Creator build report / Replit Agent briefing / Primary Domain",
    provenanceSummary: "The creator documents the Replit-built podcast site, publishes the Agent's implementation briefing, and names podcast.thekamclub.com as the primary domain.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    labelDefinition: "Public custom-domain deployment with a detailed creator report documenting Replit Agent implementation work.",
    labelLimitation: "The report is a creator statement and includes third-party services; it does not quantify the Agent's share of every implementation step.",
    note: "Detailed custom-domain Replit Agent false negative with five modern stack signals."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://findmysauna.com",
    provenanceUrl: "https://www.linkedin.com/posts/mannybernabe_replit-agent-v2-dropped-a-couple-weeks-ago-activity-7312859754689662978-Tkbv",
    provenanceType: "curated_builder_showcase",
    provenanceLocator: "Replit Agent v2 examples transcript / findmysauna.com",
    provenanceSummary: "A curated Replit Agent v2 showcase identifies findmysauna.com as a mostly vibe-coded public website built in the Agent v2 cohort.",
    baselineLevel: "indeterminate",
    baselineStacks: ["Tailwind CSS"],
    labelDefinition: "Public custom-domain deployment mapped to Replit Agent v2 in a dated builder-focused showcase.",
    labelLimitation: "The showcase describes the project as about 70% vibe-coded and does not claim exclusive Replit Agent generation.",
    note: "Mixed-authorship Replit Agent v2 control retained with an explicit limitation."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://aivideodubbing.net",
    provenanceUrl: "https://hot100.ai/project/2347",
    provenanceType: "independent_reviewed_directory",
    provenanceLocator: "Project metadata / Built With / Project URL",
    provenanceSummary: "The reviewed Hot100 project record maps aivideodubbing.net to a tool list that explicitly includes Replit Agent.",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Lucide"],
    labelDefinition: "Public custom-domain deployment whose reviewed third-party project metadata explicitly lists Replit Agent.",
    labelLimitation: "Directory metadata documents multi-tool use and does not identify which visible components came from Replit Agent.",
    note: "Multi-tool Replit Agent control with four modern stack signals and no v0.1 attribution."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://mygutgoddess.com",
    provenanceUrl: "https://hot100.ai/project/272",
    provenanceType: "independent_reviewed_directory",
    provenanceLocator: "Project metadata / Built With / Project URL",
    provenanceSummary: "The reviewed Hot100 project record maps mygutgoddess.com to a tool list that explicitly includes Replit Agent and Replit.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Vite", "Tailwind CSS", "Radix UI", "Lucide"],
    labelDefinition: "Public custom-domain deployment whose reviewed third-party project metadata explicitly lists Replit Agent.",
    labelLimitation: "Directory metadata documents builder use but is submitter-supplied and does not quantify later manual editing.",
    note: "Independent-directory Replit Agent false negative with five modern stack signals."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://ankonai.com",
    provenanceUrl: "https://hot100.ai/project/2393",
    provenanceType: "independent_reviewed_directory",
    provenanceLocator: "Project metadata / Built With / Project URL",
    provenanceSummary: "The reviewed Hot100 project record maps ankonai.com to a tool list that explicitly includes Replit Agent.",
    baselineLevel: "indeterminate",
    baselineStacks: ["Next.js", "React", "Tailwind CSS"],
    labelDefinition: "Public custom-domain deployment whose reviewed third-party project metadata explicitly lists Replit Agent.",
    labelLimitation: "Directory metadata records multiple tools and cannot attribute individual visible components to Replit Agent.",
    note: "Multi-tool Replit Agent false negative with three modern stack signals."
  }),
  aiSample({
    group: "AI_REPLIT_AGENT_NEW",
    targetUrl: "https://www.designmakerai.co",
    provenanceUrl: "https://hot100.ai/project/2358",
    provenanceType: "independent_reviewed_directory",
    provenanceLocator: "Project metadata / Built With / Project URL",
    provenanceSummary: "The reviewed Hot100 project record maps designmakerai.co to a tool list that explicitly includes Replit Agent.",
    baselineLevel: "indicative",
    baselineStacks: ["Next.js", "React", "Tailwind CSS", "Lucide"],
    labelDefinition: "Public custom-domain deployment whose reviewed third-party project metadata explicitly lists Replit Agent.",
    labelLimitation: "Directory metadata documents multi-tool use, including Vercel, and does not attribute the current deployment's visible structure to one builder.",
    note: "Hard Replit Agent control: v0.1 returns only generic indicative structure, not builder evidence."
  }),
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
    targetUrl: "https://app.tabsquad.com",
    provenanceUrl: "https://devpost.com/software/the-team-project",
    provenanceLocator: "How we built it / Try it out / app.tabsquad.com",
    provenanceSummary: "The Devpost submission says the full TabSquad app was built with Bolt.new and maps app.tabsquad.com as the live custom-domain deployment.",
    baselineLevel: "indeterminate",
    baselineStacks: ["React", "Tailwind CSS", "Supabase"],
    projectFamilyId: "tabsquad.com",
    note: "Public custom-domain Bolt false negative with three modern stack signals; replaces a domain that became parked before freeze."
  }),
  aiSample({
    group: "AI_BOLT_NEW",
    targetUrl: "https://colorpalgen.com",
    provenanceUrl: "https://hot100.ai/project/687",
    provenanceType: "independent_reviewed_directory",
    provenanceLocator: "Project metadata / Built With / Project URL",
    provenanceSummary: "The reviewed Hot100 project record maps colorpalgen.com to a tool list that explicitly includes Bolt.",
    baselineLevel: "indeterminate",
    baselineStacks: ["Vite", "Tailwind CSS", "Framer Motion"],
    labelDefinition: "Public custom-domain deployment whose reviewed third-party project metadata explicitly lists Bolt.",
    labelLimitation: "Directory metadata documents multi-tool use, including Cursor and Netlify, and does not attribute individual visible components to Bolt.",
    note: "Reviewed-directory Bolt false negative with three modern stack signals; replaces a domain that became parked before freeze."
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
