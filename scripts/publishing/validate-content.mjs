import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const articleRoot = join(root, "content/articles");
const promotionPath = join(root, "src/data/public-news-promotion-package.v1.json");
const releasePath = join(root, "public-news-release.v1.json");
const forbiddenMarkup = [/<script\b/i,/javascript:/i,/on(?:click|load|error)\s*=/i,/<iframe\b/i,/<object\b/i,/<embed\b/i];
const forbiddenPublicKeys = new Set(["privateNotes","internalConfidence","confidentialSourceIdentity","legalAdvice","rawPayload","contactDetails","credentials","secret"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

function inspect(value, trail = []) {
  if (Array.isArray(value)) return value.forEach((item,index) => inspect(item,[...trail,index]));
  if (!value || typeof value !== "object") return;
  for (const [key,item] of Object.entries(value)) {
    if (forbiddenPublicKeys.has(key)) throw new Error(`Private field in promotion package: ${[...trail,key].join(".")}`);
    inspect(item,[...trail,key]);
  }
}

for (const path of await walk(articleRoot)) {
  if (![".md",".mdx"].includes(extname(path))) continue;
  const content = await readFile(path,"utf8");
  if (forbiddenMarkup.some((pattern) => pattern.test(content))) throw new Error(`Unsafe executable HTML rejected in ${path}`);
}
const promotion = JSON.parse(await readFile(promotionPath,"utf8"));
const release = JSON.parse(await readFile(releasePath,"utf8"));
inspect(promotion);
if (promotion.schemaVersion !== "1.0.0" || promotion.site !== "https://bohonews.com") throw new Error("Promotion contract identity is invalid");
if (promotion.inventory.articleCount !== promotion.articles.length || promotion.inventory.routeCount !== promotion.articles.length) throw new Error("Promotion inventory mismatch");
if (promotion.articles.some((article) => article.fixture || article.embargoUntil || article.killState !== undefined)) throw new Error("Private or fixture publication state leaked into promotion");
if (new Set(promotion.articles.map(({id}) => id)).size !== promotion.articles.length) throw new Error("Duplicate public article ID");
if (new Set(promotion.articles.map(({slug}) => slug)).size !== promotion.articles.length) throw new Error("Duplicate public article slug");
if (release.articleCount !== promotion.inventory.articleCount || release.packageDigest !== promotion.packageDigest) throw new Error("Release manifest does not match promotion package");
console.log(`Governed public content validation passed (${promotion.articles.length} promoted articles; fixtures excluded).`);
