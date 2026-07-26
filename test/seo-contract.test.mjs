import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("article page emits canonical, NewsArticle data, correction and update UI", async () => {
  const page = await readFile(new URL("../src/pages/articles/[...slug].astro", import.meta.url),"utf8");
  assert.match(page,/articleJsonLd/);
  assert.match(page,/canonical=\{article\.canonicalUrl\}/);
  assert.match(page,/article\.corrections/);
  assert.match(page,/updatedAt/);
});

test("site metadata exposes valid local-search structured data", async () => {
  const layout = await readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url),"utf8");
  assert.match(layout,/"@type":"WebSite"/);
  assert.match(layout,/"@type":"SearchAction"/);
  assert.match(layout,/search_term_string/);
});

test("news sitemap is recent-window and fixture gated", async () => {
  const page = await readFile(new URL("../src/pages/news-sitemap.xml.ts", import.meta.url),"utf8");
  assert.match(page,/news:publication_date/);
  assert.match(page,/!a\.fixture/);
  assert.match(page,/Date\.parse\(a\.publishedAt\) >= cutoff/);
  assert.match(page,/Date\.parse\(promotionGeneratedAt\)/);
});

test("ordinary sitemap excludes fixture and non-indexable records", async () => {
  const page = await readFile(new URL("../src/pages/sitemap.xml.ts", import.meta.url),"utf8");
  assert.match(page,/!a\.fixture/);
  assert.match(page,/a\.search\.index/);
  assert.match(page,/retractionState === "current"/);
});
