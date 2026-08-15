import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { aggregateOptionBV4Surface, assertOptionBV4Payload } from "../lib/option-b-v4-capture.mjs";
import { assertPinnedPeer, choosePinnedAddress, parseConnectAuthority, parseHttpProxyTarget } from "../lib/peer-pinned-egress-policy.mjs";

const root = new URL("../", import.meta.url);
const length = (kind = "zero", value = 0) => ({ kind, value });
const style = {
  display: "block", position: "static", font_primary_declared_category: "custom-family", font_fallback_declared_categories: ["generic-sans"],
  font_size: length("px", 16), font_weight: 400, line_height: length("keyword", null), letter_spacing: length("keyword", null), text_align: "start",
  padding_top: length(), padding_right: length(), padding_bottom: length(), padding_left: length(),
  margin_top: length(), margin_right: length(), margin_bottom: length(), margin_left: length(), row_gap: length("keyword", null), column_gap: length("keyword", null),
  border_radius_tl: length(), border_radius_tr: length(), border_radius_br: length(), border_radius_bl: length(), border_width: length(),
  box_shadow_category: "none", opacity: 1, overflow_x: "visible", overflow_y: "visible"
};

function fixture() {
  return {
    document: { viewport_width: 1440, viewport_height: 900, document_width: 1440, document_height: 1200, visible_element_count: 2, visible_element_limit_reached: false, visible_text_character_count: 100, visible_word_count: 20, dom_depth_max: 3, dom_node_count: 5 },
    layout_regions: [{ dom_preorder_index: 1, region_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, visible_child_count: 1 }],
    elements: [
      { dom_preorder_index: 1, parent_preorder_index: 0, tag_category: "region", semantic_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, dom_depth: 2, visible_child_count: 1, interactive: false, structural_signature: "region|main|1|interactive", computed_style: style },
      { dom_preorder_index: 2, parent_preorder_index: 1, tag_category: "interactive", semantic_role: "none", normalized_x: .1, normalized_y: .1, normalized_width: .2, normalized_height: .1, dom_depth: 3, visible_child_count: 0, interactive: true, structural_signature: "interactive|none|1|", computed_style: { ...style, display: "inline-block" } }
    ],
    public_assets: { same_origin_stylesheet_candidates: 1, same_origin_stylesheets_fetched: 1, stylesheet_fetch_outcomes: { readable: 1, inaccessible: 0, capped: 0 }, css_custom_property_names: ["--space"], css_custom_property_value_types: ["length"], font_face_count: 0, media_query_count: 1, container_query_count: 0 }
  };
}

test("peer-pinning policy allows only public standard-port targets and verifies the connected peer", () => {
  assert.deepEqual(parseConnectAuthority("example.com:443"), { hostname: "example.com", port: 443 });
  assert.throws(() => parseConnectAuthority("example.com:8443"), /outside the egress policy/);
  assert.equal(parseHttpProxyTarget("http://example.com/path").hostname, "example.com");
  assert.throws(() => parseHttpProxyTarget("https://example.com/"), /restricted to HTTP port 80/);
  assert.deepEqual(choosePinnedAddress([{ address: "2606:4700:4700::1111", family: 6 }, { address: "1.1.1.1", family: 4 }]), { address: "1.1.1.1", family: 4 });
  assert.throws(() => choosePinnedAddress([{ address: "127.0.0.1", family: 4 }]), /nicht öffentliche/);
  assert.equal(assertPinnedPeer("::ffff:1.1.1.1", "1.1.1.1"), true);
  assert.throws(() => assertPinnedPeer("1.1.1.2", "1.1.1.1"), /does not match/);
});

test("v4 aggregation emits the positive privacy-minimal schema and rejects additions", () => {
  const payload = aggregateOptionBV4Surface(fixture());
  assert.equal(assertOptionBV4Payload(payload), true);
  assert.equal(payload.visible_elements[0].computed_style.line_height.kind, "keyword");
  assert.equal(payload.visible_elements[0].computed_style.line_height.value, null);
  assert.equal(payload.visible_elements[1].interactive, true);
  const contaminated = structuredClone(payload);
  contaminated.visible_elements[0].target_url = "https://example.com";
  assert.throws(() => assertOptionBV4Payload(contaminated), /unexpected or missing fields/);
});

test("v4 contract freezes six-repeat-twenty ordering and confirmation legacy status", async () => {
  const [contract, manifest, previousManifest, release] = await Promise.all([
    readFile(new URL("outputs/development_v0_5_option_b_v4/option_b_capture_contract_v4.json", root), "utf8").then(JSON.parse),
    readFile(new URL("outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json", root), "utf8").then(JSON.parse),
    readFile(new URL("outputs/development_v0_5_option_b_v3/option_b_local_pilot_manifest_v1.json", root), "utf8").then(JSON.parse),
    readFile(new URL("release/v0.4.json", root), "utf8").then(JSON.parse)
  ]);
  assert.equal(contract.execution_gate.six_site_pilot_may_execute, true);
  assert.equal(contract.execution_gate.repeat_required_before_expansion, true);
  assert.equal(contract.execution_gate.maximum_extension_after_repeat_review, 20);
  assert.equal(contract.execution_gate.full_81_site_run_may_execute, false);
  assert.deepEqual(manifest.rows, previousManifest.rows);
  assert.equal(release.confirmation.status, "LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE");
  assert.equal(release.confirmation.currentPerformanceClaim, false);
});

test("v4 compose and workflow enforce the isolated container profile", async () => {
  const [compose, collectorDockerfile, egressDockerfile, dockerignore, workflow, captureSource, seccomp] = await Promise.all([
    readFile(new URL("infra/option-b-v4/compose.yml", root), "utf8"),
    readFile(new URL("infra/option-b-v4/Dockerfile.collector", root), "utf8"),
    readFile(new URL("infra/option-b-v4/Dockerfile.egress", root), "utf8"),
    readFile(new URL(".dockerignore", root), "utf8"),
    readFile(new URL(".github/workflows/option-b-v4-pilot.yml", root), "utf8"),
    readFile(new URL("lib/option-b-v4-capture.mjs", root), "utf8"),
    readFile(new URL("infra/option-b-v4/seccomp_profile.json", root), "utf8").then(JSON.parse)
  ]);
  assert.match(compose, /collector_internal:\n\s+internal: true/);
  assert.match(compose, /image: vibebench-option-b-v4-collector:local/);
  assert.match(compose, /image: vibebench-option-b-v4-egress:local/);
  assert.match(compose, /cap_drop: \[ALL]/g);
  assert.match(compose, /no-new-privileges:true/g);
  assert.match(compose, /seccomp=\.\/seccomp_profile\.json/);
  assert.doesNotMatch(compose, /seccomp=infra\/option-b-v4\/seccomp_profile\.json/);
  assert.match(compose, /read_only: true/g);
  assert.doesNotMatch(compose, /docker\.sock/);
  assert.match(collectorDockerfile, /USER pwuser/);
  assert.match(egressDockerfile, /USER 65532:65532/);
  for (const required of ["!package-lock.json", "!lib/option-b-v4-capture.mjs", "!scripts/run-development-v0_5-option-b-v4-isolated-pilot.mjs", "!infra/option-b-v4/egress-proxy.mjs"]) assert.match(dockerignore, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(seccomp.syscalls[0].comment, "Allow create user namespaces");
  assert.deepEqual(seccomp.syscalls[0].names, ["clone", "setns", "unshare"]);
  const actionRefs = [...workflow.matchAll(/uses:\s*[^@\s]+@([a-f0-9]+)/g)].map((match) => match[1]);
  assert.ok(actionRefs.length >= 3);
  assert.equal(actionRefs.every((value) => value.length === 40), true);
  assert.match(workflow, /env:\n\s+OPTION_B_V4_ARTIFACT_DIR: \$\{\{ github\.workspace \}\}\/pilot-artifacts/);
  assert.doesNotMatch(workflow, /compose\.yml images -q/);
  assert.match(workflow, /docker image inspect --format '\{\{\.Id\}\}' vibebench-option-b-v4-collector:local/);
  assert.match(workflow, /docker image inspect --format '\{\{\.Id\}\}' vibebench-option-b-v4-egress:local/);
  assert.match(workflow, /docker pull --quiet mcr\.microsoft\.com\/playwright:v1\.54\.2-noble/);
  assert.match(workflow, /docker pull --quiet node:22\.13\.0-bookworm-slim/);
  assert.match(workflow, /COLLECTOR_BASE_DIGEST=\$\(docker image inspect/);
  assert.match(workflow, /EGRESS_BASE_DIGEST=\$\(docker image inspect/);
  assert.doesNotMatch(workflow, /BASE_DIGEST=\$\(docker image inspect[^\n]+\)" >>/);
  assert.doesNotMatch(captureSource, /elements\.find\(/);
});
