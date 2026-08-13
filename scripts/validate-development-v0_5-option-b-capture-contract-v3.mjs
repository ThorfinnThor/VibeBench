import { readFile } from "node:fs/promises";
import path from "node:path";

const contractPath = path.resolve("outputs/development_v0_5_option_b_v3/option_b_capture_contract_v3.json");
const contract = JSON.parse(await readFile(contractPath, "utf8"));
const requiredStages = ["input_validation", "dns_resolution", "tcp_tls_connection", "http_navigation", "dom_readiness", "rendered_content_eligibility", "computed_style_extraction", "structural_aggregation", "serialization"];
const requiredGroups = ["document", "layout_regions", "visible_elements", "computed_style_properties", "repetition", "public_assets"];

if (contract.status !== "LOCAL_MINIMAL_PILOT_APPROVED") throw new Error("Unexpected v3 contract status.");
if (!contract.execution_gate.pilot_may_execute || contract.execution_gate.full_batch_may_execute_before_pilot_review !== false) throw new Error("Pilot/full-batch execution gate is invalid.");
if (contract.collector_blinding.input_fields.join(",") !== "sample_id,target_url") throw new Error("Collector input is not label-blind.");
if (!contract.collector_blinding.fields_unavailable_to_collector.includes("label") || !contract.collector_blinding.fields_unavailable_to_collector.includes("previous_score")) throw new Error("Collector blinding is incomplete.");
if (contract.viewports.length !== 1 || contract.viewports[0].width !== 1440) throw new Error("Minimal pilot viewport changed.");
for (const stage of requiredStages) if (!contract.attempt_stages.includes(stage)) throw new Error(`Missing attempt stage ${stage}.`);
for (const group of requiredGroups) if (!contract.success_definition.required_capture_groups.includes(group)) throw new Error(`Missing capture group ${group}.`);
for (const prohibited of ["target_url", "hostname", "provenance_url", "project_family_id", "sample_id", "cohort", "direct_builder_badge_or_marker"]) {
  if (!contract.prohibited_model_inputs.includes(prohibited)) throw new Error(`Missing prohibited model input ${prohibited}.`);
}
if (contract.privacy_and_retention.raw_html_persisted || contract.privacy_and_retention.screenshots_created || contract.privacy_and_retention.screenshots_persisted_by_default) throw new Error("Privacy defaults changed.");
if (!contract.success_definition.desktop_only_for_minimal_pilot || !contract.success_definition.partial_capture_is_failure) throw new Error("Technical success definition weakened.");
if (contract.repeat_scan_protocol.runs !== 2 || contract.repeat_scan_protocol.minimum_separation_hours !== 24 || contract.repeat_scan_protocol.maximum_separation_hours !== 72) throw new Error("Repeat-scan protocol changed.");

process.stdout.write(`${JSON.stringify({ contract: path.relative(process.cwd(), contractPath), status: contract.status, stages: contract.attempt_stages.length, outcomes: contract.terminal_outcomes.length, viewports: contract.viewports, capture_groups: requiredGroups }, null, 2)}\n`);
