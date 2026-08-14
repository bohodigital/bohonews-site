#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform, Readable } from "node:stream";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildStoryCollections,
  metadataForRecord
} from "./evidence/evidence-document-model.mjs";
import { renderEvidenceLibrary } from "./evidence/render-evidence-library.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(root, "tmp", "evidence-pdf-mirror");
const objectRoot = join(outputRoot, "objects");
const previewRoot = join(root, "dist", "evidence");
const previewFilesRoot = join(previewRoot, "files");
const interlochenPreviewRoot = join(
  root,
  "dist",
  "investigations",
  "interlochen",
  "evidence"
);
const packagePath = join(
  root,
  "src",
  "publishing",
  "public-news-promotion-package.v2.1.1.json"
);
const evidenceAssetsPath = join(root, "src", "lib", "evidence-assets.json");
const maximumPdfBytes = 350 * 1024 * 1024;
const userAgent = "Boho-News-Local-Evidence-Mirror/1.0 (+local editorial preservation)";

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function isPdfPath(value) {
  try {
    return /\.pdf$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

function safeName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "document.pdf";
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

function pdfPages(path) {
  try {
    const output = execFileSync("pdfinfo", [path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const match = output.match(/^Pages:\s+(\d+)$/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function pdfMetadata(path) {
  try {
    const output = execFileSync("pdfinfo", [path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const values = Object.fromEntries(output.split("\n").flatMap((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      return match ? [[match[1].trim().toLowerCase(), match[2].trim()]] : [];
    }));
    return {
      title: values.title || null,
      author: values.author || null,
      subject: values.subject || null,
      keywords: values.keywords || null,
      creator: values.creator || null,
      producer: values.producer || null,
      creationDate: values.creationdate || null,
      modificationDate: values.moddate || null,
      language: values.language || null
    };
  } catch {
    return {};
  }
}

function pdfText(path) {
  try {
    return execFileSync("pdftotext", ["-f", "1", "-l", "2", "-layout", path, "-"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 2 * 1024 * 1024
    }).replace(/\s+/g, " ").trim().slice(0, 12_000);
  } catch {
    return "";
  }
}

async function isPdfFile(path) {
  const handle = await import("node:fs/promises").then(({ open }) => open(path, "r"));
  try {
    const header = Buffer.alloc(5);
    const { bytesRead } = await handle.read(header, 0, 5, 0);
    return bytesRead === 5 && header.toString("ascii") === "%PDF-";
  } finally {
    await handle.close();
  }
}

async function mapLimit(values, limit, action) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= values.length) return;
      results[index] = await action(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

async function probePdf(url) {
  if (isPdfPath(url)) return { isPdf: true, discovery: "pdf-url" };
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/pdf,text/html;q=0.8,*/*;q=0.3",
        Range: "bytes=0-15",
        "User-Agent": userAgent
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    let prefix = Buffer.alloc(0);
    if (response.body) {
      const reader = response.body.getReader();
      while (prefix.length < 5) {
        const { done, value } = await reader.read();
        if (done) break;
        prefix = Buffer.concat([prefix, Buffer.from(value)]).subarray(0, 16);
      }
      await reader.cancel();
    }
    const magic = prefix.subarray(0, 5).toString("ascii") === "%PDF-";
    const typed = /application\/pdf/i.test(contentType);
    return {
      isPdf: response.ok && (magic || typed),
      discovery: magic ? "pdf-signature" : typed ? "pdf-content-type" : "not-pdf",
      status: response.status,
      contentType,
      finalUrl: response.url
    };
  } catch (error) {
    return { isPdf: false, discovery: "probe-error", error: String(error.message ?? error) };
  }
}

async function downloadPdf(url, urlKey) {
  const partial = join(outputRoot, `${urlKey}.partial`);
  await rm(partial, { force: true });
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(120_000),
      headers: {
        Accept: "application/pdf,*/*;q=0.2",
        "User-Agent": userAgent
      }
    });
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > maximumPdfBytes) {
      throw new Error(`declared size ${declared} exceeds local mirror ceiling`);
    }
    const hash = createHash("sha256");
    let bytes = 0;
    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > maximumPdfBytes) {
          callback(new Error("download exceeded local mirror ceiling"));
          return;
        }
        hash.update(chunk);
        callback(null, chunk);
      }
    });
    await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(partial, { mode: 0o600 }));
    if (!(await isPdfFile(partial))) throw new Error("downloaded response is not a PDF");
    const digest = hash.digest("hex");
    const objectPath = join(objectRoot, `${digest}.pdf`);
    try {
      await stat(objectPath);
      await rm(partial, { force: true });
    } catch {
      await rename(partial, objectPath);
    }
    return {
      ok: true,
      sha256: digest,
      bytes,
      pages: pdfPages(objectPath),
      objectPath,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? null,
      etag: response.headers.get("etag") ?? null,
      lastModified: response.headers.get("last-modified") ?? null
    };
  } catch (error) {
    await rm(partial, { force: true });
    return { ok: false, error: String(error.message ?? error) };
  }
}

async function snapshotSourcePage(url) {
  const limit = 2 * 1024 * 1024;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(45_000),
      headers: {
        Accept: "text/html,application/xhtml+xml,*/*;q=0.4",
        "User-Agent": userAgent
      }
    });
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    let complete = true;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = limit - bytes;
      if (remaining <= 0) {
        complete = false;
        await reader.cancel();
        break;
      }
      const chunk = Buffer.from(value).subarray(0, remaining);
      chunks.push(chunk);
      bytes += chunk.length;
      if (chunk.length < value.length || bytes >= limit) {
        complete = false;
        await reader.cancel();
        break;
      }
    }
    const body = Buffer.concat(chunks);
    const html = body.toString("utf8");
    const cleanText = (value) => String(value ?? "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
    const pageTitle = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]).slice(0, 500) || null;
    const heading = cleanText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]).slice(0, 500) || null;
    const canonicalHref = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*canonical[^"']*["']/i)?.[1]
      ?? null;
    let canonicalResolved = null;
    try {
      canonicalResolved = canonicalHref ? new URL(canonicalHref, response.url).href : null;
    } catch {
      canonicalResolved = null;
    }
    const identity = {
      finalUrl: response.url,
      pageTitle,
      heading,
      canonicalUrl: canonicalResolved
    };
    return {
      ok: true,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? null,
      etag: response.headers.get("etag") ?? null,
      lastModified: response.headers.get("last-modified") ?? null,
      fingerprintSha256: sha256Bytes(Buffer.from(JSON.stringify(identity))),
      fingerprintBytes: body.length,
      fingerprintComplete: complete,
      identityVersion: "html-title-h1-canonical-v1",
      identity
    };
  } catch (error) {
    return { ok: false, error: String(error.message ?? error) };
  }
}

function sourceCheck(url, result, previous, checkedAt, { pdf = false } = {}) {
  const currentFingerprint = pdf ? result.sha256 : result.fingerprintSha256;
  const previousCandidate = previous?.sourceChecks?.find((item) => item.url === url);
  const previousCheck = !pdf && previousCandidate?.identityVersion !== result.identityVersion
    ? null
    : previousCandidate;
  const firstFingerprint = previousCheck?.firstObservedSha256
    ?? (pdf ? previous?.sha256 : null)
    ?? currentFingerprint
    ?? null;
  const firstCheckedAt = previousCheck?.firstCheckedAt
    ?? previous?.retrievedAt
    ?? checkedAt;
  let comparison = "unavailable";
  if (result.ok) {
    if (!previousCheck && (!previous || !pdf)) comparison = "baseline-created";
    else if (currentFingerprint === firstFingerprint) comparison = pdf ? "exact-match" : "unchanged";
    else comparison = "changed";
  }
  const observations = [...(previousCheck?.observations ?? [])];
  if (currentFingerprint && !observations.some((item) => item.sha256 === currentFingerprint)) {
    observations.push({ sha256: currentFingerprint, observedAt: checkedAt });
  }
  return {
    url,
    firstCheckedAt,
    lastCheckedAt: checkedAt,
    reachable: result.ok,
    status: result.status ?? null,
    finalUrl: result.finalUrl ?? url,
    contentType: result.contentType ?? null,
    etag: result.etag ?? null,
    lastModified: result.lastModified ?? null,
    firstObservedSha256: firstFingerprint,
    currentObservedSha256: currentFingerprint ?? null,
    comparison,
    observations,
    identityVersion: result.identityVersion ?? (pdf ? "pdf-sha256-v1" : null),
    identity: result.identity ?? null,
    error: result.ok ? null : result.error
  };
}

async function admitLocalPdf(path, origin) {
  if (!(await isPdfFile(path))) return { ok: false, error: "local file is not a PDF" };
  const digest = await sha256File(path);
  const metadata = await stat(path);
  const objectPath = join(objectRoot, `${digest}.pdf`);
  try {
    await stat(objectPath);
  } catch {
    await copyFile(path, objectPath);
  }
  return {
    ok: true,
    sha256: digest,
    bytes: metadata.size,
    pages: pdfPages(objectPath),
    objectPath,
    origin
  };
}

function associationKey(item) {
  return [item.articleSlug, item.sourceId, item.title, item.publisher].join("\u0000");
}

function mergeAssociations(...lists) {
  const values = new Map();
  for (const item of lists.flat()) {
    if (!item) continue;
    values.set(associationKey(item), item);
  }
  return [...values.values()].sort((a, b) =>
    `${a.articleSlug}:${a.sourceId}`.localeCompare(`${b.articleSlug}:${b.sourceId}`)
  );
}

function isGenericAssociationTitle(title) {
  return !title || title === "Supporting PDF referenced by article data";
}

await mkdir(objectRoot, { recursive: true, mode: 0o700 });
const runStartedAt = new Date().toISOString();

const previousByUrl = new Map();
const previousBySha = new Map();
try {
  const previous = JSON.parse(await readFile(join(outputRoot, "manifest.json"), "utf8"));
  for (const record of previous.records ?? []) {
    if (!record.ok || !record.sha256) continue;
    previousBySha.set(record.sha256, record);
    for (const url of record.originalUrls ?? []) previousByUrl.set(url, record);
  }
} catch {
  // A first run has no cache. The mirror remains reproducible from source URLs.
}

const promotion = JSON.parse(await readFile(packagePath, "utf8"));
const evidenceAssets = JSON.parse(await readFile(evidenceAssetsPath, "utf8"));
const articles = promotion.articles.filter(
  (article) => !article.fixture && article.publicationStatus === "approved"
);
const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
const references = new Map();

function addReference(rawUrl, association, discovery) {
  const url = canonicalUrl(rawUrl);
  if (!url) return;
  const record = references.get(url) ?? { url, associations: [], discoveries: new Set() };
  record.associations = mergeAssociations(record.associations, association);
  record.discoveries.add(discovery);
  references.set(url, record);
}

for (const article of articles) {
  for (const [citationIndex, citation] of article.citations.entries()) {
    addReference(citation.url, {
      articleSlug: article.slug,
      articleHeadline: article.headline,
      articleDek: article.dek,
      articlePublishedAt: article.publishedAt,
      articleAuthors: article.authors,
      articleSection: article.section ?? article.desk,
      sourceId: citation.id,
      citationIndex,
      publishedAt: citation.publishedAt,
      title: citation.title,
      publisher: citation.publisher,
      sourceUrl: citation.url
    }, "article-citation");
  }
  const walk = (value, path = "") => {
    if (typeof value === "string" && /^https?:\/\//.test(value) && /\.pdf(?:$|[?#])/i.test(value)) {
      addReference(value, {
        articleSlug: article.slug,
        articleHeadline: article.headline,
        articleDek: article.dek,
        articlePublishedAt: article.publishedAt,
        articleAuthors: article.authors,
        articleSection: article.section ?? article.desk,
        sourceId: path,
        title: "Supporting PDF referenced by article data",
        publisher: new URL(value).hostname,
        sourceUrl: value
      }, "article-supporting-pdf");
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key);
    }
  };
  walk(article);
}

const candidates = [...references.values()];
const externalCandidates = candidates.filter(({ url }) => new URL(url).hostname !== "bohonews.com");
process.stdout.write(`Probing ${externalCandidates.length} external citation URLs for PDF content...\n`);
const probes = await mapLimit(externalCandidates, 10, async (candidate, index) => {
  const result = await probePdf(candidate.url);
  if ((index + 1) % 50 === 0) process.stdout.write(`Probed ${index + 1}/${externalCandidates.length}\n`);
  return [candidate.url, result];
});
const probeByUrl = new Map(probes);

const pdfReferences = candidates.filter((candidate) => {
  const parsed = new URL(candidate.url);
  if (parsed.hostname === "bohonews.com") return isPdfPath(candidate.url);
  return probeByUrl.get(candidate.url)?.isPdf === true;
});

const recordsByIdentity = new Map();
function collectRecord(key, value) {
  const existing = recordsByIdentity.get(key);
  if (!existing) {
    recordsByIdentity.set(key, value);
    return;
  }
  existing.associations = mergeAssociations(existing.associations, value.associations);
  existing.originalUrls = [...new Set([...existing.originalUrls, ...value.originalUrls])].sort();
  existing.origins = [...new Set([...(existing.origins ?? []), ...(value.origins ?? [])])].sort();
  existing.sourceChecks = [...new Map([...(existing.sourceChecks ?? []), ...(value.sourceChecks ?? [])]
    .map((item) => [item.url, item])).values()];
  existing.firstPreservedAt = [existing.firstPreservedAt, value.firstPreservedAt]
    .filter(Boolean).sort()[0] ?? existing.firstPreservedAt;
  if (!existing.displayName && value.displayName) existing.displayName = value.displayName;
}

for (const asset of evidenceAssets.filter((item) => item.mediaType === "application/pdf")) {
  const localPath = join(root, "public", asset.path.replace(/^\//, ""));
  const admitted = await admitLocalPdf(localPath, "existing-public-evidence");
  const associations = asset.storySlugs.flatMap((articleSlug) => {
    const article = articleBySlug.get(articleSlug);
    return asset.sourceIds.map((sourceId) => {
      const citationIndex = article?.citations.findIndex((item) => String(item.id).toLowerCase() === String(sourceId).toLowerCase());
      const citation = citationIndex >= 0 ? article.citations[citationIndex] : null;
      return {
        articleSlug,
        articleHeadline: article?.headline ?? articleSlug,
        articleDek: article?.dek,
        articlePublishedAt: article?.publishedAt,
        articleAuthors: article?.authors,
        articleSection: article?.section ?? article?.desk,
        sourceId,
        citationIndex: citationIndex >= 0 ? citationIndex : null,
        publishedAt: citation?.publishedAt ?? null,
        title: citation?.title ?? asset.title,
        publisher: citation?.publisher ?? asset.publisher,
        sourceUrl: citation?.url ?? null
      };
    });
  });
  collectRecord(`sha256:${admitted.sha256}`, {
    ...admitted,
    displayName: asset.title,
    associations,
    originalUrls: associations.map((item) => canonicalUrl(item.sourceUrl)).filter(Boolean),
    origins: ["existing-public-evidence"],
    discovery: "existing evidence mirror",
    retrievedAt: previousBySha.get(admitted.sha256)?.retrievedAt ?? runStartedAt,
    firstPreservedAt: previousBySha.get(admitted.sha256)?.firstPreservedAt
      ?? previousBySha.get(admitted.sha256)?.retrievedAt
      ?? runStartedAt
  });
}

const handoffRoot = process.env.BOHONEWS_INTERLOCHEN_HANDOFF;
if (handoffRoot) {
  const sourceRoot = join(handoffRoot, "sources-cited");
  const names = (await readdir(sourceRoot)).filter((name) => extname(name).toLowerCase() === ".pdf").sort();
  for (const name of names) {
    const localPath = join(sourceRoot, name);
    const admitted = await admitLocalPdf(localPath, "interlochen-handoff");
    const sourceId = name.match(/^(S\d+)/)?.[1] ?? "interlochen-handoff";
    const article = articleBySlug.get("interlochen-before-epstein-what-was-known");
    const citationIndex = article?.citations.findIndex((item) => String(item.id).toLowerCase() === sourceId.toLowerCase());
    const citation = citationIndex >= 0 ? article.citations[citationIndex] : null;
    collectRecord(`sha256:${admitted.sha256}`, {
      ...admitted,
      sourceFileName: name,
      displayName: citation?.title ?? name.replace(/\.pdf$/i, "").replaceAll("-", " "),
      associations: [{
        articleSlug: "interlochen-before-epstein-what-was-known",
        articleHeadline: article?.headline,
        articleDek: article?.dek,
        articlePublishedAt: article?.publishedAt,
        articleAuthors: article?.authors,
        articleSection: article?.section ?? article?.desk,
        sourceId,
        citationIndex: citationIndex >= 0 ? citationIndex : null,
        publishedAt: citation?.publishedAt ?? null,
        title: citation?.title ?? name.replace(/\.pdf$/i, "").replaceAll("-", " "),
        publisher: citation?.publisher ?? "Boho News source archive",
        sourceUrl: citation?.url ?? null
      }],
      originalUrls: citation?.url ? [canonicalUrl(citation.url)] : [],
      origins: ["interlochen-handoff"],
      retrievedAt: previousBySha.get(admitted.sha256)?.retrievedAt ?? runStartedAt,
      firstPreservedAt: previousBySha.get(admitted.sha256)?.firstPreservedAt
        ?? previousBySha.get(admitted.sha256)?.retrievedAt
        ?? runStartedAt
    });
  }
}

process.stdout.write(`Downloading ${pdfReferences.length} cited PDF URLs...\n`);
const checkByUrl = new Map();
const downloads = await mapLimit(pdfReferences, 4, async (reference, index) => {
  const key = sha256Bytes(Buffer.from(reference.url)).slice(0, 20);
  const cached = previousByUrl.get(reference.url);
  const fresh = await downloadPdf(reference.url, key);
  const check = sourceCheck(reference.url, fresh, cached, runStartedAt, { pdf: true });
  checkByUrl.set(reference.url, check);
  let result = fresh;
  if (!fresh.ok && cached) {
    const objectPath = join(objectRoot, `${cached.sha256}.pdf`);
    try {
      if (!(await isPdfFile(objectPath))) throw new Error("cached object is not a PDF");
      result = {
        ok: true,
        sha256: cached.sha256,
        bytes: cached.bytes,
        pages: cached.pages,
        objectPath,
        finalUrl: cached.finalUrl,
        contentType: cached.contentType,
        preservedFallback: true
      };
    } catch {
      result = fresh;
    }
  }
  if ((index + 1) % 10 === 0 || index + 1 === pdfReferences.length) {
    process.stdout.write(`Downloaded ${index + 1}/${pdfReferences.length}\n`);
  }
  return { reference, probe: probeByUrl.get(reference.url), result, check };
});

for (const { reference, probe, result, check } of downloads) {
  const value = {
    ...result,
    associations: reference.associations,
    originalUrls: [reference.url],
    origins: [...reference.discoveries],
    retrievedAt: check.firstCheckedAt,
    firstPreservedAt: check.firstCheckedAt,
    sourceChecks: [check],
    finalUrl: result.finalUrl ?? probe?.finalUrl ?? reference.url,
    displayName: reference.associations.find((item) => !isGenericAssociationTitle(item.title))?.title
      ?? safeName(new URL(reference.url).pathname.split("/").pop() ?? "document.pdf")
  };
  collectRecord(result.ok ? `sha256:${result.sha256}` : `url:${reference.url}`, value);
}

// A custodian can replace a PDF URL with an HTML interstitial after publication.
// When a strong document identifier in that dead URL already exists in the
// admitted corpus, bind the citation to those preserved bytes instead of
// presenting a false missing-document result.
for (const [key, failed] of [...recordsByIdentity]) {
  if (failed.ok || !key.startsWith("url:")) continue;
  const identifiers = failed.originalUrls.flatMap((value) =>
    (new URL(value).pathname.match(/[A-Za-z]+[0-9][A-Za-z0-9_-]{6,}/g) ?? [])
      .map((token) => token.toLowerCase())
  );
  if (!identifiers.length) continue;
  const match = [...recordsByIdentity.values()].find((candidate) => {
    if (!candidate.ok) return false;
    const haystack = [
      candidate.displayName,
      ...candidate.originalUrls,
      ...candidate.associations.flatMap((item) => [item.title, item.sourceId])
    ].join(" ").toLowerCase();
    return identifiers.some((identifier) => haystack.includes(identifier));
  });
  if (!match) continue;
  match.associations = mergeAssociations(match.associations, failed.associations);
  match.originalUrls = [...new Set([...match.originalUrls, ...failed.originalUrls])].sort();
  match.origins = [...new Set([...(match.origins ?? []), "preserved-custodian-fallback"])].sort();
  match.sourceChecks = [...new Map([...(match.sourceChecks ?? []), ...(failed.sourceChecks ?? [])]
    .map((item) => [item.url, item])).values()];
  recordsByIdentity.delete(key);
}

const uncheckedUrls = [...new Set([...recordsByIdentity.values()]
  .flatMap((record) => record.originalUrls)
  .filter((url) => !checkByUrl.has(url)))];
if (uncheckedUrls.length) process.stdout.write(`Checking ${uncheckedUrls.length} source landing pages...\n`);
const pageChecks = await mapLimit(uncheckedUrls, 6, async (url, index) => {
  const result = await snapshotSourcePage(url);
  const check = sourceCheck(url, result, previousByUrl.get(url), runStartedAt);
  if ((index + 1) % 10 === 0 || index + 1 === uncheckedUrls.length) {
    process.stdout.write(`Checked ${index + 1}/${uncheckedUrls.length} source pages\n`);
  }
  return [url, check];
});
for (const [url, check] of pageChecks) checkByUrl.set(url, check);
for (const record of recordsByIdentity.values()) {
  record.sourceChecks = record.originalUrls.map((url) => checkByUrl.get(url)).filter(Boolean);
}

const records = [...recordsByIdentity.values()].sort((a, b) => {
  if (a.ok !== b.ok) return a.ok ? -1 : 1;
  return (a.displayName ?? "").localeCompare(b.displayName ?? "");
});

for (const record of records) {
  if (record.ok) {
    record.pdfMetadata = pdfMetadata(record.objectPath);
    record.pdfText = pdfText(record.objectPath);
  } else {
    record.pdfMetadata = {};
    record.pdfText = "";
  }
  record.metadata = metadataForRecord(record);
  delete record.pdfText;
}
const stories = buildStoryCollections(records, articles);

await rm(previewFilesRoot, { recursive: true, force: true });
await mkdir(previewFilesRoot, { recursive: true });
for (const record of records.filter((item) => item.ok)) {
  await copyFile(record.objectPath, join(previewFilesRoot, `${record.sha256}.pdf`));
}

const manifest = {
  schemaVersion: "bohonews.local-pdf-evidence-library.v2",
  localOnly: true,
  generatedAt: runStartedAt,
  articleCount: articles.length,
  citationUrlCount: references.size,
  detectedPdfUrlCount: pdfReferences.length,
  recordCount: records.length,
  mirroredCount: records.filter((item) => item.ok).length,
  failureCount: records.filter((item) => !item.ok).length,
  records: records.map(({ objectPath, ...record }) => ({
    ...record,
    localPath: record.ok ? `/evidence/files/${record.sha256}.pdf` : null
  }))
};

const publicManifest = {
  schemaVersion: "bohonews.evidence-library.v2",
  updatedAt: runStartedAt,
  documentCount: records.filter((item) => item.ok).length,
  storyCount: stories.length,
  pageCount: records.reduce((sum, item) => sum + (item.pages ?? 0), 0),
  taxonomy: Object.entries(Object.groupBy(records, (record) => record.metadata.documentType.id)).map(([id, items]) => ({
    id,
    label: items[0].metadata.documentType.label,
    documentCount: items.length
  })).sort((a, b) => a.label.localeCompare(b.label)),
  documents: records.map(({ objectPath, origins, discovery, error, ...record }) => ({
    ...record,
    documentId: record.sha256 ? `sha256:${record.sha256}` : null,
    associations: record.associations.map((item) => ({
      articleSlug: item.articleSlug,
      articleHeadline: item.articleHeadline,
      sourceId: item.sourceId,
      citationIndex: item.citationIndex ?? null
    })),
    localPath: record.ok ? `/evidence/files/${record.sha256}.pdf` : null
  })),
  stories: stories.map((story) => ({
    slug: story.slug,
    headline: story.headline,
    publishedAt: story.publishedAt,
    authors: story.authors,
    documentIds: story.records.map((record) => `sha256:${record.sha256}`),
    suggestedDocumentIds: story.suggested.map((record) => `sha256:${record.sha256}`)
  }))
};

await mkdir(previewRoot, { recursive: true });
await mkdir(interlochenPreviewRoot, { recursive: true });
await writeFile(join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
await writeFile(join(previewRoot, "pdf-mirror-manifest.json"), JSON.stringify(publicManifest, null, 2) + "\n");
await writeFile(join(previewRoot, "index.html"), renderEvidenceLibrary(records, stories));
await writeFile(join(interlochenPreviewRoot, "index.html"), renderEvidenceLibrary(records, stories, { interlochenOnly: true }));

process.stdout.write(JSON.stringify({
  articleCount: manifest.articleCount,
  citationUrlCount: manifest.citationUrlCount,
  detectedPdfUrlCount: manifest.detectedPdfUrlCount,
  recordCount: manifest.recordCount,
  mirroredCount: manifest.mirroredCount,
  failureCount: manifest.failureCount,
  previewPath: join(previewRoot, "index.html")
}, null, 2) + "\n");
