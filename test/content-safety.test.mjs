import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  calculatePublicContentInventory, validateMailRouting, validatePublicState,
  validateReleaseMarker, verifyPublicMedia
} from "../scripts/publishing/validate-content.mjs";
import { jsonForHtml } from "../src/lib/json-for-html.mjs";

test("content validator rejects executable HTML and executes schema plus digest verification", async () => {
  const validator = await readFile(new URL("../scripts/publishing/validate-content.mjs", import.meta.url),"utf8");
  for (const pattern of ["<script","javascript:","<iframe","<object","<embed","Ajv2020","Promotion digest mismatch","Release manifest does not exactly bind"]) assert.match(validator,new RegExp(pattern.replace(/[<>]/g,"\\$&"),"i"));
});

test("Batch 1 is preserved in the 2.1.1 baseline, digest-valid, media-bound, and release-bound", async () => {
  const promotion = JSON.parse(await readFile(new URL("../src/publishing/public-news-promotion-package.v2.1.1.json", import.meta.url),"utf8"));
  const release = JSON.parse(await readFile(new URL("../public-news-release.v2.1.1.json", import.meta.url),"utf8"));
  const marker = JSON.parse(await readFile(new URL("../public/.well-known/bohonews-release.json", import.meta.url),"utf8"));
  const schema = JSON.parse(await readFile(new URL("../schemas/public-news-promotion-package.v2.1.1.schema.json", import.meta.url),"utf8"));
  const batchOneArticleIds = [
    "article-ai-data-center-ratepayer-protection-pledge-expands",
    "article-house-iran-war-powers-vote-214-208",
    "article-senate-supreme-court-18-year-term-limits-bill",
    "article-trump-section-301-tariffs-60-economies",
    "article-trump-smithsonian-warning-signs-executive-order",
    "article-what-house-iran-war-powers-vote-can-do",
    "article-what-is-section-301-trade-act",
    "article-who-controls-smithsonian-board-regents"
  ];
  const batchOneMediaIds = [
    "american-history-museum-2006",
    "batl-bill-page1",
    "hconres89-page1",
    "house-chamber-2017",
    "port-savannah-2021",
    "ratepayer-pledge-0209",
    "ratepayer-pledge-0226",
    "ratepayer-pledge-0242",
    "sheldon-whitehouse-portrait-2019",
    "smithsonian-castle-2019",
    "supreme-court-building-2011",
    "ustr-final-action-page1",
    "war-powers-section5-page",
    "winder-building-2026"
  ];
  const articlesById = new Map(promotion.articles.map((article) => [article.id,article]));
  const mediaById = new Map(promotion.mediaRights.map((media) => [media.id,media]));
  const batchOneArticles = batchOneArticleIds.map((id) => articlesById.get(id));
  const batchOneMedia = batchOneMediaIds.map((id) => mediaById.get(id));
  const batchOneRelease = promotion.releaseRecords.find(
    (record) => record.releaseId === "bohonews-batch1-649b0aac"
  );
  assert.equal(promotion.schemaVersion,"2.1.1");
  assert.equal(promotion.inventory.articleCount,promotion.articles.length);
  assert.equal(promotion.inventory.mediaCount,promotion.mediaRights.length);
  assert.ok(promotion.articles.length >= batchOneArticleIds.length);
  assert.ok(promotion.mediaRights.length >= batchOneMediaIds.length);
  assert.ok(batchOneArticles.every(Boolean));
  assert.ok(batchOneMedia.every(Boolean));
  assert.ok(promotion.articles.every((article) => article.leadImage && article.bodyBlocks.length > 0));
  assert.ok(promotion.mediaRights.every((media) => media.aiGenerated === false && media.illustrationLabel === null));
  assert.equal(batchOneMedia.reduce((count, media) => count + media.derivatives.length, 0),98);
  assert.equal(release.packageDigest, promotion.packageDigest);
  assert.equal(promotion.releaseState,"final");
  assert.ok(batchOneRelease);
  assert.deepEqual(batchOneRelease.newArticleIds,batchOneArticleIds);
  assert.equal(batchOneRelease.immutableDeploymentUrl,"https://649b0aac.bohonews.pages.dev");
  assert.equal(batchOneRelease.productionActivationAt,"2026-07-26T21:22:56.706315Z");
  assert.ok(batchOneArticles.every((article) =>
    article.publishedAt === "2026-07-26T21:22:56.706315Z"
    && article.updatedAt === article.publishedAt
    && article.releaseId === "bohonews-batch1-649b0aac"
    && article.publicChangeLog.length === 0
    && article.revisionHistory === undefined));
  assert.doesNotMatch(JSON.stringify(promotion),/owner-approved|handoff|work order|initial publication from/i);
  assert.equal(validatePublicState(promotion,release,schema).packageDigest,promotion.packageDigest);
  assert.equal(validateReleaseMarker(marker,promotion,release).releaseId,marker.releaseId);
  assert.equal(Object.hasOwn(marker,"publicSiteCommit"),false);
  assert.equal(Object.hasOwn(marker,"site"),false);
  assert.equal(
    calculatePublicContentInventory(promotion,release).publicContentInventoryDigest,
    marker.publicContentInventoryDigest
  );
  const markerOnlyChange = {...marker,markerHash:"f".repeat(64)};
  assert.equal(
    calculatePublicContentInventory(promotion,release).publicContentInventoryDigest,
    marker.publicContentInventoryDigest
  );
  assert.throws(
    () => validateReleaseMarker(markerOnlyChange,promotion,release),
    /does not bind/
  );
  assert.throws(
    () => validateReleaseMarker({...marker,publicSiteCommit:"a".repeat(40)},promotion,release),
    /fields are not exact/
  );
  const release211Schema = schema.$defs.evidenceBackedReleaseRecord;
  assert.ok(!release211Schema.required.includes("publicSiteCommit"));
  const tampered = structuredClone(promotion);
  tampered.generatedAt = "2026-07-25T00:00:01Z";
  assert.throws(() => validatePublicState(tampered,release,schema),/digest mismatch/);
  const nestedLeak = structuredClone(promotion);
  nestedLeak.inputHashes.privateNotes = "secret";
  assert.throws(() => validatePublicState(nestedLeak,release,schema),/schema rejected/);
  const routeMismatch = structuredClone(release);
  routeMismatch.routes = ["/not-approved/"];
  assert.throws(() => validatePublicState(promotion,routeMismatch,schema),/does not exactly bind/);
  const retired = structuredClone(promotion);
  retired.schemaVersion = "2.1.0";
  assert.throws(() => validatePublicState(retired,release,schema),/schema rejected|require promotion 2\.1\.1/);
});

test("legacy artifacts are absent and runtime consumes only the 2.1.1 package", async () => {
  const pages = await readdir(new URL("../src/publishing/", import.meta.url));
  assert.ok(!pages.includes("public-news-promotion-package.v1.json"));
  await assert.rejects(readFile(new URL("../public-news-release.v1.json", import.meta.url)));
  const loader = await readFile(new URL("../src/lib/news.ts", import.meta.url),"utf8");
  assert.match(loader,/public-news-promotion-package\.v2\.1\.1\.json/);
  assert.doesNotMatch(loader,/public-news-promotion-package\.v2\.json/);
  assert.doesNotMatch(loader,/public-news-promotion-package\.v2\.1\.json/);
});

test("both published mail aliases have provider delivery evidence", async () => {
  const record = JSON.parse(await readFile(new URL("../src/publishing/public-mail-routing.v1.json", import.meta.url),"utf8"));
  assert.equal(validateMailRouting(record).aliasCount,2);
  const missing = structuredClone(record);
  missing.aliases.pop();
  assert.throws(() => validateMailRouting(missing),/verified delivery/);
  const bouncing = structuredClone(record);
  bouncing.aliases[0].delivery = "smtp-accepted";
  assert.throws(() => validateMailRouting(bouncing),/verified delivery/);
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
  assert.match(headers,/https:\/\/widgets\.tradingview-widget\.com/);
  assert.match(headers,/frame-src https:\/\/widgets\.tradingview-widget\.com/);
  assert.match(headers,/https:\/\/snowplow-pixel\.tradingview\.com/);
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
