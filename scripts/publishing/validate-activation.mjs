import {
  lstat,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePublicState } from "./validate-content.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const promotionPath = join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = join(root,"public-news-release.v2.1.1.json");
const schemaPath = join(root,"schemas/public-news-promotion-package.v2.1.1.schema.json");
const MAX_ARTIFACT_FILES = 20_000;
const MAX_ARTIFACT_FILE_BYTES = 25n * 1024n * 1024n;
const MAX_ARTIFACT_TOTAL_BYTES = 2n * 1024n * 1024n * 1024n;
const FILE_SEAL_FIELDS = ["size","dev","ino","mode","mtimeNs","ctimeNs","nlink"];

async function walkArtifact(rootPath) {
  const resolvedRoot = resolve(rootPath);
  if (await realpath(resolvedRoot) !== resolvedRoot) {
    throw new Error("Activation artifact root resolves through a symlink");
  }
  const output = [];
  let totalBytes = 0n;
  async function walk(directory) {
    const directoryStat = await lstat(directory,{bigint:true});
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new Error(`Activation artifact contains an unsafe directory: ${directory}`);
    }
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const path = join(directory,entry.name);
      const stat = await lstat(path,{bigint:true});
      if (stat.isSymbolicLink()) {
        throw new Error(`Activation artifact contains a symlink: ${path}`);
      }
      if (stat.isDirectory()) {
        await walk(path);
      } else if (stat.isFile()) {
        if (stat.nlink !== 1n) {
          throw new Error(`Activation artifact file must have exactly one link: ${path}`);
        }
        if (stat.size > MAX_ARTIFACT_FILE_BYTES) {
          throw new Error(`Activation artifact file exceeds 25 MiB: ${path}`);
        }
        totalBytes += stat.size;
        if (totalBytes > MAX_ARTIFACT_TOTAL_BYTES) {
          throw new Error("Activation artifact exceeds the two GiB safety bound");
        }
        output.push({path,stat});
        if (output.length > MAX_ARTIFACT_FILES) {
          throw new Error("Activation artifact exceeds 20,000 files");
        }
      } else {
        throw new Error(`Activation artifact contains a non-file entry: ${path}`);
      }
    }
  }
  await walk(resolvedRoot);
  return output;
}

async function readSealedText({path,stat}) {
  const bytes = await readFile(path);
  const after = await lstat(path,{bigint:true});
  if (!after.isFile() || after.isSymbolicLink() || after.nlink !== 1n
    || FILE_SEAL_FIELDS.some((field) => after[field] !== stat[field])) {
    throw new Error(`Activation artifact changed while it was inspected: ${path}`);
  }
  return bytes.toString("utf8");
}

export async function validateActivationSource() {
  const [promotion,release,schema] = await Promise.all([
    readFile(promotionPath,"utf8").then(JSON.parse),
    readFile(releasePath,"utf8").then(JSON.parse),
    readFile(schemaPath,"utf8").then(JSON.parse)
  ]);
  const result = validatePublicState(promotion,release,schema,{preview:true});
  return {promotion,result};
}

export async function verifyActivationArtifactAgainstSource(
  artifactRoot,
  {promotion,result},
  {requireActivationMarker = true} = {}
) {
  const dist = resolve(artifactRoot);
  const files = await walkArtifact(dist);
  const filesByPath = new Map(files.map((file) => [resolve(file.path),file]));
  const artifactFile = (...parts) => {
    const path = resolve(dist,...parts);
    if (path !== dist && !path.startsWith(`${dist}${sep}`)) {
      throw new Error(`Activation artifact path escapes the prepared root: ${parts.join("/")}`);
    }
    const file = filesByPath.get(path);
    if (!file) throw new Error(`Activation artifact omitted required file: ${parts.join("/")}`);
    return file;
  };
  const html = [];
  for (const file of files.filter(({path}) => path.endsWith(".html"))) {
    html.push(await readSealedText(file));
  }
  if (!html.length || html.some((page) => !/name="robots" content="noindex,nofollow"/.test(page))) {
    throw new Error("Every activation HTML page must be noindex,nofollow");
  }
  if (html.some((page) =>
    /<aside[^>]+fixture-banner|Preview candidate — not published|Private preview — not published|Non-production fixture preview|Preview only|Newsletter interface preview/.test(page))) {
    throw new Error("Activation artifact contains preview UI forbidden on the live domain");
  }
  if (html.some((page) =>
    /<script[^>]+(?:analytics-bootstrap|analytics\.bohodigitalservices\.com|widgets\.tradingview-widget\.com)|<tv-ticker-tape\b|data-umami-|snowplow-pixel\.tradingview\.com/.test(page))) {
    throw new Error("Activation artifact contains production analytics or TradingView");
  }
  for (const article of promotion.articles.filter(({publishedAt}) => publishedAt === null)) {
    const page = await readSealedText(artifactFile("articles",article.slug,"index.html"));
    if (/\bPublished\s*<|article:published_time|datePublished/.test(page)) {
      throw new Error(`Activation article exposes an invented publication time: ${article.id}`);
    }
  }
  const [robots,rss,sitemap,newsSitemap,headers] = await Promise.all([
    readSealedText(artifactFile("robots.txt")),
    readSealedText(artifactFile("rss.xml")),
    readSealedText(artifactFile("sitemap.xml")),
    readSealedText(artifactFile("news-sitemap.xml")),
    readSealedText(artifactFile("_headers"))
  ]);
  if (!/Disallow: \//.test(robots)
    || promotion.articles.some(({canonicalUrl}) => rss.includes(canonicalUrl)
      || sitemap.includes(canonicalUrl)
      || newsSitemap.includes(canonicalUrl))
    || !/X-Robots-Tag: noindex, nofollow/.test(headers)
    || !/Cache-Control: no-store/.test(headers)) {
    throw new Error("Activation robots, feed exclusion, or response-cache contract failed");
  }
  const activationMarkerPath = resolve(
    dist,".well-known","bohonews-activation.json"
  );
  const candidateMarkerPath = resolve(
    dist,".well-known","bohonews-candidate.json"
  );
  if (filesByPath.has(candidateMarkerPath)) {
    throw new Error("Activation artifact contains the preview candidate marker");
  }
  const activationMarkerFile = filesByPath.get(activationMarkerPath);
  if (!activationMarkerFile) {
    if (requireActivationMarker) {
      throw new Error("Activation artifact omitted the activation marker");
    }
  } else {
    const activationMarkerBytes = await readSealedText(activationMarkerFile);
    let activationMarker;
    try {
      activationMarker = JSON.parse(activationMarkerBytes);
    } catch {
      throw new Error("Activation artifact marker is not valid JSON");
    }
    const markerKeys = ["articleIds","candidateDigest","releaseState","schemaVersion"];
    if (!activationMarker || Array.isArray(activationMarker)
      || Object.keys(activationMarker).sort().join("|") !== markerKeys.join("|")
      || activationMarker.schemaVersion !== "1.0.0"
      || activationMarker.releaseState !== "activation"
      || activationMarker.candidateDigest !== promotion.packageDigest
      || !Array.isArray(activationMarker.articleIds)
      || activationMarker.articleIds.length < 1
      || new Set(activationMarker.articleIds).size !== activationMarker.articleIds.length
      || activationMarker.articleIds.some((id) => typeof id !== "string" || !id)) {
      throw new Error("Activation artifact marker contract is invalid");
    }
    const canonicalMarkerBytes = `${JSON.stringify({
      articleIds:activationMarker.articleIds,
      candidateDigest:activationMarker.candidateDigest,
      releaseState:activationMarker.releaseState,
      schemaVersion:activationMarker.schemaVersion
    })}\n`;
    if (activationMarkerBytes !== canonicalMarkerBytes) {
      throw new Error("Activation artifact marker is not canonically serialized");
    }
    const candidateArticleIds = promotion.articles
      .filter(({publishedAt}) => publishedAt === null)
      .map(({id}) => id)
      .sort();
    if (new Set(candidateArticleIds).size !== candidateArticleIds.length) {
      throw new Error("Activation candidate package contains duplicate article IDs");
    }
    if (JSON.stringify(activationMarker.articleIds) !== JSON.stringify(candidateArticleIds)) {
      throw new Error("Activation artifact marker article IDs differ from the candidate package");
    }
  }
  if (filesByPath.has(resolve(dist,".well-known","bohonews-release.json"))) {
    throw new Error("Activation artifact contains a final public release marker");
  }
  return result;
}

export async function verifyActivationArtifact(artifactRoot = join(root,"dist")) {
  return verifyActivationArtifactAgainstSource(
    artifactRoot,
    await validateActivationSource()
  );
}

export async function validateActivationArtifact() {
  const source = await validateActivationSource();
  const dist = join(root,"dist");
  const headersPath = join(dist,"_headers");
  const existingHeaders = await readFile(headersPath,"utf8");
  const activationHeaders = existingHeaders.replace(
    /^\/\*\s*\n/,
    "/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"
  );
  await writeFile(headersPath,activationHeaders);
  await rm(join(dist,".well-known","bohonews-release.json"),{force:true});
  return verifyActivationArtifactAgainstSource(
    dist,
    source,
    {requireActivationMarker:false}
  );
}

const modulePath = fileURLToPath(import.meta.url);
if (resolve(process.argv[1] ?? "") === resolve(modulePath)) {
  const mode = process.argv[2] ?? "source";
  const result = mode === "artifact"
    ? await validateActivationArtifact()
    : (await validateActivationSource()).result;
  console.log(`Boho News public activation validation passed (${result.articleCount} articles; ${mode}; no preview UI).`);
}
