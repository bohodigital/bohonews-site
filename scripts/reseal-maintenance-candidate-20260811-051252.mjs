import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=resolve(import.meta.dirname,"..");
const promotionPath=resolve(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=resolve(root,"public-news-release.v2.1.1.json");
const digest=(value)=>createHash("sha256").update(stableJson(value)).digest("hex");
const articleIds=[
  "article-gao-federal-program-effectiveness-three-step-test-2026",
  "article-nih-oriva-human-based-research-office-2026",
  "article-smithsonian-caterpillar-2-3-million-stem-40-communities",
  "article-imf-ireland-growth-inflation-outlook-2026",
  "article-us-rental-homeowner-vacancy-rates-second-quarter-2026",
  "article-ncaa-division-i-commercial-uniform-patches-august-2026"
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
