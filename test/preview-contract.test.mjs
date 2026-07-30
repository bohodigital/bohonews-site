import assert from "node:assert/strict";
import {
  copyFile, mkdir, mkdtemp, readFile
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  validatePublicState, validateReleaseMarker
} from "../scripts/publishing/validate-content.mjs";

const fixturePath = (relative) => new URL(`./fixtures/mcp-v2/${relative}`,import.meta.url);
const readJson = async (relative) => JSON.parse(await readFile(fixturePath(relative),"utf8"));

async function materializePublicFixture(mediaRights) {
  const publicRoot = await mkdtemp(join(tmpdir(),"bohonews-preview-public-"));
  const privateRights = await readJson("examples/json/06-media-rights.v1.json");
  const sourceByRole = new Map(privateRights.derivatives.map((item) => [item.role,item.path]));
  for (const rights of mediaRights) {
    for (const derivative of rights.derivatives) {
      const to = join(publicRoot,derivative.publicPath.slice(1));
      await mkdir(dirname(to),{recursive:true});
      await copyFile(
        fixturePath(sourceByRole.get(derivative.role)).pathname,
        to
      );
    }
  }
  return publicRoot;
}

test("authoritative candidate validates only in the disconnected preview lane", async () => {
  const candidate = await readJson("examples/json/09-candidate-promotion-package.v2.1.1.json");
  const manifest = await readJson("examples/json/10-candidate-release-manifest.v2.1.1.json");
  const schema = JSON.parse(await readFile(
    new URL("../schemas/public-news-promotion-package.v2.1.1.schema.json",import.meta.url),
    "utf8"
  ));
  const publicRoot = await materializePublicFixture(candidate.mediaRights);
  assert.equal(
    validatePublicState(candidate,manifest,schema,{preview:true,publicRoot}).articleCount,
    1
  );
  assert.throws(
    () => validatePublicState(candidate,manifest,schema,{publicRoot}),
    /Candidate promotion cannot enter the public repository/
  );
  const invented = structuredClone(candidate);
  invented.articles[0].publishedAt = "2026-07-27T12:20:00Z";
  assert.throws(
    () => validatePublicState(invented,manifest,schema,{preview:true,publicRoot}),
    /invented release fields|schema rejected/
  );
});

test("authoritative final package binds canonical-first-public time and release marker", async () => {
  const promotion = await readJson("examples/json/17-final-promotion-package.v2.1.1.json");
  const manifest = await readJson("examples/json/18-final-release-manifest.v2.1.1.json");
  const marker = await readJson("examples/json/19-public-release-marker.v1.1.json");
  const schema = JSON.parse(await readFile(
    new URL("../schemas/public-news-promotion-package.v2.1.1.schema.json",import.meta.url),
    "utf8"
  ));
  const publicRoot = await materializePublicFixture(promotion.mediaRights);
  assert.equal(validatePublicState(promotion,manifest,schema,{publicRoot}).articleCount,1);
  assert.equal(validateReleaseMarker(marker,promotion,manifest,{publicRoot}).releaseId,marker.releaseId);
  assert.equal(
    promotion.articles[0].publishedAt,
    promotion.releaseRecords[0].canonicalFirstPublicAt
  );
});

test("preview source contract suppresses timestamps, indexing, analytics, and TradingView", async () => {
  const [article,layout,header,previewValidator,robots,rss,sitemap,newsSitemap] = await Promise.all([
    readFile(new URL("../src/pages/articles/[...slug].astro",import.meta.url),"utf8"),
    readFile(new URL("../src/layouts/BaseLayout.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/components/SiteHeader.astro",import.meta.url),"utf8"),
    readFile(new URL("../scripts/publishing/validate-preview.mjs",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/robots.txt.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/rss.xml.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/sitemap.xml.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/news-sitemap.xml.ts",import.meta.url),"utf8")
  ]);
  assert.match(article,/Preview candidate — not published/);
  assert.match(article,/candidatePreviewEnabled \? undefined : article\.publishedAt/);
  assert.match(layout,/!candidatePreview/);
  assert.match(header,/!candidatePreview/);
  assert.match(previewValidator,/Cache-Control: no-store/);
  assert.match(previewValidator,/X-Robots-Tag: noindex, nofollow/);
  assert.match(robots,/Disallow: \//);
  assert.match(rss,/candidatePreviewEnabled \? \[\] : articles/);
  assert.match(sitemap,/candidatePreviewEnabled \? \[\] : articles/);
  assert.match(newsSitemap,/candidatePreviewEnabled \? \[\] : articles/);
  assert.match(previewValidator,/sitemap\.includes\(canonicalUrl\)/);
});
