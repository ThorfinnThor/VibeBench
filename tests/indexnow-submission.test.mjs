import assert from "node:assert/strict";
import test from "node:test";
import { extractSitemapUrls, submitIndexNow } from "../scripts/submit-indexnow.mjs";

test("IndexNow sitemap parsing keeps unique same-origin URLs", () => {
  const xml = "<urlset><url><loc>https://www.vibefootprint.com/</loc></url><url><loc>https://www.vibefootprint.com/a?x=1&amp;y=2</loc></url><url><loc>https://other.example/a</loc></url><url><loc>https://www.vibefootprint.com/</loc></url></urlset>";
  assert.deepEqual(extractSitemapUrls(xml, "https://www.vibefootprint.com"), ["https://www.vibefootprint.com/", "https://www.vibefootprint.com/a?x=1&y=2"]);
});

test("IndexNow submits the live sitemap with the hosted key", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    if (!options) return new Response("<urlset><url><loc>https://www.vibefootprint.com/</loc></url><url><loc>https://www.vibefootprint.com/guides</loc></url></urlset>", { status: 200 });
    return new Response(null, { status: 202 });
  };
  const result = await submitIndexNow({ fetchImpl, origin: "https://www.vibefootprint.com" });
  assert.deepEqual(result, { status: 202, count: 2 });
  assert.equal(requests[0].url, "https://www.vibefootprint.com/sitemap.xml");
  assert.equal(requests[1].url, "https://api.indexnow.org/indexnow");
  const payload = JSON.parse(requests[1].options.body);
  assert.equal(payload.host, "www.vibefootprint.com");
  assert.equal(payload.keyLocation, "https://www.vibefootprint.com/75aac989d1f432b965d085549187c9ab.txt");
  assert.deepEqual(payload.urlList, ["https://www.vibefootprint.com/", "https://www.vibefootprint.com/guides"]);
});
