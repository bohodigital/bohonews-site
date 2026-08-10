import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/maintenance-batch-20260810-065029.json"), "utf8"));
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const slugs = definitions.map(({ slug }) => slug);
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
const rightsIds = definitions.flatMap(({ lead, charts }) => [lead.id, ...charts.map(({ id }) => id)]);
const mediaRights = rightsIds.map((id) => promotion.mediaRights.find((record) => record.id === id));

if (promotion.releaseState !== "candidate" || articles.some((article) => !article) || mediaRights.some((record) => !record)) {
  throw new Error("Expected the exact six-story maintenance candidate");
}

promotion.generatedAt = new Date().toISOString();
promotion.inputHashes.sourceItems = digest(definitions.map(({ sources }) => sources));
promotion.inputHashes.events = digest(definitions.map(({ slug }) => `event-${slug}`));
promotion.inputHashes.claims = digest(definitions.map(({ facts }) => facts));
promotion.inputHashes.articles = digest(articles);
promotion.inputHashes.mediaRights = digest(mediaRights);
promotion.inputHashes.releaseRecords = digest(promotion.releaseRecords);
promotion.inputHashes.publicationIntents = digest(definitions.map(({ slug }) => ({ slug, intent: "manual-maintenance-release" })));
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);

const release = {
  schemaVersion: promotion.schemaVersion,
  compilerVersion: promotion.compilerVersion,
  generatedAt: promotion.generatedAt,
  packageDigest: promotion.packageDigest,
  articleCount: promotion.inventory.articleCount,
  mediaCount: promotion.inventory.mediaCount,
  routes: promotion.articles.map(({ canonicalUrl }) => new URL(canonicalUrl).pathname),
  releaseRecords: promotion.releaseRecords,
  releaseState: promotion.releaseState
};

writeFileSync(promotionPath, `${JSON.stringify(promotion, null, 2)}\n`);
writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`);
console.log(JSON.stringify({ packageDigest: promotion.packageDigest, articleCount: promotion.inventory.articleCount, mediaCount: promotion.inventory.mediaCount }, null, 2));
