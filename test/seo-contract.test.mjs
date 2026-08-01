import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("article page emits canonical, NewsArticle data, correction and public history UI", async () => {
  const page = await readFile(new URL("../src/pages/articles/[...slug].astro", import.meta.url),"utf8");
  assert.match(page,/articleJsonLd/);
  assert.match(page,/canonical=\{article\.canonicalUrl\}/);
  assert.match(page,/article\.corrections/);
  assert.match(page,/Publication history/);
  assert.match(page,/publicChangeLog/);
  assert.doesNotMatch(page,/Revision history|revisionHistory/);
  assert.match(page,/ArticleBody/);
  assert.match(page,/confirmedFactsSummary/);
});

test("production homepage uses governed timestamps and real lead media", async () => {
  const page = await readFile(new URL("../src/pages/index.astro", import.meta.url),"utf8");
  assert.match(page,/lead\.leadImage/);
  assert.match(page,/formatTimestamp\(lead\.updatedAt\)/);
  assert.match(page,/fixturesEnabled && <a class="breaking-strip"/);
  assert.doesNotMatch(page,/Synthetic dominant lead visual/);
});

test("structured article body renders evidence media, tables, callouts and related coverage", async () => {
  const component = await readFile(new URL("../src/components/ArticleBody.astro", import.meta.url),"utf8");
  for (const marker of ["official-document-render","article-data-module","source-callout","related-story","View source"]) {
    assert.match(component,new RegExp(marker));
  }
});

test("site metadata exposes valid local-search structured data", async () => {
  const layout = await readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url),"utf8");
  assert.match(layout,/"@type":"WebSite"/);
  assert.match(layout,/"@type":"SearchAction"/);
  assert.match(layout,/search_term_string/);
  assert.match(layout,/og:image:width/);
  assert.match(layout,/summary_large_image/);
  assert.match(layout,/article:published_time/);
  assert.match(layout,/article:modified_time/);
});

test("newsroom visual system includes broad navigation and a persistent three-mode theme", async () => {
  const [header,theme,news] = await Promise.all([
    readFile(new URL("../src/components/SiteHeader.astro", import.meta.url),"utf8"),
    readFile(new URL("../public/theme.js", import.meta.url),"utf8"),
    readFile(new URL("../src/lib/news.ts", import.meta.url),"utf8")
  ]);
  for (const label of ["Latest","U.S.","World","Politics","Business","Crime","Weather","Health & Science","Technology","Investigations"]) {
    assert.ok(header.includes(label),label);
  }
  for (const choice of ["system","light","dark"]) assert.match(theme,new RegExp(`\"${choice}\"`));
  for (const route of ["crime-justice","weather-climate","health-science","technology","visuals","documents","data"]) assert.match(news,new RegExp(`\"${route}\"`));
});

test("bespoke social card is a tracked-size PNG asset", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.ok(image.length > 100_000);
  assert.deepEqual([...image.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
});

test("visual system preserves keyboard, motion, print and mobile theme access", async () => {
  const [styles,header] = await Promise.all([
    readFile(new URL("../src/styles/global.css", import.meta.url),"utf8"),
    readFile(new URL("../src/components/SiteHeader.astro", import.meta.url),"utf8")
  ]);
  assert.match(styles,/:focus-visible/);
  assert.match(styles,/prefers-reduced-motion:\s*reduce/);
  assert.match(styles,/@media print/);
  assert.match(styles,/a:visited/);
  assert.match(header,/<details class="mobile-menu">[\s\S]*<ThemeControl \/>[\s\S]*<\/details>/);
});

test("built search loads Pagefind's classic UI before its initializer", async () => {
  const [page,initializer,builder] = await Promise.all([
    readFile(new URL("../src/pages/search.astro", import.meta.url),"utf8"),
    readFile(new URL("../public/search-init.js", import.meta.url),"utf8"),
    readFile(new URL("../scripts/publishing/build-search.mjs", import.meta.url),"utf8")
  ]);
  assert.ok(page.indexOf("/pagefind/pagefind-ui.js") < page.indexOf("/search-init.js"));
  assert.doesNotMatch(initializer,/\bimport\b/);
  assert.match(initializer,/new PagefindUI/);
  assert.match(builder,/window\.PagefindUI=class PagefindUI/);
  assert.doesNotMatch(builder,/export class PagefindUI/);
  assert.match(page,/pagefind-ui\.js\?v=20260730-1/);
  assert.match(builder,/search-index\.json\?v=20260730-1/);
  assert.ok(
    builder.indexOf("input.addEventListener('input',render)")
      < builder.indexOf("fetch('/search-index.json?v=20260730-1')")
  );
  assert.match(builder,/rows=value;input\.dispatchEvent\(new Event\('input'/);
});

test("Umami and GA4 are host-restricted, privacy-restrained, and suppressible for QA", async () => {
  const [layout,bootstrap] = await Promise.all([
    readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url),"utf8"),
    readFile(new URL("../public/analytics-bootstrap.js", import.meta.url),"utf8")
  ]);
  assert.match(layout,/data-umami-website-id="da60f9a9-f65b-4849-a55d-f9b4365f509d"/);
  assert.match(layout,/data-umami-domains="bohonews\.com,www\.bohonews\.com"/);
  assert.match(layout,/data-ga-id="G-76CPXCF9NV"/);
  assert.match(layout,/data-ga-public-hosts="bohonews\.com,www\.bohonews\.com"/);
  assert.match(bootstrap,/navigator\.webdriver/);
  assert.match(bootstrap,/boho_qa/);
  assert.match(bootstrap,/data-do-not-track/);
  assert.match(bootstrap,/data-exclude-search/);
  assert.match(bootstrap,/umamiHosts\.includes/);
  assert.match(bootstrap,/googletagmanager\.com\/gtag\/js/);
  assert.match(bootstrap,/allow_google_signals:\s*false/);
  assert.match(bootstrap,/allow_ad_personalization_signals:\s*false/);
});

test("global market ticker uses the official account-free TradingView web component", async () => {
  const [layout,header,ticker,policy] = await Promise.all([
    readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url),"utf8"),
    readFile(new URL("../src/components/SiteHeader.astro", import.meta.url),"utf8"),
    readFile(new URL("../src/components/MarketTicker.astro", import.meta.url),"utf8"),
    readFile(new URL("../src/content/policies/privacy.md", import.meta.url),"utf8")
  ]);
  assert.match(layout,/https:\/\/widgets\.tradingview-widget\.com\/w\/en\/tv-ticker-tape\.js/);
  assert.equal(layout.match(/tv-ticker-tape\.js/g)?.length,1);
  assert.match(header,/<MarketTicker \/>/);
  assert.match(ticker,/<tv-ticker-tape/);
  assert.match(ticker,/Data by TradingView/);
  assert.match(ticker,/FOREXCOM:SPXUSD/);
  assert.doesNotMatch(ticker,/account|apiKey|token|clientId/i);
  assert.match(policy,/widgets do not set cookies/);
  assert.match(policy,/displayed symbols, and connection IP address/);
});

test("trust pages use the governed content collection and are indexable", async () => {
  const [route,config,footer,sitemap] = await Promise.all([
    readFile(new URL("../src/pages/[policy].astro", import.meta.url),"utf8"),
    readFile(new URL("../src/content.config.ts", import.meta.url),"utf8"),
    readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url),"utf8"),
    readFile(new URL("../src/pages/sitemap.xml.ts", import.meta.url),"utf8")
  ]);
  assert.match(route,/getCollection\("policies"\)/);
  assert.match(route,/noindex=\{!entry\.data\.index\}/);
  assert.match(route,/<!--email_off-->/);
  assert.match(route,/<!--\/email_off-->/);
  assert.doesNotMatch(route,/Editorial placeholder|requires separate editorial approval/);
  assert.match(config,/src\/content\/policies/);
  for (const path of ["about","editorial-standards","corrections","support","privacy","terms","accessibility","contact"]) {
    assert.match(sitemap,new RegExp(`/${path}/`));
  }
  assert.match(footer,/href="\/support\/">Support/);
  assert.match(footer,/href="\/accessibility\/">Accessibility/);
});

test("policy copy matches current analytics, hosting, widget, storage, mail, and legal behavior", async () => {
  const [privacy,about,support] = await Promise.all([
    readFile(new URL("../src/content/policies/privacy.md", import.meta.url),"utf8"),
    readFile(new URL("../src/content/policies/about.md", import.meta.url),"utf8"),
    readFile(new URL("../src/content/policies/support.md", import.meta.url),"utf8")
  ]);
  for (const marker of ["Cloudflare","self-hosted Umami","Do Not Track","excludes search-query parameters","TradingView","Browser storage","Ordinary email","does not currently collect payment"]) {
    assert.match(privacy,new RegExp(marker,"i"));
  }
  for (const marker of ["Google Analytics 4","disables Google signals","without query strings","Google's privacy policy"]) {
    assert.match(privacy,new RegExp(marker,"i"));
  }
  for (const source of [about,support]) {
    assert.match(source,/Republic of Bohemia LLC/);
    assert.match(source,/does not currently/i);
    assert.match(source,/501\(c\)\(3\)/);
    assert.match(source,/not tax-deductible/);
  }
});

test("timestamps use America Chicago and every distribution surface reads the same fields", async () => {
  const [news,article,rss,newsSitemap] = await Promise.all([
    readFile(new URL("../src/lib/news.ts", import.meta.url),"utf8"),
    readFile(new URL("../src/pages/articles/[...slug].astro", import.meta.url),"utf8"),
    readFile(new URL("../src/pages/rss.xml.ts", import.meta.url),"utf8"),
    readFile(new URL("../src/pages/news-sitemap.xml.ts", import.meta.url),"utf8")
  ]);
  assert.match(news,/timeZone:"America\/Chicago"/);
  assert.match(news,/datePublished:article\.publishedAt/);
  assert.match(news,/dateModified:article\.updatedAt/);
  assert.match(article,/publishedAt=\{candidatePreviewEnabled \? undefined : article\.publishedAt/);
  assert.match(article,/updatedAt=\{candidatePreviewEnabled \? undefined : article\.updatedAt/);
  assert.match(rss,/new Date\(article\.publishedAt!\)\.toUTCString/);
  assert.match(newsSitemap,/news:publication_date>\$\{a\.publishedAt\}/);
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
  assert.match(page,/candidatePreviewEnabled \? \[\] : articles/);
  assert.match(page,/!a\.fixture/);
  assert.match(page,/a\.search\.index/);
  assert.match(page,/retractionState === "current"/);
});
