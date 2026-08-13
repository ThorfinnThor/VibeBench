export const OPTION_B_SOURCE_FEATURES = [
  "animation_classes", "arbitrary_classes", "aria", "article", "blur_classes",
  "buttons", "canonical", "canvases", "class_tokens", "cliches", "cta",
  "dark_classes", "data_attrs", "divs", "dom_tags", "faq", "favicon",
  "footers", "forms", "gradient_classes", "headings", "hover_classes",
  "html_chars", "images", "inputs", "jsonld", "labels", "list_items",
  "lists", "main", "meta", "modules", "navs", "og", "paragraphs",
  "pricing", "responsive_classes", "rounded_classes", "scripts", "sections",
  "shadow_classes", "stylesheets", "svgs", "tables", "tailwind_tokens",
  "testimonials", "text_chars", "twitter", "unique_classes", "videos", "words"
];

export const OPTION_B_EXCLUDED_SOURCE_FEATURES = {
  direct_builder_or_tool_markers: ["bolt", "lovable", "replit", "v0"],
  framework_or_library_markers: ["framer", "lucide", "nextjs", "radix", "react", "shadcn", "tailwind", "vite"],
  unused_sparse_structure_counts: ["details", "dialogs", "emoji", "spans"]
};

export const OPTION_B_VISIBLE_FEATURE_DEFINITIONS = [
  ["class_reuse_ratio", "style_system", "1 - min(1, unique_classes / class_tokens)"],
  ["class_density", "style_system", "log1p(class_tokens / dom_tags)"],
  ["tailwind_token_share", "style_system", "min(1, tailwind_tokens / class_tokens)"],
  ["responsive_token_share", "style_system", "min(1, responsive_classes / class_tokens)"],
  ["interaction_token_share", "style_system", "min(1, (hover_classes + animation_classes) / class_tokens)"],
  ["effect_token_share", "style_system", "min(1, (gradient_classes + blur_classes + shadow_classes) / class_tokens)"],
  ["rounding_token_share", "style_system", "min(1, rounded_classes / class_tokens)"],
  ["style_pattern_breadth", "style_system", "positive(responsive, hover, animation, gradient, blur, rounded, shadow, dark) / 8"],
  ["data_attribute_density", "structure", "min(1, data_attrs / dom_tags)"],
  ["aria_density", "structure", "min(1, aria / dom_tags)"],
  ["semantic_landmark_density", "structure", "min(1, (main + navs + footers + article + sections) / dom_tags)"],
  ["semantic_pattern_breadth", "structure", "positive(main, navs, footers, article, sections, lists, forms, tables) / 8"],
  ["section_density", "structure", "min(1, sections / dom_tags)"],
  ["div_share", "structure", "min(1, divs / dom_tags)"],
  ["content_structure_density", "content", "min(1, (headings + paragraphs + lists + list_items) / dom_tags)"],
  ["list_item_depth", "content", "min(1, list_items / (10 * max(1, lists)))"],
  ["words_per_dom", "content", "log1p(words / dom_tags)"],
  ["visible_text_share", "content", "min(1, text_chars / html_chars)"],
  ["heading_word_share", "content", "min(1, headings / words)"],
  ["cta_word_share", "content", "min(1, cta / words)"],
  ["marketing_pattern_share", "content", "min(1, (cliches + faq + pricing + testimonials) / words)"],
  ["form_label_coverage", "quality", "inputs > 0 ? min(1, labels / inputs) : 0"],
  ["vector_asset_share", "assets", "svgs / (svgs + images), or 0 when both are absent"],
  ["media_density", "assets", "min(1, (images + svgs + videos + canvases) / dom_tags)"],
  ["metadata_density", "quality", "min(1, meta / dom_tags)"],
  ["seo_pattern_coverage", "quality", "positive(canonical, favicon, og, twitter, jsonld) / 5"],
  ["module_script_share", "delivery", "min(1, modules / scripts)"],
  ["stylesheet_resource_share", "delivery", "stylesheets / (stylesheets + scripts), or 0 when both are absent"]
].map(([name, group, formula]) => ({ name, group, formula }));

export const OPTION_B_VISIBLE_FEATURE_NAMES = OPTION_B_VISIBLE_FEATURE_DEFINITIONS.map(({ name }) => name);

const count = (features, name) => Math.max(0, Math.expm1(Number(features[name] || 0)));
const ratio = (numerator, denominator) => numerator / Math.max(1, denominator);
const share = (numerator, denominator) => denominator > 0 ? numerator / denominator : 0;
const unit = (value) => Math.max(0, Math.min(1, value));
const positiveShare = (values) => values.filter((value) => value > 0).length / values.length;

export function buildOptionBVisibleFeatures(source) {
  for (const name of OPTION_B_SOURCE_FEATURES) {
    if (!Number.isFinite(source[name])) throw new Error(`Missing or invalid Option-B source feature: ${name}`);
  }

  const c = (name) => count(source, name);
  const classTokens = c("class_tokens");
  const domTags = c("dom_tags");
  const words = c("words");
  const lists = c("lists");
  const scripts = c("scripts");
  const stylesheets = c("stylesheets");
  const images = c("images");
  const svgs = c("svgs");
  const inputs = c("inputs");
  const stylePatterns = ["responsive_classes", "hover_classes", "animation_classes", "gradient_classes", "blur_classes", "rounded_classes", "shadow_classes", "dark_classes"].map(c);
  const semanticPatterns = ["main", "navs", "footers", "article", "sections", "lists", "forms", "tables"].map(c);

  const features = {
    class_reuse_ratio: 1 - unit(ratio(c("unique_classes"), classTokens)),
    class_density: Math.log1p(ratio(classTokens, domTags)),
    tailwind_token_share: unit(ratio(c("tailwind_tokens"), classTokens)),
    responsive_token_share: unit(ratio(c("responsive_classes"), classTokens)),
    interaction_token_share: unit(ratio(c("hover_classes") + c("animation_classes"), classTokens)),
    effect_token_share: unit(ratio(c("gradient_classes") + c("blur_classes") + c("shadow_classes"), classTokens)),
    rounding_token_share: unit(ratio(c("rounded_classes"), classTokens)),
    style_pattern_breadth: positiveShare(stylePatterns),
    data_attribute_density: unit(ratio(c("data_attrs"), domTags)),
    aria_density: unit(ratio(c("aria"), domTags)),
    semantic_landmark_density: unit(ratio(c("main") + c("navs") + c("footers") + c("article") + c("sections"), domTags)),
    semantic_pattern_breadth: positiveShare(semanticPatterns),
    section_density: unit(ratio(c("sections"), domTags)),
    div_share: unit(ratio(c("divs"), domTags)),
    content_structure_density: unit(ratio(c("headings") + c("paragraphs") + lists + c("list_items"), domTags)),
    list_item_depth: unit(c("list_items") / (10 * Math.max(1, lists))),
    words_per_dom: Math.log1p(ratio(words, domTags)),
    visible_text_share: unit(ratio(c("text_chars"), c("html_chars"))),
    heading_word_share: unit(ratio(c("headings"), words)),
    cta_word_share: unit(ratio(c("cta"), words)),
    marketing_pattern_share: unit(ratio(c("cliches") + c("faq") + c("pricing") + c("testimonials"), words)),
    form_label_coverage: inputs > 0 ? unit(c("labels") / inputs) : 0,
    vector_asset_share: share(svgs, svgs + images),
    media_density: unit(ratio(images + svgs + c("videos") + c("canvases"), domTags)),
    metadata_density: unit(ratio(c("meta"), domTags)),
    seo_pattern_coverage: positiveShare([c("canonical"), c("favicon"), c("og"), c("twitter"), c("jsonld")]),
    module_script_share: unit(ratio(c("modules"), scripts)),
    stylesheet_resource_share: share(stylesheets, stylesheets + scripts)
  };

  for (const name of OPTION_B_VISIBLE_FEATURE_NAMES) {
    if (!Number.isFinite(features[name])) throw new Error(`Invalid derived Option-B feature: ${name}`);
  }
  return features;
}
