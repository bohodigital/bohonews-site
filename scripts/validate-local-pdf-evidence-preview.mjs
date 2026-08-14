#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "tmp", "evidence-pdf-mirror", "manifest.json");
const publicManifestPath = join(root, "dist", "evidence", "pdf-mirror-manifest.json");
const promotionPath = join(root, "src", "publishing", "public-news-promotion-package.v2.1.1.json");
const evidenceAssetsPath = join(root, "src", "lib", "evidence-assets.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const publicManifest = JSON.parse(await readFile(publicManifestPath, "utf8"));
const promotion = JSON.parse(await readFile(promotionPath, "utf8"));
const evidenceAssets = JSON.parse(await readFile(evidenceAssetsPath, "utf8"));

if (manifest.localOnly !== true || publicManifest.localOnly !== true) {
  throw new Error("local-only evidence marker is missing");
}
if (manifest.failureCount !== 0 || manifest.records.some((record) => !record.ok)) {
  throw new Error("PDF evidence mirror retains unresolved records");
}
if (manifest.recordCount !== manifest.records.length || manifest.mirroredCount !== manifest.records.length) {
  throw new Error("PDF evidence mirror counts are inconsistent");
}
if (JSON.stringify(manifest) !== JSON.stringify(publicManifest)) {
  throw new Error("private and preview manifests differ");
}

const ids = new Set();
const mirroredOriginalUrls = new Set(manifest.records.flatMap((record) => record.originalUrls));
let bytes = 0;
let pages = 0;
for (const record of manifest.records) {
  if (!/^[0-9a-f]{64}$/.test(record.sha256)) throw new Error(`invalid hash: ${record.sha256}`);
  if (ids.has(record.sha256)) throw new Error(`duplicate object record: ${record.sha256}`);
  ids.add(record.sha256);
  const path = join(root, "dist", record.localPath.replace(/^\//, ""));
  const metadata = await stat(path);
  if (metadata.size !== record.bytes) throw new Error(`size mismatch: ${record.localPath}`);
  const hash = createHash("sha256");
  let prefix = Buffer.alloc(0);
  for await (const chunk of createReadStream(path)) {
    if (prefix.length < 5) prefix = Buffer.concat([prefix, chunk]).subarray(0, 5);
    hash.update(chunk);
  }
  if (prefix.toString("ascii") !== "%PDF-") throw new Error(`not a PDF: ${record.localPath}`);
  if (hash.digest("hex") !== record.sha256) throw new Error(`hash mismatch: ${record.localPath}`);
  if (!Number.isInteger(record.pages) || record.pages < 1) throw new Error(`invalid page count: ${record.localPath}`);
  if (!record.associations.length) throw new Error(`orphan PDF record: ${record.localPath}`);
  bytes += record.bytes;
  pages += record.pages;
}

const explicitPdfUrls = new Set();
const walk = (value) => {
  if (typeof value === "string" && /^https?:\/\//.test(value) && /\.pdf(?:$|[?#])/i.test(value)) {
    const url = new URL(value);
    url.hash = "";
    explicitPdfUrls.add(url.href);
  } else if (Array.isArray(value)) {
    value.forEach(walk);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(walk);
  }
};
promotion.articles
  .filter((article) => !article.fixture && article.publicationStatus === "approved")
  .forEach(walk);
for (const url of explicitPdfUrls) {
  if (!mirroredOriginalUrls.has(url)) throw new Error(`explicit article PDF is not mirrored: ${url}`);
}
for (const asset of evidenceAssets.filter((item) => item.mediaType === "application/pdf")) {
  if (!ids.has(asset.sha256)) throw new Error(`existing evidence PDF is not mirrored: ${asset.path}`);
}
let handoffPdfs = 0;
if (process.env.BOHONEWS_INTERLOCHEN_HANDOFF) {
  const sourceRoot = join(process.env.BOHONEWS_INTERLOCHEN_HANDOFF, "sources-cited");
  for (const name of (await readdir(sourceRoot)).filter((value) => /\.pdf$/i.test(value))) {
    const digest = createHash("sha256").update(await readFile(join(sourceRoot, name))).digest("hex");
    if (!ids.has(digest)) throw new Error(`Interlochen handoff PDF is not mirrored: ${name}`);
    handoffPdfs += 1;
  }
}

for (const path of [
  join(root, "dist", "evidence", "index.html"),
  join(root, "dist", "investigations", "interlochen", "evidence", "index.html")
]) {
  const html = await readFile(path, "utf8");
  if (!html.includes('name="robots" content="noindex,nofollow"')) throw new Error(`preview is indexable: ${path}`);
  if (!html.includes("Local-only editorial preview")) throw new Error(`preview banner is missing: ${path}`);
  if (!html.includes("/evidence/files/")) throw new Error(`preview lacks local PDF links: ${path}`);
}

console.log(JSON.stringify({
  ok: true,
  records: manifest.records.length,
  bytes,
  pages,
  explicitPdfUrls: explicitPdfUrls.size,
  existingEvidencePdfs: evidenceAssets.filter((item) => item.mediaType === "application/pdf").length,
  handoffPdfs,
  associatedArticles: new Set(
    manifest.records.flatMap((record) => record.associations.map((item) => item.articleSlug)).filter(Boolean)
  ).size
}, null, 2));
