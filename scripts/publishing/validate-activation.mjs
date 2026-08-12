import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePublicState } from "./validate-content.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const promotionPath = join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = join(root,"public-news-release.v2.1.1.json");
const schemaPath = join(root,"schemas/public-news-promotion-package.v2.1.1.schema.json");

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path = join(directory,entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
}

export async function validateActivationSource() {
  const [promotion,release,schema] = await Promise.all([
    readFile(promotionPath,"utf8").then(JSON.parse),
    readFile(releasePath,"utf8").then(JSON.parse),
    readFile(schemaPath,"utf8").then(JSON.parse)
  ]);
  const result = validatePublicState(promotion,release,schema,{preview:true});
  return {promotion,result};
}

export async function validateActivationArtifact() {
  const {promotion,result} = await validateActivationSource();
  const dist = join(root,"dist");
  const headersPath = join(dist,"_headers");
  const existingHeaders = await readFile(headersPath,"utf8");
  const activationHeaders = existingHeaders.replace(
    /^\/\*\s*\n/,
    "/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"
  );
  await writeFile(headersPath,activationHeaders);
  await rm(join(dist,".well-known","bohonews-release.json"),{force:true});

  const files = await walk(dist);
  const html = await Promise.all(
    files.filter((path) => path.endsWith(".html")).map((path) => readFile(path,"utf8"))
  );
  if (!html.length || html.some((page) => !/name="robots" content="noindex,nofollow"/.test(page))) {
    throw new Error("Every activation HTML page must be noindex,nofollow");
  }
  if (html.some((page) =>
    /<aside[^>]+fixture-banner|Preview candidate — not published|Private preview — not published|Non-production fixture preview|Preview only|Newsletter interface preview/.test(page))) {
    throw new Error("Activation artifact contains preview UI forbidden on the live domain");
  }
  if (html.some((page) =>
    /<script[^>]+(?:analytics-bootstrap|analytics\.bohodigitalservices\.com|widgets\.tradingview-widget\.com)|<tv-ticker-tape\b|data-umami-|snowplow-pixel\.tradingview\.com/.test(page))) {
    throw new Error("Activation artifact contains production analytics or TradingView");
  }
  for (const article of promotion.articles.filter(({publishedAt}) => publishedAt === null)) {
    const page = await readFile(join(dist,"articles",article.slug,"index.html"),"utf8");
    if (/\bPublished\s*<|article:published_time|datePublished/.test(page)) {
      throw new Error(`Activation article exposes an invented publication time: ${article.id}`);
    }
  }
  const [robots,rss,sitemap,newsSitemap,headers] = await Promise.all([
    readFile(join(dist,"robots.txt"),"utf8"),
    readFile(join(dist,"rss.xml"),"utf8"),
    readFile(join(dist,"sitemap.xml"),"utf8"),
    readFile(join(dist,"news-sitemap.xml"),"utf8"),
    readFile(headersPath,"utf8")
  ]);
  if (!/Disallow: \//.test(robots)
    || promotion.articles.some(({canonicalUrl}) => rss.includes(canonicalUrl)
      || sitemap.includes(canonicalUrl)
      || newsSitemap.includes(canonicalUrl))
    || !/X-Robots-Tag: noindex, nofollow/.test(headers)
    || !/Cache-Control: no-store/.test(headers)) {
    throw new Error("Activation robots, feed exclusion, or response-cache contract failed");
  }
  return result;
}

const mode = process.argv[2] ?? "source";
const result = mode === "artifact"
  ? await validateActivationArtifact()
  : (await validateActivationSource()).result;
console.log(`Boho News public activation validation passed (${result.articleCount} articles; ${mode}; no preview UI).`);
