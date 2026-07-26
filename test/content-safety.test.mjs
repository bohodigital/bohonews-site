import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePublicState, verifyPublicMedia } from "../scripts/publishing/validate-content.mjs";
import { jsonForHtml } from "../src/lib/json-for-html.mjs";

test("content validator rejects executable HTML and executes schema plus digest verification", async () => {
  const validator = await readFile(new URL("../scripts/publishing/validate-content.mjs", import.meta.url),"utf8");
  for (const pattern of ["<script","javascript:","<iframe","<object","<embed","Ajv2020","Promotion digest mismatch","Release manifest does not exactly bind"]) assert.match(validator,new RegExp(pattern.replace(/[<>]/g,"\\$&"),"i"));
});

test("Batch 1 promotion is public-only, digest-valid, media-bound, and release-bound", async () => {
  const promotion = JSON.parse(await readFile(new URL("../src/publishing/public-news-promotion-package.v1.json", import.meta.url),"utf8"));
  const release = JSON.parse(await readFile(new URL("../public-news-release.v1.json", import.meta.url),"utf8"));
  const schema = JSON.parse(await readFile(new URL("../schemas/public-news-promotion-package.v1.schema.json", import.meta.url),"utf8"));
  assert.equal(promotion.inventory.articleCount, 8);
  assert.equal(promotion.articles.length, 8);
  assert.equal(promotion.inventory.mediaCount, 14);
  assert.equal(promotion.mediaRights.length, 14);
  assert.ok(promotion.articles.every((article) => article.leadImage && article.bodyBlocks.length > 0));
  assert.ok(promotion.mediaRights.every((media) => media.aiGenerated === false && media.illustrationLabel === null));
  assert.equal(promotion.mediaRights.reduce((count, media) => count + media.derivatives.length, 0), 98);
  assert.equal(release.packageDigest, promotion.packageDigest);
  assert.equal(validatePublicState(promotion,release,schema).packageDigest,promotion.packageDigest);
  const tampered = structuredClone(promotion);
  tampered.generatedAt = "2026-07-25T00:00:01Z";
  assert.throws(() => validatePublicState(tampered,release,schema),/digest mismatch/);
  const nestedLeak = structuredClone(promotion);
  nestedLeak.inputHashes.privateNotes = "secret";
  assert.throws(() => validatePublicState(nestedLeak,release,schema),/schema rejected/);
  const routeMismatch = structuredClone(release);
  routeMismatch.routes = ["/not-approved/"];
  assert.throws(() => validatePublicState(promotion,routeMismatch,schema),/does not exactly bind/);
});

test("preview fixtures are explicit and production distribution is disabled", async () => {
  const source = await readFile(new URL("../src/publishing/preview-fixtures.ts", import.meta.url),"utf8");
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
  for (const required of ["rss.xml.ts","sitemap.xml.ts","news-sitemap.xml.ts","robots.txt.ts","search.astro","404.astro","[kind]/[slug]/index.astro"]) assert.ok(pages.includes(required),required);
});

test("security headers prevent framing and restrict capabilities", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url),"utf8");
  for (const value of ["X-Frame-Options: DENY","X-Content-Type-Options: nosniff","Content-Security-Policy","camera=()","frame-ancestors 'none'"]) assert.match(headers,new RegExp(value.replace(/[()]/g,"\\$&")));
  assert.doesNotMatch(headers,/unsafe-inline/);
  assert.match(headers,/script-src 'self' https:\/\/analytics\.bohodigitalservices\.com/);
  assert.match(headers,/connect-src 'self' https:\/\/analytics\.bohodigitalservices\.com/);
});

test("JSON-LD and fallback search render untrusted text without HTML execution", async () => {
  const serialized = jsonForHtml({headline:"</script><img src=x onerror=alert(1)>",separator:"\u2028"});
  assert.doesNotMatch(serialized,/[<>]/);
  assert.match(serialized,/\\u003c/);
  assert.match(serialized,/\\u2028/);
  const searchBuilder = await readFile(new URL("../scripts/publishing/build-search.mjs", import.meta.url),"utf8");
  assert.match(searchBuilder,/link\.textContent=x\.title/);
  assert.match(searchBuilder,/excerpt\.textContent=x\.excerpt/);
  assert.doesNotMatch(searchBuilder,/out\.innerHTML/);
});

test("public media validation rejects a symlinked ancestor outside public root", async () => {
  const temporary = await mkdtemp(join(tmpdir(),"bohonews-public-media-"));
  const publicRoot = join(temporary,"public");
  const outside = join(temporary,"outside");
  const bytes = Buffer.from("GIF89a-outside");
  try {
    await mkdir(publicRoot);
    await mkdir(outside);
    await writeFile(join(outside,"fixture.gif"),bytes);
    await symlink(outside,join(publicRoot,"escape"));
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.throws(() => verifyPublicMedia(publicRoot,"/escape/fixture.gif",hash),/through a symlink/);
  } finally {
    await rm(temporary,{recursive:true,force:true});
  }
});
