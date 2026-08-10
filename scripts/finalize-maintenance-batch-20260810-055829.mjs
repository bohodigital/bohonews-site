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
  "gao-family-support-program-performance-systems-2026",
  "federal-law-enforcement-officers-133798-bjs-2023",
  "koussevitzky-foundation-six-music-commissions-2026",
  "fda-bht-food-additive-comment-period-august-2026",
  "robotic-satellite-servicer-launches-geosynchronous-orbit-2026",
  "state-local-pension-assets-6-49-trillion-2025"
];
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (promotion.releaseState !== "candidate" || articles.some((article) => !article)) throw new Error("Expected the exact six-item candidate");
if (articles.some(({publishedAt,updatedAt,releaseId}) => publishedAt || updatedAt || releaseId)) throw new Error("Articles are already release-bound");

const approval = {
  schemaVersion:"manual-maintenance-approval.v1",
  actor:"human-owner",
  automationId:"boho-news-manual-install-newsroom",
  batchId:"PB-20260810T055829Z-C332B62B2712",
  decision:"approved",
  approvedAt:"2026-08-10T05:58:29.751Z",
  candidatePackageDigest:promotion.packageDigest,
  articleIds:articles.map(({id}) => id),
  authorization:"Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, rollback, and health gates."
};
const approvalDigest = digest(approval);
const activationEvidence = {
  schemaVersion:"1.2.0",
  recordId:"activation-evidence-pb-20260810t055829z-c332b62b2712",
  batchId:"PB-20260810T055829Z-C332B62B2712",
  adapterId:"bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest:promotion.packageDigest,
  activationArtifactSha256:"748911827dfdfe28e7695878d8b097180246b346de4fb19015be8f39f482d411",
  activationInventorySha256:"779c83a9a25ef67df8c24bfc64886fc9d25c7af591af08e2a68889896c62e554",
  activationProviderResponseHash:"7dfe03a12728c6ee0bed618503befc2987fbf18053f891c29481c4f59fb3b7a1",
  activationImmutableUrl:"https://2314d762.bohonews.pages.dev/",
  providerActivatedAt:"2026-08-10T06:33:52.305329Z",
  canonicalFirstPublicAt:"2026-08-10T06:36:18.101Z",
  canonicalFirstPublicEvidenceHash:"a9a9ea43e4df8406f941c15fb8b37dd9b1c56bcc7c983d704a7f5603c50aac95",
  previousVerifiedDeploymentReference:"de32ecd49605244e00526d9e9aa935a3f164c5f77f5ee0aca8a9a77625efae11",
  edgeRouterContractVersion:"bohonews-edge-router.v1.0.0",
  edgeRouterScriptHash:"e7396f5d08feebb422dc9d7ab3bf1605fe7eb6bdcb941b4e5144debade69474b",
  edgeRouterDeploymentResponseHash:"3848a7f33cfe6bd0cedadd08a712a98b9b5c9eb236e008d9ef5ac919ee747873",
  edgeRouterActivatedAt:"2026-08-10T06:34:38.533156Z",
  edgeRouterOriginImmutableUrl:"https://2314d762.bohonews.pages.dev/",
  edgeRouterOriginDeploymentReference:"4e4ee9eb860d84d733d7997221975be8f9bb35dd0ae98a1e7618f83c0a3245c2",
  edgeRouterVerificationHash:"10e0162242042e0b380c9bffe616a5e14bef3fbde324ffcfcd7c9f6758596b69"
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseId = "release-pb-20260810t055829z-c332b62b2712-7dfe03a12728";
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
