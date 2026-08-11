import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=resolve(import.meta.dirname,"..");
const promotionPath=resolve(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=resolve(root,"public-news-release.v2.1.1.json");
const digest=(value)=>createHash("sha256").update(stableJson(value)).digest("hex");
const articleIds=[
  "article-gao-financial-data-transparency-standards-2026",
  "article-aggravated-identity-theft-sentencing-fy2025",
  "article-federal-deficit-through-july-2026-cbo",
  "article-noaa-hyperspectral-great-lakes-ice-flights-2026",
  "article-nist-rm-8047-resin-3d-printing-working-curve",
  "article-south-population-growth-all-age-groups-2020-2025"
];
const promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
if(promotion.releaseState!=="candidate")throw new Error("Expected candidate release state");
const articles=articleIds.map((id)=>promotion.articles.find((article)=>article.id===id));
if(articles.some((article)=>!article))throw new Error("Exact six-item candidate unavailable");
promotion.generatedAt=new Date().toISOString();
promotion.inputHashes.articles=digest(articles);
delete promotion.packageDigest;
promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);
writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({packageDigest:promotion.packageDigest,articlesHash:promotion.inputHashes.articles,articleIds},null,2));
