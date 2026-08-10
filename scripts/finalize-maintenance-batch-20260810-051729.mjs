import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePublicContentInventory } from "./publishing/validate-content.mjs";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const evidenceDir = resolve(process.argv[2] ?? "maintenance-release-evidence");
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const markerPath = resolve(root, "public/.well-known/bohonews-release.json");
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const slugs = [
  "gao-federal-open-access-publishing-costs-could-triple-2026",
  "state-local-law-enforcement-64200-officer-vacancies-2020",
  "congressional-community-projects-39-billion-obligated-gao-2026",
  "us-open-2026-schedule-fan-week-main-draw-finals",
  "noaa-atlantic-hurricane-outlook-75-percent-below-normal-2026",
  "who-hiv-hepatitis-sti-progress-gaps-2026"
];
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (promotion.releaseState !== "candidate" || articles.some((article) => !article)) throw new Error("Expected the exact six-item candidate");
if (articles.some(({publishedAt,updatedAt,releaseId}) => publishedAt || updatedAt || releaseId)) throw new Error("Articles are already release-bound");

const approval = {
  schemaVersion:"manual-maintenance-approval.v1",
  actor:"human-owner",
  automationId:"boho-news-manual-install-newsroom",
  batchId:"PB-20260810T051729Z-4A823A253CE3",
  decision:"approved",
  approvedAt:"2026-08-10T05:17:29.629Z",
  candidatePackageDigest:promotion.packageDigest,
  articleIds:articles.map(({id}) => id),
  authorization:"Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, rollback, and health gates."
};
const approvalDigest = digest(approval);
const activationEvidence = {
  schemaVersion:"1.2.0",
  recordId:"activation-evidence-pb-20260810t051729z-4a823a253ce3",
  batchId:"PB-20260810T051729Z-4A823A253CE3",
  adapterId:"bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest:promotion.packageDigest,
  activationArtifactSha256:"68a34314f8bea5a98822cc8cc1eba060d87108daa4ef428112fa998f83b58898",
  activationInventorySha256:"21251caee11abb0b13b572facc19678f5a3cff3aed7ac08e73a6f06e6e4b5874",
  activationProviderResponseHash:"b9797085859b98f72460af1bab86b78b2abcb59cbbd29d4551801bace33021fe",
  activationImmutableUrl:"https://3cfb4265.bohonews.pages.dev/",
  providerActivatedAt:"2026-08-10T05:40:14.338629Z",
  canonicalFirstPublicAt:"2026-08-10T05:41:51.318Z",
  canonicalFirstPublicEvidenceHash:"d48867a97104f933178306fa7b2ad50e5d2056edb62a545b6f4649941857ad34",
  previousVerifiedDeploymentReference:"d959d04f76f5214619b5e9d63f28bca04f97c5b9a6d97c81fdc6539db28576a1",
  edgeRouterContractVersion:"bohonews-edge-router.v1.0.0",
  edgeRouterScriptHash:"ba0342d1351dd4aa8a9eb3886bfb30d9ea17cf677f2b412fe05f9978c43b99b6",
  edgeRouterDeploymentResponseHash:"70e9e0d41e400b96d517a12519d4255fd3b0f4f269d25089c705f20f1b4cc47f",
  edgeRouterActivatedAt:"2026-08-10T05:40:45.242065Z",
  edgeRouterOriginImmutableUrl:"https://3cfb4265.bohonews.pages.dev/",
  edgeRouterOriginDeploymentReference:"02bfbeb2f2b2476c7bc9452b8ea030c98a5c8d3e6c4f4f57e0a897bdfa8cdc25",
  edgeRouterVerificationHash:"8893780c250f13c898de9bbd259fd5ee06c752e78c3535e816f9f3e68d0cc454"
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseId = "release-pb-20260810t051729z-4a823a253ce3-b9797085859b";
const releaseRecord = {
  schemaVersion:"2.1.1", releaseId, deploymentProvider:"cloudflare-pages",
  accountReference:"boho-digital-services.cloudflare.primary-management", project:"bohonews", environment:"production",
  activationDeploymentUrl:activationEvidence.activationImmutableUrl,
  providerActivatedAt:activationEvidence.providerActivatedAt,
  canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,
  newArticleIds:articles.map(({id}) => id), updatedArticleIds:[],
  canonicalUrls:articles.map(({canonicalUrl}) => canonicalUrl),
  activationEvidenceHash:activationEvidence.recordHash,
  previousVerifiedDeploymentReference:activationEvidence.previousVerifiedDeploymentReference
};
releaseRecord.recordHash = digest(releaseRecord);
promotion.releaseRecords.push(releaseRecord);
for (const article of articles) {
  article.publishedAt = activationEvidence.canonicalFirstPublicAt;
  article.updatedAt = activationEvidence.canonicalFirstPublicAt;
  article.releaseId = releaseId;
}
promotion.compilerVersion = "bohonews-manual-maintenance-installer.v1.0.0";
promotion.generatedAt = new Date().toISOString();
promotion.releaseState = "final";
promotion.inputHashes.releaseRecords = digest(promotion.releaseRecords);
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);
const releaseManifest = {
  schemaVersion:promotion.schemaVersion, compilerVersion:promotion.compilerVersion, generatedAt:promotion.generatedAt,
  packageDigest:promotion.packageDigest, articleCount:promotion.inventory.articleCount, mediaCount:promotion.inventory.mediaCount,
  routes:promotion.articles.map(({canonicalUrl}) => new URL(canonicalUrl).pathname),
  releaseRecords:promotion.releaseRecords, releaseState:promotion.releaseState
};
const promotionBytes = Buffer.from(stableJson(promotion));
const releaseBytes = Buffer.from(stableJson(releaseManifest));
writeFileSync(promotionPath,promotionBytes);
writeFileSync(releasePath,releaseBytes);
const {publicContentInventoryDigest} = calculatePublicContentInventory(promotion,releaseManifest,{promotionBytes,releaseBytes,publicRoot:resolve(root,"public")});
const marker = {
  canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,
  finalizerVersion:"bohonews-finalizer.v2.1.1",
  packageDigest:promotion.packageDigest,
  publicContentInventoryDigest,
  releaseId,
  schemaVersion:"1.1.0"
};
marker.markerHash = digest(marker);
writeFileSync(markerPath,stableJson(marker));
mkdirSync(evidenceDir,{recursive:true});
writeFileSync(resolve(evidenceDir,"manual-maintenance-approval.v1.json"),stableJson({...approval,recordHash:approvalDigest}));
writeFileSync(resolve(evidenceDir,"activation-evidence.v1.2.json"),stableJson(activationEvidence));
writeFileSync(resolve(evidenceDir,"release-summary.v1.json"),stableJson({
  schemaVersion:"manual-maintenance-release-summary.v1", batchId:activationEvidence.batchId, releaseId,
  candidatePackageDigest:activationEvidence.candidatePackageDigest, finalPackageDigest:promotion.packageDigest,
  publicContentInventoryDigest, markerHash:marker.markerHash, canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,
  articleIds:articles.map(({id}) => id)
}));
console.log(JSON.stringify({releaseId,approvalDigest,activationEvidenceHash:activationEvidence.recordHash,packageDigest:promotion.packageDigest,publicContentInventoryDigest,markerHash:marker.markerHash,canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt},null,2));
