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
  "cbo-federal-deficit-1-4-trillion-through-june-2026",
  "field-of-dreams-twins-phillies-august-13-2026",
  "nws-full-ocean-sea-state-analysis-proposal-2026",
  "imf-bangladesh-growth-3-5-percent-fy2027-reform-program",
  "federal-reserve-consumer-credit-june-2026-3-3-percent",
  "arkansas-education-waiver-ed-flex-8-8-million-2026"
];
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (promotion.releaseState !== "candidate" || articles.some((article) => !article)) throw new Error("Expected the exact six-item candidate");
if (articles.some(({ publishedAt, updatedAt, releaseId }) => publishedAt || updatedAt || releaseId)) throw new Error("Articles are already release-bound");

const approval = {
  schemaVersion: "manual-maintenance-approval.v1",
  actor: "human-owner",
  automationId: "boho-news-manual-install-newsroom",
  batchId: "PB-20260810T065029Z-CCCBC6C948CD",
  decision: "approved",
  approvedAt: "2026-08-10T06:50:29.903Z",
  candidatePackageDigest: promotion.packageDigest,
  articleIds: articles.map(({ id }) => id),
  authorization: "Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, append-preservation, rollback, and health gates."
};
const approvalDigest = digest(approval);
const activationEvidence = {
  schemaVersion: "1.2.0",
  recordId: "activation-evidence-pb-20260810t065029z-cccbc6c948cd",
  batchId: "PB-20260810T065029Z-CCCBC6C948CD",
  adapterId: "bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest: promotion.packageDigest,
  activationArtifactSha256: "6f066b89e393763d0d6615d22c826cf40aec4292b00f08178161b0c8fcb69e91",
  activationInventorySha256: "34a34bc030930cf406633cb27e8363a73200228a1d1b8cfc5c405d434a401c46",
  activationProviderResponseHash: "6584626af79b665cc27bf90eadd6d50800b1842eacd5dfdcc412744bcdb3b654",
  activationImmutableUrl: "https://42acb805.bohonews.pages.dev/",
  providerActivatedAt: "2026-08-10T07:24:40.673117Z",
  canonicalFirstPublicAt: "2026-08-10T07:26:51.474Z",
  canonicalFirstPublicEvidenceHash: "ef1294e1013df98567b3e694f89d17b86ec0fc2eda63de2317ace099cf661f82",
  previousVerifiedDeploymentReference: "af510bbb4b0e83d150da40fde4a7e241065980edc85a83417d3e152192566b8f",
  edgeRouterContractVersion: "bohonews-edge-router.v1.0.0",
  edgeRouterScriptHash: "a776384733cf7f7b88ed385a6bb92d928d148eb6ff28ec12a9bb757e1a4af0fe",
  edgeRouterDeploymentResponseHash: "a2e09a95b3f91bc48dcce1cdd173fedafcec581bc42432e6373709068d31f32c",
  edgeRouterActivatedAt: "2026-08-10T07:25:12.832697Z",
  edgeRouterOriginImmutableUrl: "https://42acb805.bohonews.pages.dev/",
  edgeRouterOriginDeploymentReference: "64b86d6639daceb8bfabbd3b24205ed1198af54349bc82d06af03bf0d76286c6",
  edgeRouterVerificationHash: "7d0d36743e163d0be6a3d90ad3b2089f394da736133e4397e3aec8dac18c1935"
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseId = "release-pb-20260810t065029z-cccbc6c948cd-6584626af79b";
const releaseRecord = {
  schemaVersion: "2.1.1", releaseId, deploymentProvider: "cloudflare-pages",
  accountReference: "boho-digital-services.cloudflare.primary-management", project: "bohonews", environment: "production",
  activationDeploymentUrl: activationEvidence.activationImmutableUrl,
  providerActivatedAt: activationEvidence.providerActivatedAt,
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  newArticleIds: articles.map(({ id }) => id), updatedArticleIds: [],
  canonicalUrls: articles.map(({ canonicalUrl }) => canonicalUrl),
  activationEvidenceHash: activationEvidence.recordHash,
  previousVerifiedDeploymentReference: activationEvidence.previousVerifiedDeploymentReference
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
  schemaVersion: promotion.schemaVersion, compilerVersion: promotion.compilerVersion, generatedAt: promotion.generatedAt,
  packageDigest: promotion.packageDigest, articleCount: promotion.inventory.articleCount, mediaCount: promotion.inventory.mediaCount,
  routes: promotion.articles.map(({ canonicalUrl }) => new URL(canonicalUrl).pathname),
  releaseRecords: promotion.releaseRecords, releaseState: promotion.releaseState
};
const promotionBytes = Buffer.from(stableJson(promotion));
const releaseBytes = Buffer.from(stableJson(releaseManifest));
writeFileSync(promotionPath, promotionBytes);
writeFileSync(releasePath, releaseBytes);
const { publicContentInventoryDigest } = calculatePublicContentInventory(promotion, releaseManifest, { promotionBytes, releaseBytes, publicRoot: resolve(root, "public") });
const marker = {
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  finalizerVersion: "bohonews-finalizer.v2.1.1",
  packageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  releaseId,
  schemaVersion: "1.1.0"
};
marker.markerHash = digest(marker);
writeFileSync(markerPath, stableJson(marker));
mkdirSync(evidenceDir, { recursive: true });
writeFileSync(resolve(evidenceDir, "manual-maintenance-approval.v1.json"), stableJson({ ...approval, recordHash: approvalDigest }));
writeFileSync(resolve(evidenceDir, "activation-evidence.v1.2.json"), stableJson(activationEvidence));
writeFileSync(resolve(evidenceDir, "release-summary.v1.json"), stableJson({
  schemaVersion: "manual-maintenance-release-summary.v1", batchId: activationEvidence.batchId, releaseId,
  candidatePackageDigest: activationEvidence.candidatePackageDigest, finalPackageDigest: promotion.packageDigest,
  publicContentInventoryDigest, markerHash: marker.markerHash, canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  articleIds: articles.map(({ id }) => id)
}));
console.log(JSON.stringify({ releaseId, approvalDigest, activationEvidenceHash: activationEvidence.recordHash, packageDigest: promotion.packageDigest, publicContentInventoryDigest, markerHash: marker.markerHash, canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt }, null, 2));
