import { ALL_FEATURES, buildV03FeatureMap } from "./development-v0_3-candidate.mjs";
import { V05_METRICS } from "./development-v0_5-page-scan.mjs";

const PRESENCE_METRICS = [
  "mui_fingerprints", "chakra_fingerprints", "mantine_fingerprints", "bootstrap_fingerprints", "antd_fingerprints", "daisyui_fingerprints", "headlessui_fingerprints", "heroicons_fingerprints", "fontawesome_fingerprints", "phosphor_fingerprints", "magicui_fingerprints", "aceternity_fingerprints",
  "webpack_fingerprints", "turbopack_fingerprints", "astro_fingerprints", "svelte_fingerprints", "vue_fingerprints", "source_map_refs"
];
export const V05_RATIO_FEATURES = [
  "v05-ratio:seo_completeness", "v05-ratio:semantic_content_per_dom", "v05-ratio:cta_per_words", "v05-ratio:marketing_cliches_per_words",
  "v05-ratio:responsive_per_class", "v05-ratio:gradient_per_class", "v05-ratio:rounding_per_class", "v05-ratio:animation_per_class",
  "v05-ratio:library_diversity", "v05-ratio:css_asset_share", "v05-ratio:script_asset_share"
];
export const V05_FEATURES = [
  ...ALL_FEATURES,
  ...V05_METRICS.map((name) => `v05:${name}`),
  ...PRESENCE_METRICS.map((name) => `v05-present:${name}`),
  ...V05_RATIO_FEATURES
];

const ratio = (numerator, denominator) => Number(numerator || 0) / Math.max(1, Number(denominator || 0));
export function buildV05FeatureMap(row) {
  const features = buildV03FeatureMap(row);
  const v = row.v0_5_metrics;
  const p = row.page_metrics;
  const e = row.extended_metrics;
  for (const name of V05_METRICS) features[`v05:${name}`] = Math.log1p(Number(v[name] || 0));
  for (const name of PRESENCE_METRICS) features[`v05-present:${name}`] = Number(v[name] || 0) > 0 ? 1 : 0;
  const seoSignals = [v.title_chars, v.meta_description_chars, v.canonical_links, v.open_graph_tags, v.twitter_card_tags, v.favicon_links].filter((value) => Number(value || 0) > 0).length;
  const librarySignals = PRESENCE_METRICS.slice(0, 12).filter((name) => Number(v[name] || 0) > 0).length;
  const totalAssetBytes = Number(v.css_asset_bytes || 0) + Number(v.script_asset_bytes || 0);
  features["v05-ratio:seo_completeness"] = seoSignals / 6;
  features["v05-ratio:semantic_content_per_dom"] = ratio(v.main_tags + v.article_tags + v.ordered_lists + v.unordered_lists + v.blockquotes + v.details_tags, p.dom_tags);
  features["v05-ratio:cta_per_words"] = ratio(v.cta_phrases, e.visible_words);
  features["v05-ratio:marketing_cliches_per_words"] = ratio(v.marketing_cliche_phrases, e.visible_words);
  features["v05-ratio:responsive_per_class"] = ratio(v.responsive_class_tokens, p.class_tokens);
  features["v05-ratio:gradient_per_class"] = ratio(v.gradient_class_tokens, p.class_tokens);
  features["v05-ratio:rounding_per_class"] = ratio(v.large_rounding_tokens, p.class_tokens);
  features["v05-ratio:animation_per_class"] = ratio(v.animation_class_tokens, p.class_tokens);
  features["v05-ratio:library_diversity"] = librarySignals / 12;
  features["v05-ratio:css_asset_share"] = ratio(v.css_asset_bytes, totalAssetBytes);
  features["v05-ratio:script_asset_share"] = ratio(v.script_asset_bytes, totalAssetBytes);
  for (const name of V05_FEATURES) if (!Number.isFinite(features[name])) throw new Error(`Invalid v0.5 feature ${name} for ${row.sample_id}.`);
  return features;
}
