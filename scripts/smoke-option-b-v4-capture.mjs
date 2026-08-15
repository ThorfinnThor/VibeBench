import assert from "node:assert/strict";
import { chromium } from "playwright";
import { extractOptionBV4Surface, installOptionBV4SurfaceHelpers } from "../lib/option-b-v4-capture.mjs";

const browser = await chromium.launch({ headless: true, executablePath: process.env.OPTION_B_V4_SMOKE_EXECUTABLE_PATH || undefined, proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent(`<!doctype html><html><head><style>:root{--space:16px}.clip{overflow:hidden;width:10px;height:10px}.outside{margin-left:30px;width:5px;height:5px}</style></head><body>
    <main><section id="unnamed"><button id="enabled">Go</button><button id="disabled" disabled>Stop</button><a id="negative" href="#" tabindex="-1">Skip</a></section>
    <section id="named" aria-label="Named region"><p>Enough visible content for a deterministic local capture smoke test with several words and elements.</p></section>
    <div hidden><button id="hidden-child">Hidden</button></div><div class="clip"><div id="clipped" class="outside"></div></div></main>
  </body></html>`);
  await installOptionBV4SurfaceHelpers(page);
  const semantics = await page.evaluate(() => {
    const helper = window.__VIBEBENCH_OPTION_B_V4_SURFACE__;
    const byId = (id) => document.getElementById(id);
    return {
      unnamed: helper.semanticRole(byId("unnamed")), named: helper.semanticRole(byId("named")),
      enabled: helper.isInteractive(byId("enabled")), disabled: helper.isInteractive(byId("disabled")), negative: helper.isInteractive(byId("negative")),
      hidden: helper.isVisible(byId("hidden-child")), clipped: helper.isVisible(byId("clipped"))
    };
  });
  assert.deepEqual(semantics, { unnamed: "none", named: "region", enabled: true, disabled: false, negative: false, hidden: false, clipped: false });
  const payload = await extractOptionBV4Surface(page, { maximum_visible_elements: 2000, maximum_dom_depth: 80, maximum_same_origin_stylesheets: 8, maximum_stylesheet_bytes_each: 300000, maximum_total_stylesheet_bytes: 1500000 });
  assert.equal(payload.public_assets.same_origin_stylesheet_candidates, 1, "stabilization stylesheet must be excluded");
  assert.ok(payload.visible_elements.some((element) => element.interactive));
  process.stdout.write("option-b-v4 local capture smoke verified\n");
} finally {
  await browser.close();
}
