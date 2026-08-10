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
  "nih-cancer-models-25-tumor-types-665-models-2026",
  "nist-august-19-2026-lab-tour-registration",
  "farah-okeefe-standard-portland-classic-lpga-exemption-2026",
  "great-atlantic-sargassum-belt-june-2026-records",
  "world-bank-salta-route-51-water-project-100-million",
  "amanda-pascali-library-congress-concert-august-13-2026"
];
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (promotion.releaseState !== "candidate" || articles.some((article) => !article)) throw new Error("Expected the exact six-item candidate");
if (articles.some(({publishedAt,updatedAt,releaseId}) => publishedAt || updatedAt || releaseId)) throw new Error("Articles are already release-bound");

const approval = {
  schemaVersion:"manual-maintenance-approval.v1",
  actor:"human-owner",
  automationId:"boho-news-manual-install-newsroom",
  batchId:"PB-20260810T033529Z-4E99FBC67D36",
  decision:"approved",
  approvedAt:"2026-08-10T03:35:29.302Z",
  candidatePackageDigest:promotion.packageDigest,
  articleIds:articles.map(({id}) => id),
  authorization:"Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, rollback, and health gates."
};
const approvalDigest = digest(approval);
const activationEvidence = {
  schemaVersion:"1.2.0",
  recordId:"activation-evidence-pb-20260810t033529z-4e99fbc67d36",
  batchId:"PB-20260810T033529Z-4E99FBC67D36",
  adapterId:"bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest:promotion.packageDigest,
  activationArtifactSha256:"9c1e5d369ec6c3090a6749c0904561528e20e8380801e4a34731ecdd14bd7e6b",
  activationInventorySha256:"80d40dbaf633d9ee11d4a3fbceac2e4c26fa14186fb16b0b8c660f870922b37c",
  activationProviderResponseHash:"276b84f417dd7042d09a7c516fb94b28eff43712f36b7184047a4b38a0e69254",
  activationImmutableUrl:"https://ec7bb5f3.bohonews.pages.dev/",
  providerActivatedAt:"2026-08-10T04:05:21.599868Z",
  canonicalFirstPublicAt:"2026-08-10T04:07:21.088Z",
  canonicalFirstPublicEvidenceHash:"d0486d8f9db02cb188ed8b1d64ea909e0ae47782ca20f73b71450f534dbcb20c",
  previousVerifiedDeploymentReference:"5342d9cb95669dd1c0492e364f98c84d37e0c008d5d000617857c9ed1ef355a2",
  edgeRouterContractVersion:"bohonews-edge-router.v1.0.0",
  edgeRouterScriptHash:"e28e2ebe0db19933fb2bbec0e1ea179afcbcfa8e41e5b4c2fc00d6971be14ca4",
  edgeRouterDeploymentResponseHash:"3714bb0b54328f9b51a7da392f8f496542ca4bf977d871a6ff519336e8dde9a0",
  edgeRouterActivatedAt:"2026-08-10T04:06:12.409941Z",
  edgeRouterOriginImmutableUrl:"https://ec7bb5f3.bohonews.pages.dev/",
  edgeRouterOriginDeploymentReference:"ffa2dee64ec94173c60703ee42b49d492f3bc813e5c3b5db58c59a9b5a9b2a2c",
  edgeRouterVerificationHash:"f00ca8e8bc0c7d6e305389697c10d140b26c5c80eff4d6b78a1f35a5dccbf0c6"
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseId = "release-pb-20260810t033529z-4e99fbc67d36-276b84f417dd";
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
