import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { developmentSamplesV02 } from "../data/development-samples-v0_2.mjs";

const outputDir = path.resolve("outputs/development_v0_2");
const outputPath = path.join(outputDir, "vibebench_development_extension_40_v0_2.json");
const groups = [
  { group: "AI_REPLIT_AGENT_NEW", prefix: "DEV2-AI-REPLIT", label: "AI", builder: "Replit Agent", websiteType: "Modern web app" },
  { group: "AI_BOLT_NEW", prefix: "DEV2-AI-BOLT", label: "AI", builder: "Bolt", websiteType: "Modern web app" },
  { group: "HUMAN_MODERN_SAAS_NEW", prefix: "DEV2-HUM-SAAS", label: "HUMAN", builder: "", websiteType: "Modern SaaS/product" },
  { group: "HUMAN_MODERN_APP_NEW", prefix: "DEV2-HUM-APP", label: "HUMAN", builder: "", websiteType: "Modern interactive web app" }
];

const slots = groups.flatMap((definition) => Array.from({ length: 10 }, (_, index) => ({
  sample_id: `${definition.prefix}-${String(index + 1).padStart(2, "0")}`,
  label: definition.label,
  target_group: definition.group,
  builder: definition.builder,
  website_type: definition.websiteType,
  target_url: "",
  provenance_url: "",
  provenance_type: "",
  provenance_summary: "",
  project_family_id: "",
  collected_at: "",
  development_overlap_check: "PENDING",
  holdout_overlap_check: "PENDING",
  provenance_review: "PENDING",
  independence_review: "PENDING",
  status: "PENDING",
  notes: ""
})));

const offsets = new Map();
for (const sample of developmentSamplesV02) {
  const offset = offsets.get(sample.group) || 0;
  const groupSlots = slots.filter((slot) => slot.target_group === sample.group);
  const slot = groupSlots[offset];
  if (!slot) throw new Error(`No free slot ${offset + 1} for ${sample.group}.`);
  const { group, ...values } = sample;
  Object.assign(slot, values);
  offsets.set(group, offset + 1);
}

const manifest = {
  schemaVersion: "v0.2-development-extension",
  generatedAt: "2026-08-10",
  purpose: "Development-only acquisition set; may be used for v0.2 research, never as independent validation.",
  targetCount: 40,
  groups: Object.fromEntries(groups.map((group) => [group.group, 10])),
  samples: slots
};
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`Wrote ${path.relative(process.cwd(), outputPath)} with ${slots.filter((row) => row.status === "READY").length}/40 READY rows.\n`);
