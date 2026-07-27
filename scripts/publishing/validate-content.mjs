import Ajv2020 from "ajv/dist/2020.js";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { stableJson } from "./stable-json.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const articleRoot = join(root, "content/articles");
const promotionPath = join(root, "src/publishing/public-news-promotion-package.v2.json");
const releasePath = join(root, "public-news-release.v2.json");
const mailRoutingPath = join(root, "src/publishing/public-mail-routing.v1.json");
const schemaPath = join(root, "schemas/public-news-promotion-package.v2.schema.json");
const forbiddenMarkup = [/<script\b/i,/javascript:/i,/on(?:click|load|error)\s*=/i,/<iframe\b/i,/<object\b/i,/<embed\b/i];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

function digest(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function formats(ajv) {
  ajv.addFormat("date-time", {type:"string",validate:(value) => value.endsWith("Z") && !Number.isNaN(Date.parse(value))});
  ajv.addFormat("uri", {type:"string",validate:(value) => {
    try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
  }});
}

function safeMediaSignature(bytes,extension) {
  if (extension === ".png") return bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if ([".jpg",".jpeg"].includes(extension)) return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === ".gif") return ["GIF87a","GIF89a"].includes(bytes.subarray(0,6).toString("ascii"));
  if (extension === ".webp") return bytes.subarray(0,4).toString("ascii") === "RIFF" && bytes.subarray(8,12).toString("ascii") === "WEBP";
  if (extension === ".avif") return bytes.subarray(4,8).toString("ascii") === "ftyp" && /^(avif|avis|mif1|msf1)$/.test(bytes.subarray(8,12).toString("ascii"));
  return false;
}

export function verifyPublicMedia(publicRoot,publicPath,expectedHash) {
  const base = resolve(publicRoot);
  const fullPath = resolve(base,publicPath.slice(1));
  if (!fullPath.startsWith(`${base}${sep}`)) throw new Error(`Public media path escapes root: ${publicPath}`);
  const realBase = realpathSync(base);
  const realPath = realpathSync(fullPath);
  if (realPath !== realBase && !realPath.startsWith(`${realBase}${sep}`)) throw new Error(`Public media path escapes root through a symlink: ${publicPath}`);
  const stat = lstatSync(fullPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Public media is not a regular file: ${publicPath}`);
  const bytes = readFileSync(realPath);
  if (!safeMediaSignature(bytes,extname(fullPath).toLowerCase())) throw new Error(`Public media signature invalid: ${publicPath}`);
  if (createHash("sha256").update(bytes).digest("hex") !== expectedHash) throw new Error(`Public media hash mismatch: ${publicPath}`);
}

export function validatePublicState(promotion, release, schema, options = {}) {
  const ajv = new Ajv2020({allErrors:true,strict:true});
  formats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(promotion)) throw new Error(`Promotion schema rejected: ${ajv.errorsText(validate.errors)}`);
  if (promotion.releaseState !== "final") throw new Error("Candidate promotion cannot enter the public repository");
  const inspectText = (value,path = []) => {
    if (typeof value === "string" && /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error(`Unsafe control character at ${path.join(".")}`);
    if (Array.isArray(value)) value.forEach((item,index) => inspectText(item,[...path,index]));
    else if (value && typeof value === "object") Object.entries(value).forEach(([key,item]) => inspectText(item,[...path,key]));
  };
  inspectText(promotion);
  const releases = new Map();
  for (const record of promotion.releaseRecords) {
    const unsignedRecord = structuredClone(record);
    delete unsignedRecord.recordHash;
    if (record.recordHash !== digest(unsignedRecord)) throw new Error(`Release record hash mismatch: ${record.releaseId}`);
    if (releases.has(record.releaseId)) throw new Error(`Duplicate release record: ${record.releaseId}`);
    releases.set(record.releaseId,record);
  }
  for (const article of promotion.articles) {
    const firstRelease = releases.get(article.releaseId);
    if (!firstRelease || !firstRelease.newArticleIds.includes(article.id)
      || firstRelease.productionActivationAt !== article.publishedAt
      || !firstRelease.canonicalUrls.includes(article.canonicalUrl)) {
      throw new Error(`Article lacks a verified first-public release binding: ${article.id}`);
    }
    if (article.publicChangeLog.some(({summary}) =>
      /\b(?:owner-approved|handoff|work order|compiler|deployment mechanics?|repository operations?|batch\s+\d+)\b/i.test(summary))) {
      throw new Error(`Public history contains internal provenance: ${article.id}`);
    }
    if (article.updatedAt === article.publishedAt && article.publicChangeLog.length) {
      throw new Error(`Article has public changes without an updated timestamp: ${article.id}`);
    }
    if (article.updatedAt !== article.publishedAt) {
      const latest = article.publicChangeLog.at(-1);
      const updateRelease = promotion.releaseRecords.find((record) =>
        record.updatedArticleIds.includes(article.id)
        && record.productionActivationAt === article.updatedAt
        && record.canonicalUrls.includes(article.canonicalUrl));
      if (!latest || latest.at !== article.updatedAt || !updateRelease) {
        throw new Error(`Article update lacks matching history and release evidence: ${article.id}`);
      }
    }
    const terminalTypes = new Set(article.corrections.map(({type}) => type).filter((type) => ["retraction","upstream-kill","legal-safety-removal"].includes(type)));
    if (article.retractionState === "current" && terminalTypes.size) throw new Error(`Current article has terminal correction: ${article.id}`);
    if (article.retractionState !== "current") {
      if (article.body || article.citations.length || article.leadImage || article.media.length || article.search.index || article.distribution.rss || article.distribution.newsSitemap) {
        throw new Error(`Terminal article is not a closed tombstone: ${article.id}`);
      }
    }
  }
  const unsigned = structuredClone(promotion);
  delete unsigned.packageDigest;
  const computed = digest(unsigned);
  if (promotion.packageDigest !== computed) throw new Error(`Promotion digest mismatch: expected ${computed}`);
  const expectedRoutes = promotion.articles.map(({canonicalUrl}) => new URL(canonicalUrl).pathname);
  const mediaById = new Map();
  for (const rights of promotion.mediaRights) {
    if (mediaById.has(rights.id)) throw new Error(`Duplicate public media rights ID: ${rights.id}`);
    mediaById.set(rights.id,rights);
    for (const derivative of rights.derivatives) verifyPublicMedia(options.publicRoot ?? join(root,"public"),derivative.publicPath,derivative.hash);
  }
  const referencedMedia = new Set();
  for (const article of promotion.articles) {
    const bodyMedia = article.bodyBlocks.filter(({type}) => ["media","official-document-render"].includes(type));
    for (const image of [article.leadImage,...article.media,...bodyMedia].filter(Boolean)) {
      referencedMedia.add(image.rightsId);
      const rights = mediaById.get(image.rightsId);
      if (!rights?.derivatives.some(({publicPath,role,width,height}) => publicPath === image.src && (!image.role || role === image.role) && width === image.width && height === image.height)) {
        throw new Error(`Article media is not bound to public rights: ${article.id}`);
      }
    }
  }
  if ([...mediaById].some(([id]) => !referencedMedia.has(id))) throw new Error("Promotion contains orphan public media rights");
  const expectedRelease = {
    schemaVersion:promotion.schemaVersion,
    compilerVersion:promotion.compilerVersion,
    generatedAt:promotion.generatedAt,
    packageDigest:promotion.packageDigest,
    articleCount:promotion.inventory.articleCount,
    mediaCount:promotion.inventory.mediaCount,
    routes:expectedRoutes,
    releaseRecords:promotion.releaseRecords
  };
  if (stableJson(release) !== stableJson(expectedRelease)) throw new Error("Release manifest does not exactly bind the promotion package");
  if (promotion.inventory.articleCount !== promotion.articles.length || promotion.inventory.routeCount !== expectedRoutes.length || promotion.inventory.mediaCount !== promotion.mediaRights.length) throw new Error("Promotion inventory mismatch");
  if (new Set(expectedRoutes).size !== expectedRoutes.length) throw new Error("Duplicate public route");
  return {articleCount:promotion.articles.length,packageDigest:computed,routes:expectedRoutes};
}

export function validateMailRouting(record) {
  const expected = ["contact@bohonews.com", "corrections@bohonews.com"];
  if (
    record?.schemaVersion !== "1.0.0"
    || record?.provider !== "purelymail"
    || record?.verificationOperation !== "purelymail-bohonews-public-aliases-20260726-v1"
    || typeof record?.verifiedAt !== "string"
    || !record.verifiedAt.endsWith("Z")
    || Number.isNaN(Date.parse(record.verifiedAt))
    || !Array.isArray(record?.aliases)
    || record.aliases.length !== 2
    || record.aliases.map(({address}) => address).sort().join("|") !== expected.sort().join("|")
    || record.aliases.some(({delivery}) => delivery !== "received")
  ) {
    throw new Error("Public mail routing lacks verified delivery for both approved aliases");
  }
  return {aliasCount: 2, verifiedAt: record.verifiedAt};
}

export async function validateRepositoryContent() {
  for (const path of await walk(articleRoot)) {
    if (![".md",".mdx"].includes(extname(path))) continue;
    const content = await readFile(path,"utf8");
    if (forbiddenMarkup.some((pattern) => pattern.test(content))) throw new Error(`Unsafe executable HTML rejected in ${path}`);
  }
  const promotion = JSON.parse(await readFile(promotionPath,"utf8"));
  const release = JSON.parse(await readFile(releasePath,"utf8"));
  const schema = JSON.parse(await readFile(schemaPath,"utf8"));
  const mailRouting = JSON.parse(await readFile(mailRoutingPath,"utf8"));
  const result = validatePublicState(promotion,release,schema);
  const mail = validateMailRouting(mailRouting);
  console.log(`Governed public content validation passed (${result.articleCount} promoted articles; ${mail.aliasCount} delivered aliases; digest verified; fixtures excluded).`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await validateRepositoryContent();
