import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePublicContentInventory } from "./publishing/validate-content.mjs";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const markerPath = resolve(root, "public/.well-known/bohonews-release.json");
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const currentMarker = JSON.parse(readFileSync(markerPath, "utf8"));
const part2 = promotion.articles.find(({ slug }) => slug === "interlochen-before-epstein-what-was-known");
const electionData = promotion.articles.find(({ slug }) => slug === "fragmented-election-data");

if (promotion.releaseState !== "final" || !part2 || !electionData) {
  throw new Error("Expected the current final promotion with both correction targets");
}

const replacements = new Map([
  [
    "Boho News sent Interlochen, Sanghavi Law Office and the University of Michigan detailed messages about the findings under consideration for this article on Aug. 3. We also attempted to send a separate archival request to the Bentley Historical Library. [S22]",
    "Boho News sent Interlochen, Sanghavi Law Office and the University of Michigan detailed messages about the findings under consideration for this article on Aug. 3."
  ],
  [
    "According to the editor's record, Elizabeth Sanghavi replied that her standard practice is not to comment on an investigation and that she would share media inquiries about the matter with Interlochen.",
    "Elizabeth Sanghavi replied that her standard practice is not to comment on an investigation and that she would share media inquiries about the matter with Interlochen."
  ],
  [
    "Interlochen's investigation inbox separately acknowledged receiving our message and said it would respond shortly. [S22]",
    "Interlochen's investigation inbox separately acknowledged receiving our message and said it would respond shortly."
  ],
  [
    "No substantive response or requested records were recorded by Aug. 13.",
    "No substantive response or requested records had been received by Aug. 13."
  ],
  [
    "The editor's record says the University of Michigan had not responded by Aug. 13.",
    "The University of Michigan had not responded by Aug. 13."
  ]
]);
const removals = new Set([
  "Source note: S22. The correspondence summary below comes from the editor's contemporaneous record. A credential-blind audit of the authorized Boho News mailbox on Aug. 13 did not locate the original messages, full headers or Message-IDs, so no correspondence artifact is eligible for the public Evidence Room.",
  "The messages were voluntary records and comment requests.",
  "The message intended for Bentley appears not to have been successfully delivered. Because we cannot establish that Bentley received it, we do not characterize the library as having failed to respond.",
  "The complete outgoing messages and on-record responses should be published in the Interlochen Evidence Room only if the original message files and full headers are recovered and verified. Any later substantive response should be reviewed and added through a clearly labeled update when warranted."
]);

for (const [from] of replacements) {
  if (!part2.bodyBlocks.some((block) => block.text === from)) {
    throw new Error(`Part 2 replacement source is missing: ${from.slice(0, 80)}`);
  }
}
for (const text of removals) {
  if (!part2.bodyBlocks.some((block) => block.text === text)) {
    throw new Error(`Part 2 removal source is missing: ${text.slice(0, 80)}`);
  }
}

part2.bodyBlocks = part2.bodyBlocks
  .filter((block) => !removals.has(block.text))
  .map((block) => replacements.has(block.text) ? { ...block, text: replacements.get(block.text) } : block);
part2.body = part2.bodyBlocks
  .filter(({ type }) => type === "paragraph")
  .map(({ text }) => text)
  .join("\n\n");
const citationCount = part2.citations.length;
part2.citations = part2.citations.filter(({ id }) => id !== "s22");
if (part2.citations.length !== citationCount - 1) {
  throw new Error("Part 2 S22 citation was not removed exactly once");
}

const electionOperationalSentence = " BohoNews keeps credentials in an external secret broker and does not store them with reporting or source code.";
const electionBlock = electionData.bodyBlocks.find((block) => block.text?.includes(electionOperationalSentence));
if (!electionBlock || !electionData.body.includes(electionOperationalSentence)) {
  throw new Error("Election operational sentence is missing");
}
electionBlock.text = electionBlock.text.replace(electionOperationalSentence, "");
electionData.body = electionData.body.replace(electionOperationalSentence, "");

promotion.generatedAt = new Date().toISOString();
promotion.inputHashes.articles = digest(promotion.articles);
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);
const releaseManifest = {
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
const promotionBytes = Buffer.from(stableJson(promotion));
const releaseBytes = Buffer.from(stableJson(releaseManifest));
const { publicContentInventoryDigest } = calculatePublicContentInventory(
  promotion,
  releaseManifest,
  { promotionBytes, releaseBytes, publicRoot: resolve(root, "public") }
);
const marker = {
  canonicalFirstPublicAt: currentMarker.canonicalFirstPublicAt,
  finalizerVersion: currentMarker.finalizerVersion,
  packageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  releaseId: currentMarker.releaseId,
  schemaVersion: currentMarker.schemaVersion
};
marker.markerHash = digest(marker);

writeFileSync(promotionPath, promotionBytes);
writeFileSync(releasePath, releaseBytes);
writeFileSync(markerPath, stableJson(marker));
console.log(JSON.stringify({
  packageDigest: promotion.packageDigest,
  publicContentInventoryDigest,
  markerHash: marker.markerHash,
  part2CitationCount: part2.citations.length
}, null, 2));
