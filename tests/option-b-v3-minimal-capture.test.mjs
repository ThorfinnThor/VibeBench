import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveLocalChromiumRuntime } from "../lib/local-chromium-runtime.mjs";
import { aggregateRenderedSurface, assertMinimalPilotPrivacy } from "../lib/option-b-v3-minimal-capture.mjs";

test("v3 minimal aggregation hashes structural and style signatures without page text", () => {
  const raw = {
    document: { visible_element_count: 2, visible_text_character_count: 20 },
    layout_regions: [{ dom_preorder_index: 1, region_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, visible_child_count: 1 }],
    elements: [
      { dom_preorder_index: 1, parent_preorder_index: 0, tag_category: "region", semantic_role: "main", normalized_x: 0, normalized_y: 0, normalized_width: 1, normalized_height: 1, dom_depth: 2, visible_child_count: 1, interactive: false, structural_signature: "region|main|1|text", computed_style: { display: "block", font_size_px: 16, border_radius_tl_px: 0 } },
      { dom_preorder_index: 2, parent_preorder_index: 1, tag_category: "text", semantic_role: "none", normalized_x: .1, normalized_y: .1, normalized_width: .8, normalized_height: .1, dom_depth: 3, visible_child_count: 0, interactive: false, structural_signature: "text|none|1|", computed_style: { display: "block", font_size_px: 16, border_radius_tl_px: 0 } }
    ],
    public_assets: { same_origin_stylesheet_candidates: 0, same_origin_stylesheets_readable: 0, css_custom_property_names: ["--primary"], font_face_count: 0, media_query_count: 0, container_query_count: 0 }
  };
  const result = aggregateRenderedSurface(raw);
  assert.match(result.visible_elements[0].structural_signature_hash, /^[a-f0-9]{64}$/);
  assert.match(result.visible_elements[0].computed_style_signature_hash, /^[a-f0-9]{64}$/);
  assert.match(result.public_assets.css_custom_property_name_hashes[0], /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result).includes("--primary"), false);
  assert.equal(JSON.stringify(result).includes("region|main|1|text"), false);
});

test("v3 pilot manifest exposes only sample id and target URL to the collector", async () => {
  const manifest = JSON.parse(await readFile(new URL("../outputs/development_v0_5_option_b_v3/option_b_local_pilot_manifest_v1.json", import.meta.url), "utf8"));
  assert.equal(manifest.status, "LABEL_BLIND_TECHNICAL_PILOT_ONLY");
  assert.equal(manifest.selection.selected, 6);
  assert.equal(manifest.selection.labels_inspected, false);
  assert.deepEqual(manifest.collector_visible_fields, ["sample_id", "target_url"]);
  assert.equal(manifest.rows.every((row) => Object.keys(row).sort().join(",") === "sample_id,target_url"), true);
});

test("v3 runtime fails closed instead of silently selecting a changing system browser", async () => {
  await assert.rejects(resolveLocalChromiumRuntime({ configuredPath: "/does/not/exist", bundledPath: "/also/missing", allowSystem: false }), /Kein freigegebener lokaler Chromium-Browser/);
});

test("v3 privacy boundary rejects URLs, labels, text bodies and screenshots", () => {
  assert.equal(assertMinimalPilotPrivacy({ captures: [{ sample_id: "PILOT-1", payload: { document: { visible_text_character_count: 120 } } }] }), true);
  for (const forbidden of [{ target_url: "https://example.com" }, { label: "AI" }, { visible_text: "page copy" }, { screenshot: "bytes" }]) {
    assert.throws(() => assertMinimalPilotPrivacy({ captures: [forbidden] }), /Prohibited persisted field/);
  }
});
