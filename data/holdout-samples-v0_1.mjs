const collected = "2026-08-10";

function row(group, values) {
  const [websiteType, targetUrl, provenanceUrl, provenanceType, projectGroup, organizationGroup, evidence] = values;
  return {
    group,
    website_type: websiteType,
    target_url: targetUrl,
    provenance_url: provenanceUrl,
    provenance_type: provenanceType,
    provenance_summary: evidence,
    collected_at: collected,
    deployment_verified_at: collected,
    reachability_status: "REACHABLE",
    domain_group: new URL(targetUrl).hostname.replace(/^www\./, ""),
    project_group: projectGroup,
    organization_group: organizationGroup,
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Exact public deployment and independent provenance were reviewed; no Development-set target, host, or project match was found."
  };
}

const lovable = [
  ["Consumer web app / astrology", "https://starmate.love/", "https://lovable.dev/blog/mike-burns-ai-filmmaking-studio-platform", "official_builder_story", "starmate", "mike-burns-starmate", "Lovable's official maker story identifies StarMate as an application built with Lovable and links the exact public deployment."],
  ["Community safety map", "https://safety-sentinel-guard.lovable.app/", "https://lovable.dev/blog/2025-01-17-mysafe-x-lovable-hackathon-canada-winner", "official_builder_story", "mysafe-safety-scouts", "mysafe-hackathon-team", "Lovable's official MySafe story names the team, describes the Lovable build process, and links this exact public deployment."],
  ["AI canvas / creative workspace", "https://magican.lovable.app/", "https://lovable.dev/blog/zohar-vanunu-magican-ai-maker", "official_builder_story", "magican", "zohar-vanunu-magican", "Lovable's official profile says Zohar created MagiCan through extensive prompting in Lovable and links this exact deployment."],
  ["Interactive 3D experience", "https://kaleidoscope-visionary.lovable.app/", "https://lovable.dev/blog/2025-01-20-how-a-developer-advocate-built-stunning-3d-projects-with-lovable-dev-and-won-big", "official_builder_story", "kaleidoscope-visionary", "konstantin-zolozhkov-khvostikk", "Lovable's official maker interview describes the Kaleidoscope environment as built with Lovable and links this exact deployment."],
  ["Photo-to-video creator", "https://cherishable.lovable.app/", "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects", "official_builder_story", "cherishable", "tristanbob-cherishable", "Lovable's official hackathon report identifies Cherishable as a Lovable submission, names its maker, and links this deployment."],
  ["AI fashion studio", "https://lumoo.com/", "https://lovable.dev/blog/lumoo-ai-fashion-platform", "official_builder_story", "lumoo", "lumoo-studio", "Lovable's official customer story says Lumoo's AI fashion platform was built entirely with Lovable and links its live product."],
  ["Habit challenge tracker", "https://75hard.live/", "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects", "official_builder_story", "75hard-live", "lovable-christmas-75hard", "Lovable's official hackathon report lists the 75 Hard tracker as a Lovable-built submission and links the exact live deployment."],
  ["Habit and routine tracker", "https://habitflow.lovable.app/", "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects", "official_builder_story", "habitflow", "lovable-christmas-habitflow", "Lovable's official hackathon report lists HabitFlow as a Lovable-built submission and links the exact public deployment."],
  ["Holiday gift generator", "https://santagenie.lovable.app/", "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects", "official_builder_story", "santagenie", "lovable-christmas-santagenie", "Lovable's official hackathon report lists SantaGenie as a Lovable-built submission and links the exact public deployment."],
  ["Digital greeting card creator", "https://cheerful-card-crafter.lovable.app/", "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects", "official_builder_story", "cheerful-card-crafter", "lovable-christmas-cheerful", "Lovable's official hackathon report lists Cheerful Card Crafter as a Lovable-built submission and links this deployment."]
];

const bolt = [
  ["AI-native app builder", "https://adorable-kashata-b4fde7.netlify.app/", "https://devpost.com/software/ai-os-ai-first-app-builder", "independent_project_record", "ai-os", "vivek-shukla-ai-os", "The Devpost project record says Bolt bootstrapped and rapidly prototyped AI-OS and links the exact live deployment."],
  ["Decentralized agent launchpad", "https://algoagent.netlify.app/", "https://devpost.com/software/algo-agent-decentralized-ai-agent-launchpad", "independent_project_record", "algo-agent", "algo-agent-team", "The Devpost project record says Bolt accelerated Algo Agent's backend workflows and links the exact live deployment."],
  ["Weight-management coach", "https://weight.coach/", "https://bolt.new/winners", "independent_project_record", "weight-coach", "bolt-hackathon-weight-coach", "Bolt's official hackathon winners record identifies Weight Coach as the second-place Bolt project and links its live deployment."],
  ["API-key management app", "https://keyhaven.netlify.app/", "https://devpost.com/software/keyhaven", "independent_project_record", "keyhaven", "tommy-thomas-keyhaven", "The Devpost record says KeyHaven used Bolt.new for the app logic and infrastructure and links the exact Netlify deployment."],
  ["Commercial-cleaning CRM", "https://www.klinva.com/", "https://devpost.com/software/klinva-ultimate-crm-saas-for-commercial-cleaning-companies", "independent_project_record", "klinva", "amir-hamza-klinva", "The Devpost record describes Klinva's working CRM prototype as built using Bolt.new and links the exact live product."],
  ["Agriculture IoT dashboard", "https://fanciful-otter-1e10b8.netlify.app/", "https://devpost.com/software/ecobolt", "independent_project_record", "ecobolt", "ecobolt-hackathon-team", "The Devpost record explicitly says EcoBolt was built entirely with Bolt.new's prompt workflow and links this deployment."],
  ["Voice appointment assistant", "https://callvance.net/", "https://devpost.com/software/callvance", "independent_project_record", "callvance", "diego-caputi-callvance", "The Devpost record states CallVance's frontend was created using Bolt.new and provides the exact live deployment."],
  ["LLM comparison platform", "https://modelmash.site/", "https://devpost.com/software/modelmash-find-the-perfect-llm", "independent_project_record", "modelmash", "ammon-brown-modelmash", "The Devpost record includes Bolt.new in the build stack for ModelMash and links the exact public comparison application."],
  ["Social wellness challenge app", "https://legion-co.netlify.app/", "https://devpost.com/software/legion-ym9uef", "independent_project_record", "legion", "soham-s-legion", "The Devpost record describes Bolt.new rapid frontend scaffolding for Legion and links the exact public deployment."],
  ["Interactive learning app", "https://boredoppo.site/", "https://devpost.com/software/bored-opposite", "independent_project_record", "bored-opposite", "yavor-popov-bored-opposite", "The Devpost record says Bolt.new assisted the Bored Opposite frontend and UX and links the exact deployment."]
];

const replit = [
  ["Podcast discovery app", "https://podnudge.com/", "https://replit.com/usecases/customers", "official_builder_story", "podnudge", "podnudge-maker", "Replit's official customer showcase identifies Podnudge as the maker's first Replit Agent-built app and links this deployment."],
  ["PDF compression utility", "https://lowcarbpdf.com/", "https://replit.com/usecases/customers", "official_builder_story", "lowcarbpdf", "eric-lowcarb-tools", "Replit's official customer showcase describes LowCarbPDF as a user-built production utility and links this exact deployment."],
  ["Vocabulary learning app", "https://wordleap.co.uk/", "https://replit.com/usecases/customers", "official_builder_story", "wordleap", "wordleap", "Replit's official customer showcase says Agent enabled WordLeap's full-featured application and links this exact deployment."],
  ["Vocabulary reflex game", "https://wiblet.com/", "https://replit.com/usecases/customers", "official_builder_story", "wiblet", "wiblet-maker", "Replit's official customer showcase identifies Wiblet as built with Replit and links the exact public deployment."],
  ["Nutrition planning app", "https://kitchen-intelligence.replit.app/", "https://replit.discourse.group/t/introduce-yourself/41?page=30", "maker_statement", "kitchen-intelligence", "kitchen-cfo-maker", "The maker's Replit community post says Kitchen Intelligence was built entirely with Replit Agent 4 and links this deployment."],
  ["Sports prediction app", "https://scorecastr.co/", "https://www.reddit.com/r/replit/comments/1lvn2j2/", "maker_statement", "scorecastr", "scorecastr-maker", "The maker states in a public Replit community discussion that Scorecastr was built entirely with Replit and names this domain."],
  ["AI image optimization utility", "https://aiimageoptimize.com/", "https://www.reddit.com/r/replit/comments/1jaqpch/", "maker_statement", "ai-image-optimize", "ai-image-optimize-maker", "The maker shares AI Image Optimize in a public Replit project thread and identifies the associated tools as Replit builds."],
  ["IP address utility", "https://getiphelp.com/", "https://www.reddit.com/r/replit/comments/1jaqpch/", "maker_statement", "get-ip-help", "get-ip-help-maker", "The maker shares Get IP Help in a public Replit project thread and identifies the associated utilities as Replit builds."],
  ["AI content planning SaaS", "https://blogplanner.ai/", "https://www.reddit.com/r/replit/comments/1o96i95/", "maker_statement", "blogplanner-ai", "blogplanner-maker", "The maker's public account says Blogplanner AI was built one hundred percent with Replit and names this live domain."],
  ["AI platform directory", "https://cognimapmarketplace.com/", "https://www.reddit.com/r/replit/comments/1qpfcd1/", "maker_statement", "cognimap-marketplace", "cognimap-maker", "The maker links CogniMap Marketplace while discussing a Replit-built application and its production architecture."]
];

const v0 = [
  ["Immigration assistance app", "https://v0-immigration-chatbot-ui.vercel.app/", "https://devpost.com/software/immi-ai", "independent_project_record", "immi-ai", "immi-ai-team", "The Devpost project record lists v0.dev in the build stack for Immi AI and links the exact Vercel deployment."],
  ["Carbon project SaaS", "https://carbonflow-intelligence-git-main-musanka-s-projects.vercel.app/", "https://devpost.com/software/carbonflow-intelligence-platform", "independent_project_record", "carbonflow", "musanka-sanare-carbonflow", "The Devpost record identifies v0.dev as the UI-generation tool for CarbonFlow and links this exact deployment."],
  ["Humorous excuse generator", "https://v0-funny-excuse-generator.vercel.app/", "https://devpost.com/software/funny-excuse-generator-8cwnz2", "independent_project_record", "funny-excuse-generator", "amrita-funny-excuse", "The maker's Devpost record says v0.dev generated the application UI and links the exact public Vercel deployment."],
  ["Developer portfolio", "https://salimdellali-personal-website-v2.vercel.app/", "https://devpost.com/software/personal-website-and-portfolio-revamp", "independent_project_record", "salim-dellali-portfolio-v2", "salim-dellali", "The maker's Devpost account says the portfolio revamp was created almost entirely with v0.dev and links this deployment."],
  ["Community marketplace", "https://onpost.vercel.app/", "https://devpost.com/software/onpost", "independent_project_record", "onpost", "onpost-team", "The Devpost record identifies Onpost as a project in the Foru.ms and v0 hackathon and links the exact deployment."],
  ["Skin-analysis app", "https://dermascan-prod.vercel.app/", "https://devpost.com/software/dermascan-be8ju5", "independent_project_record", "dermascan", "dermascan-team", "The Devpost record says v0 by Vercel generated and refined DermaScan's frontend and links this deployment."],
  ["Digital receipt wallet", "https://github-jb7azrmn-x32h.vercel.app/", "https://devpost.com/software/birdy-smergp", "independent_project_record", "birdy", "arav-jain-birdy", "The Devpost record says Birdy's frontend used v0.dev components for rapid UI generation and links this deployment."],
  ["Blockchain rental platform", "https://hackdavidson.vercel.app/", "https://devpost.com/software/trustedtenants-eth", "independent_project_record", "leaseledger", "leaseledger-team", "The Devpost record says v0 by Vercel created LeaseLedger's frontend and links the exact live deployment."],
  ["Skills and jobs app", "https://v0-workbro-app-design.vercel.app/", "https://devpost.com/software/workbro", "independent_project_record", "workbro", "workbro-team", "The Devpost record describes v0.dev generating WorkBro's working UI screens and links the exact deployment."],
  ["Food ingredient risk app", "https://nutra-spec.vercel.app/", "https://devpost.com/software/foodfinder-xjtp6m", "independent_project_record", "nutraspec", "nutraspec-team", "The Devpost contribution record says v0.dev was used to design NutraSpec's deployed UI and links the exact application."]
];

const other = [
  ["Roommate and relocation app", "https://new-base-ef46ca07.base44.app/", "https://devpost.com/software/newbase", "independent_project_record", "newbase", "newbase-team", "The Devpost record identifies Base44 as NewBase's build platform and links the exact public Base44 deployment."],
  ["Creator video scoring app", "https://reeled-in.base44.app/", "https://devpost.com/software/loopy-9ev74g", "independent_project_record", "reeled-in", "reeled-in-team", "The Devpost record states Reeled In's frontend was built on Base44 and links the exact public deployment."],
  ["Travel memory map", "https://vibe-map-9dc92c45.base44.app/Home", "https://devpost.com/software/vibemap-1m8a3s", "independent_project_record", "vibemap", "purva-avadhani-vibemap", "The Devpost record says VibeMap used Base44 as its primary build and deployment platform and links this app."],
  ["Student productivity app", "https://productivity-ai-a417e2de.base44.app/", "https://devpost.com/software/productivity-ai", "independent_project_record", "productivity-ai", "productivity-ai-team", "The Devpost record says Productivity AI was built entirely on Base44 and links the exact public deployment."],
  ["Academic dashboard", "https://edu-mate-3163b395.base44.app/", "https://devpost.com/software/edumate-qhblsj", "independent_project_record", "edumate", "edumate-team", "The Devpost record describes Base44's prompt-driven generation as EduMate's core build method and links this app."],
  ["Career opportunity tracker", "https://career-launchpad-af0b9320.base44.app/", "https://devpost.com/software/careerlaunch-smart-portfolio-opportunity-tracker", "independent_project_record", "careerlaunch", "careerlaunch-team", "The Devpost record says CareerLaunch was generated and refined entirely in Base44 and links this deployment."],
  ["Cybercrime support portal", "https://cyber-guard-assist-bcda2879.base44.app/", "https://devpost.com/software/cybercrime-support", "independent_project_record", "citizen-shield", "citizen-shield-team", "The Devpost record identifies Base44 as Citizen Shield's no-code build platform and links the exact deployment."],
  ["Peer rental marketplace", "https://rentit-2025.base44.app/", "https://devpost.com/software/rent-it-jy7zti", "independent_project_record", "rentit", "rentit-team", "The Devpost record says Base44 produced RentIt's full interface and app screens and links the exact deployment."],
  ["Environmental reporting app", "https://eco-guard-ai-e81f2588.base44.app/", "https://devpost.com/software/ecoguard-ai-efq32a", "independent_project_record", "ecoguard-ai", "ecoguard-team", "The Devpost record says EcoGuard AI's frontend, backend, and workflows were built in Base44 and links this app."],
  ["Prompt construction tool", "https://prompt-pilot-ebbb9b7b.base44.app/", "https://devpost.com/software/prompt-piolet", "independent_project_record", "promptpilot", "promptpilot-team", "The Devpost record says PromptPilot was built entirely using Base44's AI builder and links the exact deployment."]
];

const modern = [
  ["Collaborative whiteboard", "https://excalidraw.com/", "https://github.com/excalidraw/excalidraw", "repository_deployment_mapping", "excalidraw", "excalidraw-community"],
  ["Diagram editor", "https://mermaid.live/", "https://github.com/mermaid-js/mermaid-live-editor", "repository_deployment_mapping", "mermaid-live-editor", "mermaid-js"],
  ["Diagram / whiteboard app", "https://app.diagrams.net/", "https://github.com/jgraph/drawio", "repository_deployment_mapping", "drawio-diagrams-net", "jgraph-drawio"],
  ["API development web app", "https://hoppscotch.io/", "https://github.com/hoppscotch/hoppscotch", "repository_deployment_mapping", "hoppscotch", "hoppscotch"],
  ["Collaborative design tool", "https://design.penpot.app/", "https://github.com/penpot/penpot", "repository_deployment_mapping", "penpot", "kaleidos-penpot"],
  ["Infinite canvas editor", "https://www.tldraw.com/", "https://github.com/tldraw/tldraw", "repository_deployment_mapping", "tldraw", "tldraw"],
  ["JSON visualization editor", "https://jsoncrack.com/", "https://github.com/AykutSarac/jsoncrack.com", "repository_deployment_mapping", "jsoncrack", "aykut-sarac-jsoncrack"],
  ["Security transformation toolkit", "https://gchq.github.io/CyberChef/", "https://github.com/gchq/CyberChef", "repository_deployment_mapping", "cyberchef", "gchq"],
  ["Image compression editor", "https://squoosh.app/", "https://github.com/GoogleChromeLabs/squoosh", "repository_deployment_mapping", "squoosh", "google-chrome-labs"],
  ["SVG optimization editor", "https://jakearchibald.github.io/svgomg/", "https://github.com/jakearchibald/svgomg", "repository_deployment_mapping", "svgomg", "jake-archibald"]
].map((r) => [...r, "The official public repository maps the maintained application source to this exact deployment and provides auditable human-authored history."]);

const saas = [
  ["Scheduling SaaS", "https://cal.com/", "https://github.com/calcom/cal.com", "cal-com", "calcom"],
  ["Web analytics SaaS", "https://plausible.io/", "https://github.com/plausible/analytics", "plausible", "plausible"],
  ["Web analytics SaaS", "https://umami.is/", "https://github.com/umami-software/umami", "umami", "umami-software"],
  ["Document signing SaaS", "https://documenso.com/", "https://github.com/documenso/documenso", "documenso", "documenso"],
  ["Survey and feedback SaaS", "https://formbricks.com/", "https://github.com/formbricks/formbricks", "formbricks", "formbricks"],
  ["No-code database SaaS", "https://nocodb.com/", "https://github.com/nocodb/nocodb", "nocodb", "nocodb"],
  ["CRM SaaS", "https://twenty.com/", "https://github.com/twentyhq/twenty", "twenty-crm", "twentyhq"],
  ["Link management SaaS", "https://dub.co/", "https://github.com/dubinc/dub", "dub", "dubinc"],
  ["Document sharing SaaS", "https://www.papermark.com/", "https://github.com/mfts/papermark", "papermark", "papermark-mfts"],
  ["Project management SaaS", "https://plane.so/", "https://github.com/makeplane/plane", "plane", "makeplane"]
].map(([type,target,prov,project,org]) => [type,target,prov,"repository_deployment_mapping",project,org,"The product's official public repository links its maintained human-authored source history to this exact SaaS deployment."]);

const portfolios = [
  ["Designer/developer portfolio", "https://brittanychiang.com/", "https://github.com/bchiang7/v4", "brittany-chiang-v4", "brittany-chiang"],
  ["Developer portfolio", "https://leerob.com/", "https://github.com/leerob/leerob.io", "leerob-portfolio", "lee-robinson"],
  ["Educator/developer portfolio", "https://kentcdodds.com/", "https://github.com/kentcdodds/kentcdodds.com", "kent-c-dodds-site", "kent-c-dodds"],
  ["Designer/developer portfolio", "https://paco.me/", "https://github.com/pacocoursey/paco", "paco-portfolio", "paco-coursey"],
  ["Developer/writer portfolio", "https://www.taniarascia.com/", "https://github.com/taniarascia/taniarascia.com", "tania-rascia-site", "tania-rascia"],
  ["Developer portfolio", "https://antfu.me/", "https://github.com/antfu/antfu.me", "antfu-portfolio", "anthony-fu"],
  ["Developer blog portfolio", "https://overreacted.io/", "https://github.com/gaearon/overreacted.io", "overreacted", "dan-abramov"],
  ["Web standards portfolio", "https://lea.verou.me/", "https://github.com/LeaVerou/leaverou.github.io", "lea-verou-site", "lea-verou"],
  ["Developer/educator portfolio", "https://wesbos.com/", "https://github.com/wesbos/wesbos", "wes-bos-site", "wes-bos"],
  ["Developer portfolio", "https://mxb.dev/", "https://github.com/maxboeck/mxb", "mxb-portfolio", "max-boeck"]
].map(([type,target,prov,project,org]) => [type,target,prov,"repository_deployment_mapping",project,org,"The portfolio's author-owned public repository maps the hand-maintained source and history to this exact personal deployment."]);

const docs = [
  ["Web platform documentation", "https://developer.mozilla.org/", "https://github.com/mdn/content", "mdn-docs", "mdn"],
  ["Framework documentation", "https://react.dev/", "https://github.com/reactjs/react.dev", "react-docs", "reactjs"],
  ["Framework documentation", "https://vuejs.org/", "https://github.com/vuejs/docs", "vue-docs", "vuejs"],
  ["Framework documentation", "https://svelte.dev/docs", "https://github.com/sveltejs/svelte.dev", "svelte-docs", "sveltejs"],
  ["Framework documentation", "https://docs.astro.build/", "https://github.com/withastro/docs", "astro-docs", "withastro"],
  ["Build-tool documentation", "https://vite.dev/", "https://github.com/vitejs/vite", "vite-docs", "vitejs"],
  ["CSS framework documentation", "https://tailwindcss.com/docs", "https://github.com/tailwindlabs/tailwindcss.com", "tailwind-docs", "tailwindlabs"],
  ["Language documentation", "https://www.typescriptlang.org/docs/", "https://github.com/microsoft/TypeScript-Website", "typescript-docs", "microsoft-typescript"],
  ["Language documentation", "https://docs.python.org/3/", "https://github.com/python/cpython", "python-docs", "python"],
  ["Language documentation", "https://doc.rust-lang.org/book/", "https://github.com/rust-lang/book", "rust-book", "rust-lang"]
].map(([type,target,prov,project,org]) => [type,target,prov,"repository_deployment_mapping",project,org,"The official documentation repository exposes a large, multi-contributor human editorial history mapped to this exact public documentation site."]);

const preAi = [
  ["Pre-AI-origin framework site", "https://getbootstrap.com/", "https://github.com/twbs/bootstrap", "bootstrap", "twbs"],
  ["Pre-AI-origin library site", "https://jquery.com/", "https://github.com/jquery/jquery.com", "jquery-site", "jquery"],
  ["Pre-AI-origin visualization site", "https://d3js.org/", "https://github.com/d3/d3", "d3-site", "d3"],
  ["Pre-AI-origin 3D library site", "https://threejs.org/", "https://github.com/mrdoob/three.js", "threejs-site", "threejs"],
  ["Pre-AI-origin mapping site", "https://leafletjs.com/", "https://github.com/Leaflet/Leaflet", "leaflet-site", "leaflet"],
  ["Pre-AI-origin charting site", "https://www.chartjs.org/", "https://github.com/chartjs/Chart.js", "chartjs-site", "chartjs"],
  ["Pre-AI-origin static-site project", "https://gohugo.io/", "https://github.com/gohugoio/hugo", "hugo-site", "gohugoio"],
  ["Pre-AI-origin static-site project", "https://jekyllrb.com/", "https://github.com/jekyll/jekyll", "jekyll-site", "jekyll"],
  ["Pre-AI-origin static-site project", "https://www.11ty.dev/", "https://github.com/11ty/eleventy", "eleventy-site", "11ty"],
  ["Pre-AI-origin open-source product", "https://www.home-assistant.io/", "https://github.com/home-assistant/home-assistant.io", "home-assistant-site", "home-assistant"]
].map(([type,target,prov,project,org]) => [type,target,prov,"repository_deployment_mapping",project,org,"The official repository documents a public human-authored project history beginning before 2021 and maps it to this current deployment."]);

export const holdoutSamples = [
  ...lovable.map((r) => row("AI_LOVABLE", r)),
  ...bolt.map((r) => row("AI_BOLT", r)),
  ...replit.map((r) => row("AI_REPLIT_AGENT", r)),
  ...v0.map((r) => row("AI_V0", r)),
  ...other.map((r) => row("AI_OTHER_AGENTIC", r)),
  ...modern.map((r) => row("HUMAN_MODERN_APP", r)),
  ...saas.map((r) => row("HUMAN_SAAS", r)),
  ...portfolios.map((r) => row("HUMAN_PORTFOLIO_AGENCY", r)),
  ...docs.map((r) => row("HUMAN_CONTENT_DOCS", r)),
  ...preAi.map((r) => row("HUMAN_PRE_AI_SNAPSHOT", r))
];

if (holdoutSamples.length !== 100) throw new Error(`Expected 100 samples, found ${holdoutSamples.length}`);
