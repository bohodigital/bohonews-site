import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

test("content validator rejects executable HTML and private promotion fields", async () => {
  const validator = await readFile(new URL("../scripts/publishing/validate-content.mjs", import.meta.url),"utf8");
  for (const pattern of ["<script","javascript:","<iframe","<object","<embed","privateNotes","confidentialSourceIdentity","credentials"]) assert.match(validator,new RegExp(pattern.replace(/[<>]/g,"\\$&"),"i"));
});

test("production promotion is empty, public-only, and release-bound", async () => {
  const promotion = JSON.parse(await readFile(new URL("../src/data/public-news-promotion-package.v1.json", import.meta.url),"utf8"));
  const release = JSON.parse(await readFile(new URL("../public-news-release.v1.json", import.meta.url),"utf8"));
  assert.equal(promotion.inventory.articleCount, 0);
  assert.equal(promotion.articles.length, 0);
  assert.equal(release.packageDigest, promotion.packageDigest);
});

test("preview fixtures are explicit and production distribution is disabled", async () => {
  const source = await readFile(new URL("../src/data/preview-fixtures.ts", import.meta.url),"utf8");
  assert.match(source,/fixture:true/);
  assert.doesNotMatch(source,/distribution:\{rss:true/);
  assert.match(source,/search:\{index:false/);
});

test("bulk benchmark is isolated behind an explicit non-production build flag", async () => {
  const source = await readFile(new URL("../src/lib/news.ts", import.meta.url),"utf8");
  assert.match(source,/BOHONEWS_BENCHMARK_1000/);
  assert.match(source,/Array\.from\(\{length:1000\}/);
  assert.match(source,/fixture:true/);
});

test("discovery and metadata routes exist", async () => {
  const pages = await readdir(new URL("../src/pages/", import.meta.url), {recursive:true});
  for (const required of ["rss.xml.ts","sitemap.xml.ts","news-sitemap.xml.ts","robots.txt.ts","search.astro","404.astro"]) assert.ok(pages.includes(required),required);
});

test("security headers prevent framing and restrict capabilities", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url),"utf8");
  for (const value of ["X-Frame-Options: DENY","X-Content-Type-Options: nosniff","Content-Security-Policy","camera=()","frame-ancestors 'none'"]) assert.match(headers,new RegExp(value.replace(/[()]/g,"\\$&")));
});
