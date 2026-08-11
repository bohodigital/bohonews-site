import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stableJson } from "./publishing/stable-json.mjs";

const root = process.cwd();
const promotionPath = join(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = join(root, "public-news-release.v2.1.1.json");
const batchPath = join(root, "scripts/maintenance-batch-20260811-001321.json");
const slug = "nsf-50-million-ai-materials-innovation-platforms-2026";
const replacement = "Teams in Texas and Wisconsin will build national user facilities for autonomous alloy and extreme-environment materials research.";
const digest = (value) => createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");

const batch = JSON.parse(readFileSync(batchPath, "utf8"));
const batchArticle = batch.find((item) => item.slug === slug);
if (!batchArticle) throw new Error("Batch article missing");
batchArticle.dek = replacement;

const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const article = promotion.articles.find((item) => item.slug === slug);
if (!article) throw new Error("Promotion article missing");
article.dek = replacement;
article.social.description = replacement;
const releaseArticles = promotion.articles.slice(-6);
if (!releaseArticles.some((item) => item.slug === slug)) throw new Error("Article is not in exact release tail");
promotion.generatedAt = new Date().toISOString();
promotion.inputHashes.articles = digest(releaseArticles);
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);

const release = JSON.parse(readFileSync(releasePath, "utf8"));
release.generatedAt = promotion.generatedAt;
release.packageDigest = promotion.packageDigest;

writeFileSync(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
writeFileSync(promotionPath, `${JSON.stringify(promotion, null, 2)}\n`);
writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`);
console.log(JSON.stringify({ slug, dek: replacement, packageDigest: promotion.packageDigest }, null, 2));
