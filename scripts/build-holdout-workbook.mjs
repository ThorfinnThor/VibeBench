import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/holdout_v0_1");
const previewDir = process.env.VIBEBENCH_PREVIEW_DIR || "/private/tmp/vibebench-holdout-preview";
const workbookPath = path.join(outputDir, "vibebench_blind_holdout_100_v0_1.xlsx");
const csvPath = path.join(outputDir, "vibebench_blind_holdout_100_v0_1.csv");

const columns = [
  "sample_id", "label", "target_group", "builder", "website_type", "target_url",
  "provenance_url", "provenance_type", "provenance_summary", "source_published_at",
  "collected_at", "deployment_verified_at", "reachability_status", "domain_group",
  "project_group", "organization_group", "development_overlap_check", "domain_overlap_check",
  "provenance_review", "freeze_status", "notes"
];

const aiGroups = [
  ["AI_LOVABLE", "Lovable"],
  ["AI_BOLT", "Bolt"],
  ["AI_REPLIT_AGENT", "Replit Agent"],
  ["AI_V0", "v0"],
  ["AI_OTHER_AGENTIC", "Other agentic/custom"]
];

const humanGroups = [
  ["HUMAN_MODERN_APP", "Modern web app"],
  ["HUMAN_SAAS", "SaaS/product"],
  ["HUMAN_PORTFOLIO_AGENCY", "Portfolio/agency"],
  ["HUMAN_CONTENT_DOCS", "Content/docs"],
  ["HUMAN_PRE_AI_SNAPSHOT", "Pre-AI snapshot"]
];

const rows = [];
for (const [group, builder] of aiGroups) {
  for (let index = 1; index <= 10; index += 1) {
    rows.push([
      `HO-AI-${group.replace("AI_", "").replaceAll("_", "-")}-${String(index).padStart(2, "0")}`,
      "AI", group, builder, "", "", "", "", "", "", "", "", "PENDING", "", "", "",
      "PENDING", "PENDING", "PENDING", "PENDING", ""
    ]);
  }
}
for (const [group, websiteType] of humanGroups) {
  for (let index = 1; index <= 10; index += 1) {
    rows.push([
      `HO-HUM-${group.replace("HUMAN_", "").replaceAll("_", "-")}-${String(index).padStart(2, "0")}`,
      "HUMAN", group, "", websiteType, "", "", "", "", "", "", "", "PENDING", "", "", "",
      "PENDING", "PENDING", "PENDING", "PENDING", ""
    ]);
  }
}

const seededSamples = new Map([
  ["HO-AI-LOVABLE-01", {
    website_type: "Consumer web app / astrology",
    target_url: "https://starmate.love/",
    provenance_url: "https://lovable.dev/blog/mike-burns-ai-filmmaking-studio-platform",
    provenance_type: "official_builder_story",
    provenance_summary: "Lovable's official story quotes the maker saying he built the StarMate astrology app with Lovable and links this exact deployment.",
    source_published_at: "2025-04-15",
    collected_at: "2026-08-09",
    deployment_verified_at: "2026-08-09",
    reachability_status: "REACHABLE",
    domain_group: "starmate.love",
    project_group: "starmate",
    organization_group: "mike-burns-starmate",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Public deployment opened independently; no Development-set match found."
  }],
  ["HO-AI-BOLT-01", {
    website_type: "E-commerce / AI art",
    target_url: "https://framemyhome.ai/",
    provenance_url: "https://bolt.new/blog/how-ceo-built-two-businesses-with-bolt",
    provenance_type: "official_builder_story",
    provenance_summary: "Bolt's official customer story identifies Frame My Home as a live product with Bolt as its primary build environment.",
    source_published_at: "2025-12-15",
    collected_at: "2026-08-09",
    deployment_verified_at: "2026-08-09",
    reachability_status: "REACHABLE",
    domain_group: "framemyhome.ai",
    project_group: "frame-my-home",
    organization_group: "msh-studios-simon-berg",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Public deployment opened independently; no Development-set match found."
  }],
  ["HO-AI-LOVABLE-02", {
    website_type: "Community safety map",
    target_url: "https://safety-sentinel-guard.lovable.app/",
    provenance_url: "https://lovable.dev/blog/2025-01-17-mysafe-x-lovable-hackathon-canada-winner",
    provenance_type: "official_builder_story",
    provenance_summary: "Lovable's official MySafe story names the four-person team, describes the Lovable build process, and links this exact public deployment.",
    source_published_at: "2025-01-17",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "safety-sentinel-guard.lovable.app",
    project_group: "mysafe-safety-scouts",
    organization_group: "mysafe-hackathon-team",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Independent web retrieval returned the intended Safety Scouts deployment; no Development-set target, host, or tenant match found."
  }],
  ["HO-AI-LOVABLE-03", {
    website_type: "AI canvas / creative workspace",
    target_url: "https://magican.lovable.app/",
    provenance_url: "https://lovable.dev/blog/zohar-vanunu-magican-ai-maker",
    provenance_type: "official_builder_story",
    provenance_summary: "Lovable's official profile says Zohar created MagiCan through 1,500 prompts, identifies it as a Lovable project, and links this deployment.",
    source_published_at: "2025-04-06",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "magican.lovable.app",
    project_group: "magican",
    organization_group: "zohar-vanunu-magican",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Independent web retrieval returned the intended MagiCan deployment; no Development-set target, host, or tenant match found."
  }],
  ["HO-AI-LOVABLE-04", {
    website_type: "Interactive 3D experience",
    target_url: "https://kaleidoscope-visionary.lovable.app/",
    provenance_url: "https://lovable.dev/blog/2025-01-20-how-a-developer-advocate-built-stunning-3d-projects-with-lovable-dev-and-won-big",
    provenance_type: "official_builder_story",
    provenance_summary: "Lovable's official maker interview describes Konstantin building the Kaleidoscope 3D environment with Lovable and links this exact deployment.",
    source_published_at: "2025-01-20",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "kaleidoscope-visionary.lovable.app",
    project_group: "kaleidoscope-visionary",
    organization_group: "konstantin-zolozhkov-khvostikk",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Independent web retrieval returned the intended 3D deployment; no Development-set target, host, or tenant match found."
  }],
  ["HO-AI-LOVABLE-05", {
    website_type: "Photo-to-video creator",
    target_url: "https://cherishable.lovable.app/",
    provenance_url: "https://lovable.dev/blog/2025-01-15-lovable-christmas-hackhaton-top-10-projects",
    provenance_type: "official_builder_story",
    provenance_summary: "Lovable's official Christmas Hackathon report identifies Cherishable as a Lovable submission, names its maker, and links this deployment.",
    source_published_at: "2024-12-24",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "cherishable.lovable.app",
    project_group: "cherishable",
    organization_group: "tristanbob-cherishable",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Independent web retrieval returned the intended Cherishable deployment; no Development-set target, host, or tenant match found."
  }],
  ["HO-HUM-MODERN-APP-01", {
    website_type: "Collaborative whiteboard",
    target_url: "https://excalidraw.com/",
    provenance_url: "https://github.com/excalidraw/excalidraw",
    provenance_type: "repository_deployment_mapping",
    provenance_summary: "The official open-source repository explicitly maps its in-repository app source to excalidraw.com and exposes a multi-year, multi-contributor commit history.",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "excalidraw.com",
    project_group: "excalidraw",
    organization_group: "excalidraw-community",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Human control is grounded in auditable public source history and exact deployment mapping, not in the absence of AI-related product features."
  }],
  ["HO-HUM-MODERN-APP-02", {
    website_type: "Diagram editor",
    target_url: "https://mermaid.live/",
    provenance_url: "https://github.com/mermaid-js/mermaid-live-editor",
    provenance_type: "repository_deployment_mapping",
    provenance_summary: "The official Mermaid Live Editor repository links mermaid.live as its live version and documents thousands of public commits and contributors.",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "mermaid.live",
    project_group: "mermaid-live-editor",
    organization_group: "mermaid-js",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Human control is grounded in auditable public source history and exact deployment mapping, not in the absence of AI-related product features."
  }],
  ["HO-HUM-MODERN-APP-03", {
    website_type: "Diagram / whiteboard app",
    target_url: "https://app.diagrams.net/",
    provenance_url: "https://github.com/jgraph/drawio",
    provenance_type: "repository_deployment_mapping",
    provenance_summary: "The official draw.io repository identifies app.diagrams.net as the production deployment and contains the long-running client-side editor source.",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "diagrams.net",
    project_group: "drawio-diagrams-net",
    organization_group: "jgraph-drawio",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Human control is grounded in auditable public source history and exact deployment mapping, not in the absence of AI-related product features."
  }],
  ["HO-HUM-MODERN-APP-04", {
    website_type: "API development web app",
    target_url: "https://hoppscotch.io/",
    provenance_url: "https://github.com/hoppscotch/hoppscotch",
    provenance_type: "repository_deployment_mapping",
    provenance_summary: "Hoppscotch's official open-source monorepo identifies hoppscotch.io as its web demo and documents the maintained web, desktop, and CLI project.",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "hoppscotch.io",
    project_group: "hoppscotch",
    organization_group: "hoppscotch",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Human control is grounded in auditable public source history and exact deployment mapping, not in the absence of AI-related product features."
  }],
  ["HO-HUM-MODERN-APP-05", {
    website_type: "Collaborative design tool",
    target_url: "https://design.penpot.app/",
    provenance_url: "https://github.com/penpot/penpot",
    provenance_type: "repository_deployment_mapping",
    provenance_summary: "Penpot's official open-source repository documents the maintained collaborative design platform whose public SaaS deployment is served at design.penpot.app.",
    collected_at: "2026-08-10",
    deployment_verified_at: "2026-08-10",
    reachability_status: "REACHABLE",
    domain_group: "penpot.app",
    project_group: "penpot",
    organization_group: "kaleidos-penpot",
    development_overlap_check: "PASS",
    domain_overlap_check: "PASS",
    provenance_review: "PASS",
    freeze_status: "READY",
    notes: "Human control is grounded in auditable public source history and exact deployment mapping, not in the absence of AI-related product features."
  }]
]);

for (const row of rows) {
  const seed = seededSamples.get(row[0]);
  if (!seed) continue;
  for (const [field, value] of Object.entries(seed)) row[columns.indexOf(field)] = value;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");
const samples = workbook.worksheets.add("Samples");
const protocol = workbook.worksheets.add("Protocol");
const lists = workbook.worksheets.add("Lists");

overview.showGridLines = false;
samples.showGridLines = false;
protocol.showGridLines = false;
lists.showGridLines = false;

overview.getRange("A1:F1").merge();
overview.getRange("A1").values = [["VibeBench Blind Holdout 100 · v0.1"]];
overview.getRange("A2:F2").merge();
overview.getRange("A2").values = [["Acquisition tracker · labels and provenance are frozen before scanner evaluation"]];
overview.getRange("A4:B12").values = [
  ["KPI", "Value"],
  ["Target slots", null],
  ["Targets reviewed", null],
  ["Provenance reviewed", null],
  ["Reachable", null],
  ["Freeze-ready", null],
  ["AI ready", null],
  ["Human ready", null],
  ["Leakage failures", null]
];
overview.getRange("B5").formulas = [["=COUNTA('Samples'!A2:A101)"]];
overview.getRange("B6").formulas = [["=COUNTIF('Samples'!M2:M101,\"REACHABLE\")+COUNTIF('Samples'!M2:M101,\"FAILED\")+COUNTIF('Samples'!M2:M101,\"RETRY\")"]];
overview.getRange("B7").formulas = [["=COUNTIF('Samples'!S2:S101,\"PASS\")+COUNTIF('Samples'!S2:S101,\"FAIL\")"]];
overview.getRange("B8").formulas = [["=COUNTIF('Samples'!M2:M101,\"REACHABLE\")"]];
overview.getRange("B9").formulas = [["=COUNTIF('Samples'!T2:T101,\"READY\")"]];
overview.getRange("B10").formulas = [["=COUNTIFS('Samples'!B2:B101,\"AI\",'Samples'!T2:T101,\"READY\")"]];
overview.getRange("B11").formulas = [["=COUNTIFS('Samples'!B2:B101,\"HUMAN\",'Samples'!T2:T101,\"READY\")"]];
overview.getRange("B12").formulas = [["=COUNTIF('Samples'!Q2:Q101,\"FAIL\")+COUNTIF('Samples'!R2:R101,\"FAIL\")"]];

const groupLabels = [...aiGroups.map(([group]) => group), ...humanGroups.map(([group]) => group)];
overview.getRange("A15:D25").values = [["Target group", "Slots", "Targets reviewed", "Freeze-ready"], ...groupLabels.map((group) => [group, 10, null, null])];
for (let row = 16; row <= 25; row += 1) {
  overview.getRange(`C${row}`).formulas = [[`=COUNTIFS('Samples'!C2:C101,A${row},'Samples'!M2:M101,"REACHABLE")+COUNTIFS('Samples'!C2:C101,A${row},'Samples'!M2:M101,"FAILED")+COUNTIFS('Samples'!C2:C101,A${row},'Samples'!M2:M101,"RETRY")`]];
  overview.getRange(`D${row}`).formulas = [[`=COUNTIFS('Samples'!C2:C101,A${row},'Samples'!T2:T101,"READY")`]];
}
overview.getRange("A28:F28").merge();
overview.getRange("A28").values = [["Freeze gate"]];
overview.getRange("A29:F31").merge();
overview.getRange("A29").values = [["Do not run the scanner on this holdout until all 100 rows are complete, leakage checks pass, provenance is reviewed, the manifest hash is written, and the scanner commit is fixed."]];

samples.getRange("A1:U101").values = [columns, ...rows];
samples.getRange("T2").formulas = [["=IF(AND(E2<>\"\",F2<>\"\",G2<>\"\",H2<>\"\",I2<>\"\",K2<>\"\",L2<>\"\",M2=\"REACHABLE\",N2<>\"\",O2<>\"\",Q2=\"PASS\",R2=\"PASS\",S2=\"PASS\"),\"READY\",\"PENDING\")"]];
samples.getRange("T2:T101").fillDown();
samples.freezePanes.freezeRows(1);
samples.freezePanes.freezeColumns(5);
samples.tables.add("A1:U101", true, "HoldoutSamples");

samples.getRange("B2:B101").dataValidation = { rule: { type: "list", values: ["AI", "HUMAN"] } };
samples.getRange("H2:H101").dataValidation = { rule: { type: "list", values: ["official_builder_story", "maker_statement", "repository_deployment_mapping", "archived_pre_ai_snapshot", "independent_project_record", "other_reviewed"] } };
samples.getRange("M2:M101").dataValidation = { rule: { type: "list", values: ["PENDING", "REACHABLE", "FAILED", "RETRY"] } };
for (const column of ["Q", "R", "S"]) {
  samples.getRange(`${column}2:${column}101`).dataValidation = { rule: { type: "list", values: ["PENDING", "PASS", "FAIL"] } };
}
samples.getRange("M2:M101").conditionalFormats.add("containsText", { text: "FAILED", format: { fill: "#FEE2E2", font: { color: "#991B1B", bold: true } } });
samples.getRange("Q2:S101").conditionalFormats.add("containsText", { text: "FAIL", format: { fill: "#FEE2E2", font: { color: "#991B1B", bold: true } } });
samples.getRange("T2:T101").conditionalFormats.add("containsText", { text: "READY", format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } } });

protocol.getRange("A1:D1").merge();
protocol.getRange("A1").values = [["Holdout protocol and field guide"]];
protocol.getRange("A3:D10").values = [
  ["Rule", "Requirement", "Reason", "Gate"],
  ["No development overlap", "Target URL and deployment must be absent from the existing 52-URL set", "Prevents tuning leakage", "development_overlap_check = PASS"],
  ["No domain/project overlap", "No related domain, clone, project or organization across Development and Holdout", "Prevents family leakage", "domain_overlap_check = PASS"],
  ["Independent provenance", "Provenance URL must be separate from the scanned target URL", "Prevents label extraction from target", "provenance_review = PASS"],
  ["Concrete deployment mapping", "Evidence must refer to this exact website or project deployment", "Avoids directory-level proxy labels", "provenance_review = PASS"],
  ["Reachability", "Public HTTPS target completes the pre-freeze reachability check", "Avoids technical errors dominating the holdout", "reachability_status = REACHABLE"],
  ["Freeze before evaluation", "Manifest hash and scanner commit fixed before reading verdicts", "Preserves blind evaluation", "all rows READY"],
  ["No post-open tuning", "Any rule change after results requires a new holdout", "Prevents reusing the test set", "new scanner version"]
];
protocol.getRange("A13:C34").values = [
  ["Field", "Meaning", "Required for freeze"],
  ["sample_id", "Stable unique holdout identifier", "yes"],
  ["label", "AI or HUMAN Ground Truth", "yes"],
  ["target_group", "Preallocated sampling stratum", "yes"],
  ["builder", "AI builder/tool where applicable", "AI only"],
  ["website_type", "Matching bucket for site type", "yes"],
  ["target_url", "Exact public URL that will be scanned", "yes"],
  ["provenance_url", "Independent evidence source", "yes"],
  ["provenance_type", "Controlled evidence category", "yes"],
  ["provenance_summary", "Short audit summary; do not paste long quotes", "yes"],
  ["source_published_at", "Publication date where available", "recommended"],
  ["collected_at", "Acquisition date", "yes"],
  ["deployment_verified_at", "Last reachability verification", "yes"],
  ["reachability_status", "PENDING, REACHABLE, FAILED or RETRY", "yes"],
  ["domain_group", "eTLD+1; for multi-tenant hosting use the tenant hostname", "yes"],
  ["project_group", "Stable project/clone family", "yes"],
  ["organization_group", "Maker/company/organization family", "recommended"],
  ["development_overlap_check", "PASS only after comparison with Development set", "yes"],
  ["domain_overlap_check", "PASS only after domain/project/org review", "yes"],
  ["provenance_review", "PASS only after evidence review", "yes"],
  ["freeze_status", "Formula-derived READY or PENDING", "yes"],
  ["notes", "Compact exceptions and review notes", "optional"]
];

lists.getRange("A1:D8").values = [
  ["Reachability", "Review", "Provenance type", "Label"],
  ["PENDING", "PENDING", "official_builder_story", "AI"],
  ["REACHABLE", "PASS", "maker_statement", "HUMAN"],
  ["FAILED", "FAIL", "repository_deployment_mapping", ""],
  ["RETRY", "", "archived_pre_ai_snapshot", ""],
  ["", "", "independent_project_record", ""],
  ["", "", "other_reviewed", ""],
  ["", "", "", ""]
];

const titleFormat = { fill: "#111111", font: { bold: true, color: "#FFFFFF", size: 18 }, verticalAlignment: "center" };
overview.getRange("A1:F1").format = titleFormat;
overview.getRange("A2:F2").format = { fill: "#D8FF3E", font: { color: "#111111", italic: true } };
overview.getRange("A4:B4").format = { fill: "#2563EB", font: { bold: true, color: "#FFFFFF" } };
overview.getRange("A15:D15").format = { fill: "#2563EB", font: { bold: true, color: "#FFFFFF" } };
overview.getRange("A28:F28").format = { fill: "#111111", font: { bold: true, color: "#FFFFFF" } };
overview.getRange("A29:F31").format = { fill: "#FFF7CC", font: { color: "#553C00" }, wrapText: true, verticalAlignment: "top" };
overview.getRange("B5:B12").format.numberFormat = "0";

samples.getRange("A1:U1").format = { fill: "#111111", font: { bold: true, color: "#FFFFFF" }, wrapText: true, verticalAlignment: "center" };
samples.getRange("J2:L101").format.numberFormat = "yyyy-mm-dd";
samples.getRange("A2:U101").format.verticalAlignment = "top";
samples.getRange("E2:U101").format.wrapText = true;

protocol.getRange("A1:D1").format = titleFormat;
protocol.getRange("A3:D3").format = { fill: "#2563EB", font: { bold: true, color: "#FFFFFF" } };
protocol.getRange("A13:C13").format = { fill: "#2563EB", font: { bold: true, color: "#FFFFFF" } };
protocol.getRange("A3:D34").format.wrapText = true;
lists.getRange("A1:D1").format = { fill: "#111111", font: { bold: true, color: "#FFFFFF" } };

overview.getRange("A1:F31").format.autofitColumns();
overview.getRange("A1:F31").format.autofitRows();
overview.getRange("A:A").format.columnWidth = 31;
overview.getRange("B:D").format.columnWidth = 16;
overview.getRange("E:F").format.columnWidth = 12;
overview.getRange("A1").format.rowHeight = 32;
overview.getRange("A29:F31").format.rowHeight = 34;

samples.getRange("A1:U101").format.autofitColumns();
samples.getRange("A:A").format.columnWidth = 28;
samples.getRange("B:D").format.columnWidth = 19;
samples.getRange("E:E").format.columnWidth = 20;
samples.getRange("F:G").format.columnWidth = 34;
samples.getRange("H:H").format.columnWidth = 28;
samples.getRange("I:I").format.columnWidth = 38;
samples.getRange("J:L").format.columnWidth = 15;
samples.getRange("M:T").format.columnWidth = 20;
samples.getRange("U:U").format.columnWidth = 32;
samples.getRange("1:1").format.rowHeight = 42;

protocol.getRange("A1:D34").format.autofitColumns();
protocol.getRange("A:A").format.columnWidth = 28;
protocol.getRange("B:B").format.columnWidth = 52;
protocol.getRange("C:C").format.columnWidth = 34;
protocol.getRange("D:D").format.columnWidth = 32;
protocol.getRange("A1:D34").format.autofitRows();
lists.getRange("A1:D8").format.autofitColumns();

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
await fs.writeFile(csvPath, csv, "utf8");

const overviewPreview = await workbook.render({ sheetName: "Overview", range: "A1:F31", scale: 1.5, format: "png" });
await fs.writeFile(path.join(previewDir, "overview.png"), new Uint8Array(await overviewPreview.arrayBuffer()));
const samplesPreview = await workbook.render({ sheetName: "Samples", range: "A1:U12", scale: 1, format: "png" });
await fs.writeFile(path.join(previewDir, "samples.png"), new Uint8Array(await samplesPreview.arrayBuffer()));
const humanSamplesPreview = await workbook.render({ sheetName: "Samples", range: "A51:U57", scale: 1, format: "png" });
await fs.writeFile(path.join(previewDir, "human-samples.png"), new Uint8Array(await humanSamplesPreview.arrayBuffer()));
const protocolPreview = await workbook.render({ sheetName: "Protocol", range: "A1:D34", scale: 1.25, format: "png" });
await fs.writeFile(path.join(previewDir, "protocol.png"), new Uint8Array(await protocolPreview.arrayBuffer()));
const listsPreview = await workbook.render({ sheetName: "Lists", range: "A1:D8", scale: 1.5, format: "png" });
await fs.writeFile(path.join(previewDir, "lists.png"), new Uint8Array(await listsPreview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(workbookPath);

const overviewCheck = await workbook.inspect({ kind: "table", range: "Overview!A1:F31", include: "values,formulas", tableMaxRows: 31, tableMaxCols: 6, maxChars: 12000 });
const sampleCheck = await workbook.inspect({ kind: "table", range: "Samples!A1:U6", include: "values,formulas", tableMaxRows: 6, tableMaxCols: 21, maxChars: 12000 });
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan", maxChars: 4000 });

const exportedInput = await FileBlob.load(workbookPath);
const exportedWorkbook = await SpreadsheetFile.importXlsx(exportedInput);
const exportedOverviewCheck = await exportedWorkbook.inspect({ kind: "table", range: "Overview!A4:D25", include: "values,formulas", tableMaxRows: 22, tableMaxCols: 4, maxChars: 8000 });
const exportedHumanCheck = await exportedWorkbook.inspect({ kind: "table", range: "Samples!A52:U56", include: "values,formulas", tableMaxRows: 5, tableMaxCols: 21, maxChars: 10000 });
const exportedErrors = await exportedWorkbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "exported formula error scan", maxChars: 4000 });
const exportedOverviewPreview = await exportedWorkbook.render({ sheetName: "Overview", range: "A1:F31", scale: 1.5, format: "png" });
await fs.writeFile(path.join(previewDir, "exported-overview.png"), new Uint8Array(await exportedOverviewPreview.arrayBuffer()));
const exportedHumanPreview = await exportedWorkbook.render({ sheetName: "Samples", range: "A51:U57", scale: 1, format: "png" });
await fs.writeFile(path.join(previewDir, "exported-human-samples.png"), new Uint8Array(await exportedHumanPreview.arrayBuffer()));

process.stdout.write(`${overviewCheck.ndjson}\n${sampleCheck.ndjson}\n${errors.ndjson}\n${exportedOverviewCheck.ndjson}\n${exportedHumanCheck.ndjson}\n${exportedErrors.ndjson}\n`);
process.stdout.write(`Wrote ${workbookPath}\nWrote ${csvPath}\n`);
await fs.rm(`${workbookPath}.inspect.ndjson`, { force: true });
