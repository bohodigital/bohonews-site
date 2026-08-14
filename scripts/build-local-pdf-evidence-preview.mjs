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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? null
    };
  } catch (error) {
    await rm(partial, { force: true });
    return { ok: false, error: String(error.message ?? error) };
  }
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

function associationDisplayScore(item) {
  let score = 0;
  if (item.sourceId && !/[.[\]]/.test(item.sourceId)) score += 3;
  if (item.publisher && item.publisher !== "Source custodian") score += 2;
  if (!isGenericAssociationTitle(item.title)) score += 2;
  return score;
}

function recordCard(record) {
  const displayAssociations = [...record.associations]
    .sort((a, b) => associationDisplayScore(b) - associationDisplayScore(a))
    .reduce((items, item) => {
      const key = item.articleSlug ?? `${item.sourceId}:${item.title}`;
      if (!items.has(key)) items.set(key, item);
      return items;
    }, new Map());
  const associations = [...displayAssociations.values()]
    .map((item) => `<li><a href="/articles/${escapeHtml(item.articleSlug)}/">${escapeHtml(item.articleHeadline ?? item.articleSlug)}</a><span>${escapeHtml(item.sourceId ?? "supporting PDF")} · ${escapeHtml(item.publisher ?? "Source custodian")}</span></li>`)
    .join("");
  const title = (!isGenericAssociationTitle(record.displayName) ? record.displayName : null)
    ?? record.associations.find((item) => !isGenericAssociationTitle(item.title))?.title
    ?? record.displayName
    ?? "Preserved source PDF";
  const mirrorAction = record.ok
    ? `<a class="primary" href="/evidence/files/${record.sha256}.pdf">Open local PDF</a>`
    : "";
  const originalAction = record.originalUrls[0]
    ? `<a href="${escapeHtml(record.originalUrls[0])}" rel="noopener noreferrer">Original source</a>`
    : "";
  const search = [title, ...record.originalUrls, ...record.associations.flatMap((item) => [item.articleSlug, item.articleHeadline, item.publisher, item.sourceId])].join(" ");
  return `<article class="document-card" data-status="${record.ok ? "mirrored" : "missing"}" data-search="${escapeHtml(search.toLowerCase())}">
    <div class="document-card__top">
      <p class="document-status">${record.ok ? "Locally preserved" : "Acquisition failed"}</p>
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div class="document-meta">
      ${record.ok ? `<span>${record.pages ?? "?"} pages</span><span>${(record.bytes / 1024 / 1024).toFixed(2)} MB</span>` : `<span>${escapeHtml(record.error ?? "Unavailable")}</span>`}
      ${record.discovery ? `<span>${escapeHtml(record.discovery)}</span>` : ""}
    </div>
    <div class="document-actions">${mirrorAction}${originalAction}</div>
    ${record.ok ? `<details><summary>Integrity and provenance</summary><dl><dt>SHA-256</dt><dd><code>${record.sha256}</code></dd><dt>Retrieved</dt><dd>${escapeHtml(record.retrievedAt)}</dd>${record.finalUrl ? `<dt>Resolved URL</dt><dd>${escapeHtml(record.finalUrl)}</dd>` : ""}</dl></details>` : ""}
    <div class="used-by"><h3>Used by</h3><ul>${associations || "<li>Existing evidence archive</li>"}</ul></div>
  </article>`;
}

function previewHtml(manifest, records, { interlochenOnly = false } = {}) {
  const filtered = interlochenOnly
    ? records.filter((record) => record.associations.some((item) => item.articleSlug?.includes("interlochen")) || record.displayName?.toLowerCase().includes("interlochen"))
    : records;
  const mirrored = filtered.filter((record) => record.ok);
  const failures = filtered.filter((record) => !record.ok);
  const totalPages = mirrored.reduce((sum, record) => sum + (record.pages ?? 0), 0);
  const totalBytes = mirrored.reduce((sum, record) => sum + record.bytes, 0);
  const title = interlochenOnly ? "Interlochen Evidence Room - Complete Local PDF Mirror" : "Evidence Library - Complete Local PDF Mirror";
  const cards = filtered.map(recordCard).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title>
<style>
:root{--ink:#11100e;--paper:#f6f2e8;--panel:#fffdf7;--rule:#c9c0ad;--accent:#7b1f1f;--muted:#655f56;--ok:#285c43;--warn:#8b3f18;font-family:Georgia,"Times New Roman",serif;color:var(--ink);background:var(--paper)}*{box-sizing:border-box}body{margin:0}.local-banner{background:#2b1717;color:#fff;padding:.7rem 5vw;font:700 .76rem/1.4 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}.masthead{display:flex;justify-content:space-between;align-items:center;padding:1.35rem 5vw;border-bottom:3px double var(--ink)}.brand{font:bold 1.55rem/1 system-ui,sans-serif;color:var(--ink);text-decoration:none}.masthead nav{display:flex;gap:1rem}.masthead nav a{color:var(--ink)}main{max-width:1500px;margin:auto;padding:2.5rem 5vw 5rem}.eyebrow,.document-status{font:700 .72rem/1.3 system-ui,sans-serif;letter-spacing:.11em;text-transform:uppercase;color:var(--accent)}h1{font-size:clamp(2.4rem,6vw,5.5rem);line-height:.94;max-width:1000px;margin:.3rem 0 1.2rem}.intro{max-width:850px;font-size:1.15rem;line-height:1.55}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-block:1px solid var(--rule);margin:2rem 0}.summary div{padding:1.2rem;border-right:1px solid var(--rule)}.summary div:last-child{border-right:0}.summary strong{display:block;font:800 1.8rem/1 system-ui,sans-serif}.summary span{font:600 .75rem/1.4 system-ui,sans-serif;color:var(--muted)}.controls{display:flex;gap:.7rem;flex-wrap:wrap;align-items:center;margin:1.5rem 0 2rem}.controls input{flex:1;min-width:260px;padding:.85rem;border:1px solid var(--ink);background:#fff;font:1rem system-ui,sans-serif}.controls button,.manifest-link{padding:.78rem 1rem;border:1px solid var(--ink);background:transparent;color:var(--ink);font:700 .78rem system-ui,sans-serif;text-decoration:none;cursor:pointer}.controls button[aria-pressed="true"]{background:var(--ink);color:#fff}.document-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.15rem}.document-card{background:var(--panel);border:1px solid var(--rule);padding:1.25rem;display:flex;flex-direction:column;gap:.8rem}.document-card[data-status="missing"]{border-color:#c7835f}.document-card h2{font-size:1.35rem;line-height:1.15;margin:.2rem 0}.document-meta,.document-actions{display:flex;gap:.55rem;flex-wrap:wrap}.document-meta span{font:600 .72rem system-ui,sans-serif;background:#eee8dc;padding:.35rem .5rem}.document-actions a{font:700 .78rem system-ui,sans-serif;border:1px solid var(--ink);padding:.6rem .75rem;color:var(--ink);text-decoration:none}.document-actions a.primary{background:var(--accent);border-color:var(--accent);color:#fff}details{border-top:1px solid var(--rule);padding-top:.7rem}summary{cursor:pointer;font:700 .75rem system-ui,sans-serif}dl{display:grid;grid-template-columns:max-content 1fr;gap:.4rem .7rem;font-size:.78rem}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}code{font:.7rem ui-monospace,SFMono-Regular,monospace}.used-by{border-top:1px solid var(--rule);padding-top:.7rem}.used-by h3{font:700 .72rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em}.used-by ul{list-style:none;padding:0;margin:0}.used-by li{margin:.55rem 0}.used-by li a{display:block;color:var(--ink);font-weight:bold}.used-by li span{display:block;color:var(--muted);font:.72rem system-ui,sans-serif}.empty{display:none}.footer-note{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--rule);color:var(--muted)}@media(max-width:800px){.summary{grid-template-columns:1fr 1fr}.summary div:nth-child(2){border-right:0}.masthead{align-items:flex-start;gap:1rem;flex-direction:column}.document-grid{grid-template-columns:1fr}}
</style></head><body><div class="local-banner">Local-only editorial preview - never publish this generated mirror without a separate rights and privacy review</div><header class="masthead"><a class="brand" href="/">BOHO NEWS</a><nav><a href="/evidence/">All PDFs</a><a href="/investigations/interlochen/evidence/">Interlochen</a><a href="/">Home</a></nav></header><main><p class="eyebrow">Evidence preservation preview</p><h1>${escapeHtml(title.replace(" - ", ": "))}</h1><p class="intro">Every PDF identified in the current approved-story citation corpus, existing evidence archive, and supplied Interlochen handoff is collected here for local review. Content-identical files are stored once and mapped to every story that relied on them.</p><section class="summary"><div><strong>${filtered.length}</strong><span>distinct source records</span></div><div><strong>${mirrored.length}</strong><span>locally preserved</span></div><div><strong>${totalPages.toLocaleString()}</strong><span>pages identified</span></div><div><strong>${failures.length}</strong><span>downloads needing follow-up</span></div></section><div class="controls"><input id="search" type="search" placeholder="Search documents, publishers, stories or source IDs"><button type="button" data-filter="all" aria-pressed="true">All</button><button type="button" data-filter="mirrored" aria-pressed="false">Mirrored</button><button type="button" data-filter="missing" aria-pressed="false">Needs follow-up</button><a class="manifest-link" href="/evidence/pdf-mirror-manifest.json">Manifest JSON</a></div><section class="document-grid" id="documents">${cards}</section><p class="footer-note">Local corpus size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB. Generated ${escapeHtml(manifest.generatedAt)}. This preview does not change article text or the live site.</p></main><script>const input=document.querySelector('#search');const buttons=[...document.querySelectorAll('[data-filter]')];const cards=[...document.querySelectorAll('.document-card')];let filter='all';function apply(){const q=input.value.trim().toLowerCase();for(const card of cards){const status=card.dataset.status;const visible=(filter==='all'||status===filter)&&(!q||card.dataset.search.includes(q));card.hidden=!visible}for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.filter===filter))}input.addEventListener('input',apply);for(const button of buttons)button.addEventListener('click',()=>{filter=button.dataset.filter;apply()});</script></body></html>`;
}

await mkdir(objectRoot, { recursive: true, mode: 0o700 });

const previousByUrl = new Map();
try {
  const previous = JSON.parse(await readFile(join(outputRoot, "manifest.json"), "utf8"));
  for (const record of previous.records ?? []) {
    if (!record.ok || !record.sha256) continue;
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
  for (const citation of article.citations) {
    addReference(citation.url, {
      articleSlug: article.slug,
      articleHeadline: article.headline,
      sourceId: citation.id,
      title: citation.title,
      publisher: citation.publisher
    }, "article-citation");
  }
  const walk = (value, path = "") => {
    if (typeof value === "string" && /^https?:\/\//.test(value) && /\.pdf(?:$|[?#])/i.test(value)) {
      addReference(value, {
        articleSlug: article.slug,
        articleHeadline: article.headline,
        sourceId: path,
        title: "Supporting PDF referenced by article data",
        publisher: new URL(value).hostname
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
  if (!existing.displayName && value.displayName) existing.displayName = value.displayName;
}

for (const asset of evidenceAssets.filter((item) => item.mediaType === "application/pdf")) {
  const localPath = join(root, "public", asset.path.replace(/^\//, ""));
  const admitted = await admitLocalPdf(localPath, "existing-public-evidence");
  const associations = asset.storySlugs.flatMap((articleSlug) => {
    const article = articleBySlug.get(articleSlug);
    return asset.sourceIds.map((sourceId) => ({
      articleSlug,
      articleHeadline: article?.headline ?? articleSlug,
      sourceId,
      title: asset.title,
      publisher: asset.publisher
    }));
  });
  collectRecord(`sha256:${admitted.sha256}`, {
    ...admitted,
    displayName: asset.title,
    associations,
    originalUrls: [],
    origins: ["existing-public-evidence"],
    discovery: "existing evidence mirror",
    retrievedAt: new Date().toISOString()
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
    collectRecord(`sha256:${admitted.sha256}`, {
      ...admitted,
      displayName: name.replace(/\.pdf$/i, "").replaceAll("-", " "),
      associations: [{
        articleSlug: "interlochen-before-epstein-what-was-known",
        articleHeadline: article?.headline,
        sourceId,
        title: name.replace(/\.pdf$/i, "").replaceAll("-", " "),
        publisher: "Interlochen Part 2 reporting handoff"
      }],
      originalUrls: [],
      origins: ["interlochen-handoff"],
      discovery: "supplied reporting handoff",
      retrievedAt: new Date().toISOString()
    });
  }
}

process.stdout.write(`Downloading ${pdfReferences.length} cited PDF URLs...\n`);
const downloads = await mapLimit(pdfReferences, 4, async (reference, index) => {
  const key = sha256Bytes(Buffer.from(reference.url)).slice(0, 20);
  const cached = previousByUrl.get(reference.url);
  let result;
  if (cached) {
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
        cached: true
      };
    } catch {
      result = await downloadPdf(reference.url, key);
    }
  } else {
    result = await downloadPdf(reference.url, key);
  }
  if ((index + 1) % 10 === 0 || index + 1 === pdfReferences.length) {
    process.stdout.write(`Downloaded ${index + 1}/${pdfReferences.length}\n`);
  }
  return { reference, probe: probeByUrl.get(reference.url), result };
});

for (const { reference, probe, result } of downloads) {
  const value = {
    ...result,
    associations: reference.associations,
    originalUrls: [reference.url],
    origins: [...reference.discoveries],
    discovery: probe?.discovery ?? (isPdfPath(reference.url) ? "pdf-url" : "local-url"),
    retrievedAt: new Date().toISOString(),
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
  recordsByIdentity.delete(key);
}

const records = [...recordsByIdentity.values()].sort((a, b) => {
  if (a.ok !== b.ok) return a.ok ? -1 : 1;
  return (a.displayName ?? "").localeCompare(b.displayName ?? "");
});

await rm(previewFilesRoot, { recursive: true, force: true });
await mkdir(previewFilesRoot, { recursive: true });
for (const record of records.filter((item) => item.ok)) {
  await copyFile(record.objectPath, join(previewFilesRoot, `${record.sha256}.pdf`));
}

const manifest = {
  schemaVersion: "bohonews.local-pdf-evidence-mirror.v1",
  localOnly: true,
  generatedAt: new Date().toISOString(),
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

await mkdir(previewRoot, { recursive: true });
await mkdir(interlochenPreviewRoot, { recursive: true });
await writeFile(join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
await writeFile(join(previewRoot, "pdf-mirror-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(join(previewRoot, "index.html"), previewHtml(manifest, records));
await writeFile(join(interlochenPreviewRoot, "index.html"), previewHtml(manifest, records, { interlochenOnly: true }));

process.stdout.write(JSON.stringify({
  articleCount: manifest.articleCount,
  citationUrlCount: manifest.citationUrlCount,
  detectedPdfUrlCount: manifest.detectedPdfUrlCount,
  recordCount: manifest.recordCount,
  mirroredCount: manifest.mirroredCount,
  failureCount: manifest.failureCount,
  previewPath: join(previewRoot, "index.html")
}, null, 2) + "\n");
