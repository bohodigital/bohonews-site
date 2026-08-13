import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePublicContentInventory } from "./publishing/validate-content.mjs";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const evidenceDir = resolve(process.argv[2] ?? "interlochen-part2-release-evidence");
const activationInputPath = process.argv[3] ? resolve(process.argv[3]) : null;
if (!activationInputPath) {
  throw new Error("Usage: finalize <evidence-dir> <activation-evidence-input.json>");
}

const batchId = "PB-20260813T233200Z-7D4C1E9A2B60";
const releaseId = "release-pb-20260813t233200z-7d4c1e9a2b60";
const part2Id = "interlochen-before-epstein-what-was-known";
const part1Id = "interlochen-abuse-investigation-report-findings";
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const markerPath = resolve(root, "public/.well-known/bohonews-release.json");
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const part2 = promotion.articles.find(({ id }) => id === part2Id);
const part1 = promotion.articles.find(({ id }) => id === part1Id);
const releaseRecordsBefore = promotion.releaseRecords.length;

if (promotion.releaseState !== "candidate" || !part1 || !part2) {
  throw new Error("Expected exact Interlochen candidate");
}
if (part2.publishedAt || part2.updatedAt || part2.releaseId || part2.publicChangeLog.length) {
  throw new Error("Part 2 is already release-bound");
}
if (!part1.publishedAt || !part1.updatedAt || !part1.releaseId) {
  throw new Error("Part 1 lost its verified release binding");
}
const unbound = promotion.articles.filter(({ publishedAt }) => publishedAt === null);
if (unbound.length !== 1 || unbound[0].id !== part2Id) {
  throw new Error("Candidate contains an unexpected release-unbound article");
}

const approval = {
  schemaVersion: "manual-maintenance-approval.v1",
  actor: "human-owner",
  automationId: "owner-authorized-interlochen-part2-release",
  batchId,
  decision: "approved",
  approvedAt: new Date().toISOString(),
  candidatePackageDigest: promotion.packageDigest,
  articleIds: [part2Id, part1Id],
  authorization: "Owner explicitly approved live publication of Interlochen Part 2, the citation-formatting-only Part 1 update, and Part 2 as the homepage lead; preserve sensitive-investigation manual review, source links, image rights, disclosure, rollback, production Preview-ban, and health gates.",
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
  throw new Error("Activation evidence input has unexpected shape");
}

const activationEvidence = {
  schemaVersion: "1.2.0",
  recordId: "activation-evidence-pb-20260813t233200z-7d4c1e9a2b60",
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
  newArticleIds: [part2Id],
  updatedArticleIds: [],
  canonicalUrls: [part2.canonicalUrl],
  activationEvidenceHash: activationEvidence.recordHash,
  previousVerifiedDeploymentReference: activationEvidence.previousVerifiedDeploymentReference,
};
releaseRecord.recordHash = digest(releaseRecord);
promotion.releaseRecords.push(releaseRecord);
part2.publishedAt = activationEvidence.canonicalFirstPublicAt;
part2.updatedAt = activationEvidence.canonicalFirstPublicAt;
part2.releaseId = releaseId;

promotion.compilerVersion = "bohonews-manual-interlochen-installer.v1.0.0";
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
writeFileSync(
  resolve(evidenceDir, "manual-maintenance-approval.v1.json"),
  stableJson({ ...approval, recordHash: approvalDigest }),
);
writeFileSync(
  resolve(evidenceDir, "activation-evidence.v1.2.json"),
  stableJson(activationEvidence),
);
writeFileSync(
  resolve(evidenceDir, "release-summary.v1.json"),
  stableJson({
    schemaVersion: "manual-maintenance-release-summary.v1",
    batchId,
    releaseId,
    candidatePackageDigest: activationEvidence.candidatePackageDigest,
    finalPackageDigest: promotion.packageDigest,
    publicContentInventoryDigest,
    markerHash: marker.markerHash,
    canonicalFirstPublicAt: activationEvidence.canonicalFirstPublicAt,
    articleIds: [part2Id, part1Id],
  }),
);

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
