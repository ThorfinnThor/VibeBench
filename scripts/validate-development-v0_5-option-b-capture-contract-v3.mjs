import { readFile } from "node:fs/promises";
import path from "node:path";

const contractPath = path.resolve("outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json");
const contract = JSON.parse(await readFile(contractPath, "utf8"));
const requiredStages = ["input_validation", "dns_resolution", "tcp_tls_connection", "http_navigation", "dom_readiness", "rendered_content_eligibility", "computed_style_extraction", "visual_structure_extraction", "serialization"];
const requiredGroups = ["document", "layout_regions", "visible_elements", "computed_style_properties", "visual_grid", "repetition", "public_assets"];

if (contract.status !== "PREREGISTERED_EXECUTION_BLOCKED_ON_RUNTIME_DECISION") throw new Error("Unexpected v3 contract status.");
if (contract.execution_gate.may_execute_before_all_true !== false) throw new Error("Execution gate must fail closed.");
if (contract.collector_blinding.input_fields.join(",") !== "sample_id,target_url") throw new Error("Collector input is not label-blind.");
if (!contract.collector_blinding.fields_unavailable_to_collector.includes("label") || !contract.collector_blinding.fields_unavailable_to_collector.includes("previous_score")) throw new Error("Collector blinding is incomplete.");
if (contract.viewports.length !== 2 || contract.viewports[0].width !== 1440 || contract.viewports[1].width !== 390) throw new Error("Fixed viewports changed.");
for (const stage of requiredStages) if (!contract.attempt_stages.includes(stage)) throw new Error(`Missing attempt stage ${stage}.`);
for (const group of requiredGroups) if (!contract.success_definition.required_capture_groups.includes(group)) throw new Error(`Missing capture group ${group}.`);
for (const prohibited of ["target_url", "hostname", "provenance_url", "project_family_id", "sample_id", "cohort", "direct_builder_badge_or_marker"]) {
  if (!contract.prohibited_model_inputs.includes(prohibited)) throw new Error(`Missing prohibited model input ${prohibited}.`);
}
if (contract.privacy_and_retention.raw_html_persisted || contract.privacy_and_retention.screenshots_persisted_by_default || !contract.privacy_and_retention.ephemeral_screenshots_destroyed_after_visual_feature_extraction) throw new Error("Privacy defaults changed.");
if (!contract.success_definition.both_viewports_required || !contract.success_definition.partial_capture_is_failure) throw new Error("Technical success definition weakened.");
if (contract.repeat_scan_protocol.runs !== 2 || contract.repeat_scan_protocol.minimum_separation_hours !== 24 || contract.repeat_scan_protocol.maximum_separation_hours !== 72) throw new Error("Repeat-scan protocol changed.");

process.stdout.write(`${JSON.stringify({ contract: path.relative(process.cwd(), contractPath), status: contract.status, stages: contract.attempt_stages.length, outcomes: contract.terminal_outcomes.length, viewports: contract.viewports, capture_groups: requiredGroups }, null, 2)}\n`);
