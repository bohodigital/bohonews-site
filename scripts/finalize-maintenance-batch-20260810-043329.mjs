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
  "ftc-trend-deploy-refund-checks-672000-2026",
  "osha-safe-sound-week-august-10-16-2026",
  "smithsonian-voices-votes-democracy-exhibit-september-7-2026",
  "nasa-genesis-mission-150-petabytes-ai-2026",
  "ifc-first-euro-benchmark-green-bond-1-billion-2026",
  "doe-65-5-million-oil-gas-technology-funding-2026"
];
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (promotion.releaseState !== "candidate" || articles.some((article) => !article)) throw new Error("Expected the exact six-item candidate");
if (articles.some(({publishedAt,updatedAt,releaseId}) => publishedAt || updatedAt || releaseId)) throw new Error("Articles are already release-bound");

const approval = {
  schemaVersion:"manual-maintenance-approval.v1",
  actor:"human-owner",
  automationId:"boho-news-manual-install-newsroom",
  batchId:"PB-20260810T043329Z-5946453180CB",
  decision:"approved",
  approvedAt:"2026-08-10T04:33:29.474Z",
  candidatePackageDigest:promotion.packageDigest,
  articleIds:articles.map(({id}) => id),
  authorization:"Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, rollback, and health gates."
};
const approvalDigest = digest(approval);
const activationEvidence = {
  schemaVersion:"1.2.0",
  recordId:"activation-evidence-pb-20260810t043329z-5946453180cb",
  batchId:"PB-20260810T043329Z-5946453180CB",
  adapterId:"bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest:promotion.packageDigest,
  activationArtifactSha256:"19fd032f5cbb1042b552e03ca36dc007bb528df6d5a725dad932313b39977d48",
  activationInventorySha256:"d863fba1a9e4b727be9c7b8732f09bc1fadfc4da06f4f1ad6cb08dbf16d116cd",
  activationProviderResponseHash:"a16d9595de7ad52df4f75d57af8811279bc2939ba0279801635af041feca3021",
  activationImmutableUrl:"https://2b8ee7d8.bohonews.pages.dev/",
  providerActivatedAt:"2026-08-10T05:01:23.17019Z",
  canonicalFirstPublicAt:"2026-08-10T05:03:17.356Z",
  canonicalFirstPublicEvidenceHash:"72c70b37d6f765ef97e1509d9791144cdf99007f41272e9081ec9dd6d923c8a7",
  previousVerifiedDeploymentReference:"e1a1fc08363081f876183ccb7d55586d17eaeb917209bb36919fb65fa61252b3",
  edgeRouterContractVersion:"bohonews-edge-router.v1.0.0",
  edgeRouterScriptHash:"a8ff62f2285877f0f51965804bb540a28de54b7a59ad7c595aa2f511a88f6c9f",
  edgeRouterDeploymentResponseHash:"70bf9ea89dc7e5f829fa9fc59c7b0f10fb1213eba129f640502cfea6369b9e9b",
  edgeRouterActivatedAt:"2026-08-10T05:01:53.439412Z",
  edgeRouterOriginImmutableUrl:"https://2b8ee7d8.bohonews.pages.dev/",
  edgeRouterOriginDeploymentReference:"c44e086eb9ee997e3bc295fa91a2a11a0a15257d678a3f589cf78dbb81b88ebe",
  edgeRouterVerificationHash:"db246fcef744974cd816934921946850ff57eb13460b703c843d5ba8bbeeb6eb"
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseId = "release-pb-20260810t043329z-5946453180cb-a16d9595de7a";
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
