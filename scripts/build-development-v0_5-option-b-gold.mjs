import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cutoff = "2022-11-30T00:00:00Z";
const outputDir = path.resolve("outputs/development_v0_5_option_b");
const manifestPaths = [
  "outputs/development_v0_2/vibebench_development_extension_40_v0_2.json",
  "outputs/development_v0_3/vibebench_development_extension_60_v0_3.json",
  "outputs/development_v0_3/vibebench_development_expansion_88_v0_3.json",
  "outputs/development_v0_4/vibebench_development_extension_58_v0_4.json",
  "outputs/development_v0_5/vibebench_development_extension_120_v0_5.json"
];
const historyPath = path.join(outputDir, "human_repository_history_v1.json");
const matrixPath = path.resolve("outputs/development_v0_5/vibebench_development_v0_5_expanded_feature_matrix.json");
const protocolPath = path.join(outputDir, "option_b_protocol_v1.json");

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const sourceTexts = await Promise.all(manifestPaths.map((file) => readFile(path.resolve(file), "utf8")));
const historyText = await readFile(historyPath, "utf8");
const matrixText = await readFile(matrixPath, "utf8");
const protocolText = await readFile(protocolPath, "utf8");
const manifests = sourceTexts.map(JSON.parse);
const history = JSON.parse(historyText);
const matrix = JSON.parse(matrixText);
const protocol = JSON.parse(protocolText);

if (protocol.cutoff !== cutoff) throw new Error("Option-B cutoff mismatch.");
if (history.cutoff !== cutoff) throw new Error("Repository-history cutoff mismatch.");
if (matrix.failed_confirmations_used !== false) throw new Error("Opened confirmation rows are prohibited.");

const samples = manifests.flatMap((manifest, index) => manifest.samples.map((sample) => ({
  ...sample,
  source_manifest: manifestPaths[index]
})));
if (samples.length !== 366 || new Set(samples.map((row) => row.sample_id)).size !== samples.length) {
  throw new Error(`Expected 366 unique Development records, found ${samples.length}.`);
}

const matrixById = new Map(matrix.rows.map((row) => [row.sample_id, row]));
const historyById = new Map(history.records.map((row) => [row.sample_id, row]));
const nativeBuilderGroup = /AI_(?:REPLIT_AGENT|BOLT|NATIVE_BUILDER)_/;
const directProvenanceType = /(?:official_builder_customer_story|public_creator_statement|curated_builder_showcase|independent_hackathon_submission)/;
const substantialCreationClaim = /(?:\bbuilt\b|\bbuilding\b|\bcreated\b|\bgenerated\b|\bvibe-coded\b|\bdevelopment\b)/i;

function classify(sample) {
  const common = {
    sample_id: sample.sample_id,
    original_label: sample.label,
    target_group: sample.target_group,
    target_url: sample.target_url,
    project_family_id: sample.project_family_id,
    builder: sample.builder,
    provenance_type: sample.provenance_type,
    provenance_url: sample.provenance_url,
    provenance_summary: sample.provenance_summary,
    source_manifest: sample.source_manifest,
    technical_scan_available: matrixById.has(sample.sample_id)
  };

  if (sample.label === "AI") {
    if (!nativeBuilderGroup.test(sample.target_group)) {
      return { ...common, option_b_label: "AMBIGUOUS", reason: "assistant_usage_without_documented_builder_first_intensity" };
    }
    if (!directProvenanceType.test(sample.provenance_type || "")) {
      return { ...common, option_b_label: "AMBIGUOUS", reason: "native_builder_only_listed_in_directory_metadata" };
    }
    if (!substantialCreationClaim.test(sample.provenance_summary || "")) {
      return { ...common, option_b_label: "AMBIGUOUS", reason: "native_builder_named_without_substantial_creation_claim" };
    }
    if (!matrixById.has(sample.sample_id)) {
      return { ...common, option_b_label: "AMBIGUOUS", reason: "strong_ai_provenance_but_no_eligible_technical_scan" };
    }
    return { ...common, option_b_label: "STRONG_AI", reason: "mapped_native_builder_with_substantial_creation_claim" };
  }

  const repository = historyById.get(sample.sample_id);
  if (!repository || repository.status !== "OK" || !repository.latest_commit?.created_at) {
    return { ...common, option_b_label: "AMBIGUOUS", reason: "repository_history_unavailable", repository_history: repository || null };
  }
  if (repository.latest_commit.created_at >= cutoff) {
    return { ...common, option_b_label: "AMBIGUOUS", reason: "default_branch_active_on_or_after_cutoff", repository_history: repository };
  }
  if (!matrixById.has(sample.sample_id)) {
    return { ...common, option_b_label: "AMBIGUOUS", reason: "pre_cutoff_repository_but_no_eligible_technical_scan", repository_history: repository };
  }
  return { ...common, option_b_label: "STABLE_HUMAN", reason: "mapped_repository_default_branch_inactive_before_cutoff", repository_history: repository };
}

const seenFamilies = new Set();
const registry = samples.map(classify).map((row) => {
  if (!seenFamilies.has(row.project_family_id)) {
    seenFamilies.add(row.project_family_id);
    return row;
  }
  return { ...row, option_b_label: "AMBIGUOUS", reason: "duplicate_project_family" };
});

const strongAi = registry.filter((row) => row.option_b_label === "STRONG_AI");
const stableHuman = registry.filter((row) => row.option_b_label === "STABLE_HUMAN");
const ambiguous = registry.filter((row) => row.option_b_label === "AMBIGUOUS");
const hardRows = [...strongAi, ...stableHuman].map((record) => {
  const source = matrixById.get(record.sample_id);
  return {
    sample_id: record.sample_id,
    target_group: record.target_group,
    option_b_label: record.option_b_label,
    target: record.option_b_label === "STRONG_AI" ? 1 : 0,
    project_family_id: record.project_family_id,
    features: source.features
  };
});

const sourceHashes = Object.fromEntries([
  ...manifestPaths.map((file, index) => [file, sha256(sourceTexts[index])]),
  [path.relative(process.cwd(), historyPath), sha256(historyText)],
  [path.relative(process.cwd(), matrixPath), sha256(matrixText)],
  [path.relative(process.cwd(), protocolPath), sha256(protocolText)]
]);
const summary = {
  total: registry.length,
  strong_ai: strongAi.length,
  stable_human: stableHuman.length,
  ambiguous: ambiguous.length,
  hard_gold_rows: hardRows.length,
  class_ratio_ai_to_human: stableHuman.length ? strongAi.length / stableHuman.length : null,
  ambiguous_reasons: Object.fromEntries(Object.entries(Object.groupBy(ambiguous, (row) => row.reason)).map(([key, rows]) => [key, rows.length]))
};

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "option_b_label_registry_v1.json"), `${JSON.stringify({
  schema_version: "vibebench.option_b.label_registry.v1",
  generated_at: new Date().toISOString(),
  protocol_sha256: sha256(protocolText),
  selection_used_model_scores: false,
  selection_used_public_surface_features: false,
  source_hashes: sourceHashes,
  summary,
  records: registry
}, null, 2)}\n`);
await writeFile(path.join(outputDir, "option_b_hard_gold_feature_matrix_v1.json"), `${JSON.stringify({
  schema_version: "vibebench.option_b.hard_gold_matrix.v1",
  generated_at: new Date().toISOString(),
  protocol_sha256: sha256(protocolText),
  selection_used_model_scores: false,
  feature_names: matrix.feature_names,
  summary,
  rows: hardRows
}, null, 2)}\n`);

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
