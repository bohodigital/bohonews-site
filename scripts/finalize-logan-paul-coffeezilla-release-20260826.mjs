import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePublicContentInventory } from "./publishing/validate-content.mjs";
import { stableJson } from "./publishing/stable-json.mjs";

const [batchId, evidenceDirArg, activationInputArg] = process.argv.slice(2);
if (!batchId || !evidenceDirArg || !activationInputArg) {
  throw new Error("Usage: finalize <batch-id> <evidence-dir> <activation-evidence-input.json>");
}
const root = resolve(import.meta.dirname, "..");
const evidenceDir = resolve(evidenceDirArg);
const activationInputPath = resolve(activationInputArg);
const articleId = "article-logan-paul-coffeezilla-settlement-videos-unavailable";
const articleSha256 = "67afbd88e0a5b2656c66f9063fc6096326af89d469180254ee8f58ca122bc57e";
const expectedBodySha256 = "844f5d472f61cdcaeccb2a85ce72bf808c5ef6b61dd1e6c8635718d92f9209e1";
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const markerPath = resolve(root, "public/.well-known/bohonews-release.json");
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const bodyDigest = (value) => createHash("sha256").update(value).digest("hex");
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const article = promotion.articles.find(({ id }) => id === articleId);
if (promotion.releaseState !== "candidate" || !article) {
  throw new Error("Expected the exact Logan Paul-Coffeezilla release candidate");
}
if (article.publishedAt || article.updatedAt || article.releaseId || article.publicChangeLog.length) {
  throw new Error("The Logan Paul-Coffeezilla candidate is already release-bound");
}
if (bodyDigest(Buffer.from(article.body)) !== expectedBodySha256) {
  throw new Error("The approved Logan Paul-Coffeezilla body bytes drifted before finalization");
}
const unbound = promotion.articles.filter(({ publishedAt }) => publishedAt === null);
if (unbound.length !== 1 || unbound[0].id !== articleId) {
  throw new Error("Candidate contains an unexpected release-unbound article");
}

const releaseId = `release-${batchId.toLowerCase()}`;
const approval = {
  schemaVersion: "manual-investigation-approval.v1",
  recordId: "approval-logan-paul-coffeezilla-pending",
  actor: "human-owner",
  automationId: "owner-authorized-logan-paul-coffeezilla-investigation-release",
  batchId,
  decision: "approved",
  approvedAt: new Date().toISOString(),
  candidatePackageDigest: promotion.packageDigest,
  approvedArticleSha256: articleSha256,
  approvedBodySha256: expectedBodySha256,
  articleIds: [articleId],
  homepageLead: {
    pinned: false,
    largestStory: false,
  },
  authorization: "Owner explicitly approved the exact final Logan Paul-Coffeezilla no-response article for live publication as reviewed. Preserve the exact substantive copy, source callouts, citations, no-response disclosure, media-rights boundaries, rollback, activation noindex, and production health gates.",
};
const approvalDigest = digest(approval);
const activationInput = JSON.parse(readFileSync(activationInputPath, "utf8"));
const required = [
  "activationArtifactSha256",
  "activationInventorySha256",
  "activationProviderResponseHash",
  "activationImmutableUrl",
  "providerActivatedAt",
  "canonicalFirstPublicAt",
  "canonicalFirstPublicEvidenceHash",
  "previousVerifiedDeploymentReference",
  "edgeRouterContractVersion",
  "edgeRouterScriptHash",
  "edgeRouterDeploymentResponseHash",
  "edgeRouterActivatedAt",
  "edgeRouterOriginImmutableUrl",
  "edgeRouterOriginDeploymentReference",
  "edgeRouterVerificationHash",
];
if (Object.keys(activationInput).sort().join("\n") !== required.sort().join("\n")) {
  throw new Error("Activation evidence input has an unexpected shape");
}

const activationEvidence = {
  schemaVersion: "1.2.0",
  recordId: `activation-evidence-${batchId.toLowerCase()}`,
  batchId,
  adapterId: "bohonews.article.v2",
  approvalDigest,
  candidatePackageDigest: promotion.packageDigest,
  ...activationInput,
};
activationEvidence.recordHash = digest(activationEvidence);
const releaseRecord = {
  schemaVersion: "2.1.1",
  releaseId,
  deploymentProvider: "cloudflare-pages",
  accountReference: "boho-digital-services.cloudflare.primary-management",
  project: "bohonews",
  environment: "production",
  activationDeploymentUrl: activationEvidence.activationImmutableUrl,
  providerActivatedAt: activationEvidence.providerActivatedAt,
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  newArticleIds: [articleId],
  updatedArticleIds: [],
  canonicalUrls: [article.canonicalUrl],
  activationEvidenceHash: activationEvidence.recordHash,
  previousVerifiedDeploymentReference: activationEvidence.previousVerifiedDeploymentReference,
};
releaseRecord.recordHash = digest(releaseRecord);
const releaseRecordsBefore = promotion.releaseRecords.length;
promotion.releaseRecords.push(releaseRecord);
article.publishedAt = activationEvidence.canonicalFirstPublicAt;
article.updatedAt = activationEvidence.canonicalFirstPublicAt;
article.releaseId = releaseId;
promotion.compilerVersion = "bohonews-manual-logan-paul-coffeezilla-finalizer.v1.0.0";
promotion.generatedAt = new Date().toISOString();
promotion.releaseState = "final";
promotion.inputHashes.releaseRecords = digest(promotion.releaseRecords);
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);
if (promotion.releaseRecords.length !== releaseRecordsBefore + 1) {
  throw new Error("Release-record append preservation failed");
}

const releaseManifest = {
  schemaVersion: promotion.schemaVersion,
  compilerVersion: promotion.compilerVersion,
  generatedAt: promotion.generatedAt,
  packageDigest: promotion.packageDigest,
  articleCount: promotion.inventory.articleCount,
  mediaCount: promotion.inventory.mediaCount,
  routes: promotion.articles.map(({ canonicalUrl }) => new URL(canonicalUrl).pathname),
  releaseRecords: promotion.releaseRecords,
  releaseState: promotion.releaseState,
};
const promotionBytes = Buffer.from(stableJson(promotion));
const releaseBytes = Buffer.from(stableJson(releaseManifest));
writeFileSync(promotionPath, promotionBytes);
writeFileSync(releasePath, releaseBytes);
const { publicContentInventoryDigest } = calculatePublicContentInventory(
  promotion,
  releaseManifest,
  { promotionBytes, releaseBytes, publicRoot: resolve(root, "public") },
);
const marker = {
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  finalizerVersion: "bohonews-finalizer.v2.1.1",
  packageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  releaseId,
  schemaVersion: "1.1.0",
};
marker.markerHash = digest(marker);
writeFileSync(markerPath, stableJson(marker));

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(resolve(evidenceDir, "manual-investigation-approval.v1.json"), stableJson({
  ...approval,
  recordHash: approvalDigest,
}));
writeFileSync(resolve(evidenceDir, "activation-evidence.v1.2.json"), stableJson(activationEvidence));
writeFileSync(resolve(evidenceDir, "release-summary.v1.json"), stableJson({
  schemaVersion: "manual-investigation-release-summary.v1",
  batchId,
  releaseId,
  approvedArticleSha256: articleSha256,
  approvedBodySha256: expectedBodySha256,
  candidatePackageDigest: activationEvidence.candidatePackageDigest,
  finalPackageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  markerHash: marker.markerHash,
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
  articleIds: [articleId],
  homepageLead: false,
}));

console.log(JSON.stringify({
  batchId,
  releaseId,
  approvalDigest,
  activationEvidenceHash: activationEvidence.recordHash,
  packageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  markerHash: marker.markerHash,
  canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
}, null, 2));
