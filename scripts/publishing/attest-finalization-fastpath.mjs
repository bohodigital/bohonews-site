import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  unlink,
  writeFile
} from "node:fs/promises";
import { basename, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyFinalizationOverlay,
  FINALIZATION_FASTPATH_CONTRACT_VERSION,
  FINALIZATION_GENERATED_RELATIVE_ROOT,
  readActivationLayout,
  readFinalizationCompletion,
  readFinalizationPlan
} from "./finalization-fastpath.mjs";
import { finalizationCodeInventory } from "./finalization-code-inventory.mjs";
import {
  validatePublicState,
  validateReleaseMarker
} from "./validate-content.mjs";
import { stableJson } from "./stable-json.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const promotionPath = resolve(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root,"public-news-release.v2.1.1.json");
const markerPath = resolve(root,"public/.well-known/bohonews-release.json");
const schemaPath = resolve(root,"schemas/public-news-promotion-package.v2.1.1.schema.json");
const publicRoot = resolve(root,"public");
const generatedRoot = resolve(root,FINALIZATION_GENERATED_RELATIVE_ROOT);
const FINALIZER_VERSION = "bohonews-finalizer.v2.1.1";
const RELEASE_FIELD_ALLOWLIST = [
  "publishedAt","updatedAt","releaseId","publicChangeLog.at","releaseRecords",
  "packageDigest","manifestDigest","releaseMarker","indexability"
];
const MAX_RECORD_BYTES = 64n * 1024n * 1024n;

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function recordHash(value) {
  return digest(stableJson(value));
}

function run(command,args,env = {}) {
  const result = spawnSync(command,args,{
    cwd:root,
    env:{...process.env,...env},
    stdio:"inherit"
  });
  if (result.status !== 0) {
    throw new Error(`Preactivation validation command failed: ${command} ${args.join(" ")}`);
  }
  return {command:[command,...args],status:result.status};
}

async function readBoundedBytes(path,label) {
  const before = await lstat(path,{bigint:true});
  if (!before.isFile() || before.isSymbolicLink() || before.size > MAX_RECORD_BYTES) {
    throw new Error(`${label} is not a bounded regular file`);
  }
  const bytes = await readFile(path);
  const after = await lstat(path,{bigint:true});
  if (!after.isFile() || after.isSymbolicLink()
    || !["size","dev","ino","mode","mtimeNs","ctimeNs"]
      .every((field) => before[field] === after[field])) {
    throw new Error(`${label} changed while it was read`);
  }
  return bytes;
}

async function fsyncDirectory(path) {
  const handle = await open(path,constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeExclusiveRecord(path,value) {
  const withoutHash = structuredClone(value);
  const record = {...withoutHash,recordHash:recordHash(withoutHash)};
  const bytes = stableJson(record);
  if (Buffer.byteLength(bytes) > MAX_RECORD_BYTES) {
    throw new Error("Finalization attestation record exceeds 64 MiB");
  }
  const target = resolve(path);
  const parent = dirname(target);
  const temporary = resolve(parent,`.${basename(target)}.${record.recordHash}.tmp`);
  await mkdir(parent,{recursive:true});
  try {
    const existing = (await readBoundedBytes(
      target,"Existing finalization attestation"
    )).toString("utf8");
    if (existing !== bytes) throw new Error("Existing finalization attestation differs");
    return record;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  try {
    await writeFile(temporary,bytes,{flag:"wx",mode:0o600});
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if ((await readBoundedBytes(
      temporary,"Existing finalization attestation temporary"
    )).toString("utf8") !== bytes) {
      throw new Error("Existing finalization attestation temporary differs");
    }
  }
  const handle = await open(temporary,constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary,target);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if ((await readBoundedBytes(
      target,"Existing finalization attestation"
    )).toString("utf8") !== bytes) {
      throw new Error("Existing finalization attestation differs");
    }
  }
  await fsyncDirectory(parent);
  try {
    await unlink(temporary);
    await fsyncDirectory(parent);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return record;
}

async function readHashedRecord(path,label) {
  let value;
  try {
    value = JSON.parse((await readBoundedBytes(path,label)).toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${label} is not valid JSON`);
    throw error;
  }
  const unsigned = structuredClone(value);
  delete unsigned.recordHash;
  if (value.recordHash !== recordHash(unsigned)) throw new Error(`${label} record hash is invalid`);
  return value;
}

function hasExactKeys(value,keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && stableJson(Object.keys(value).sort()) === stableJson([...keys].sort());
}

function validDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

async function readPrecheckRecord(path) {
  const value = await readHashedRecord(path,"Preactivation validation");
  if (!hasExactKeys(value,[
    "schemaVersion","contractVersion","phase","preparationBindingRecordHash",
    "approvalDigest","candidatePackageDigest","sourceActivationArtifactSha256",
    "sourceInventorySha256","sourceMarkerSha256","activationLayoutRecordHash",
    "activationTreeDigest","codeInventoryDigest","codeFileCount","commands",
    "recordHash"
  ])
    || value.schemaVersion !== "1.0.0"
    || value.contractVersion !== FINALIZATION_FASTPATH_CONTRACT_VERSION
    || value.phase !== "preactivation-full-validation"
    || !Number.isInteger(value.codeFileCount)
    || value.codeFileCount < 1
    || !Array.isArray(value.commands)
    || value.commands.length !== 3
    || ![
      "preparationBindingRecordHash","approvalDigest","candidatePackageDigest",
      "sourceActivationArtifactSha256","sourceInventorySha256","sourceMarkerSha256",
      "activationLayoutRecordHash","activationTreeDigest","codeInventoryDigest"
    ].every((field) => validDigest(value[field]))
    || value.commands.some((command) => !hasExactKeys(command,["command","status"])
      || !Array.isArray(command.command)
      || command.command.length < 2
      || command.command.some((part) => typeof part !== "string" || !part)
      || command.status !== 0)) {
    throw new Error("Preactivation validation record contract is invalid");
  }
  return value;
}

async function precheck(activationManifestPath,outputPath) {
  const activation = await readActivationLayout(activationManifestPath);
  const commands = [
    run("npm",["run","check"]),
    run("node",["scripts/publishing/validate-activation.mjs","source"],{
      BOHONEWS_ACTIVATION:"1"
    }),
    run("node",["scripts/publishing/validate-activation.mjs","artifact"],{
      BOHONEWS_ACTIVATION:"1"
    })
  ];
  const code = await finalizationCodeInventory(root);
  return writeExclusiveRecord(outputPath,{
    schemaVersion:"1.0.0",
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    phase:"preactivation-full-validation",
    preparationBindingRecordHash:activation.preparationBindingRecordHash,
    approvalDigest:activation.approvalDigest,
    candidatePackageDigest:activation.candidatePackageDigest,
    sourceActivationArtifactSha256:activation.sourceActivationArtifactSha256,
    sourceInventorySha256:activation.sourceInventorySha256,
    sourceMarkerSha256:activation.sourceMarkerSha256,
    activationLayoutRecordHash:activation.recordHash,
    activationTreeDigest:activation.activationTreeDigest,
    codeInventoryDigest:code.inventoryDigest,
    codeFileCount:code.files.length,
    commands
  });
}

function assertFinalizerDiff(diff) {
  const unsigned = structuredClone(diff);
  delete unsigned.recordHash;
  if (!hasExactKeys(diff,[
    "schemaVersion","batchId","finalizerContractVersion","releaseFieldAllowlist",
    "candidatePackageDigest","finalPackageDigest","changes","recordHash"
  ])
    || diff.recordHash !== recordHash(unsigned)
    || diff.schemaVersion !== "1.0.0"
    || diff.finalizerContractVersion !== FINALIZER_VERSION
    || stableJson(diff.releaseFieldAllowlist) !== stableJson(RELEASE_FIELD_ALLOWLIST)
    || typeof diff.batchId !== "string"
    || !diff.batchId
    || !/^[a-f0-9]{64}$/.test(diff.candidatePackageDigest ?? "")
    || !/^[a-f0-9]{64}$/.test(diff.finalPackageDigest ?? "")
    || !Array.isArray(diff.changes)
    || diff.changes.some((change) => !hasExactKeys(change,[
      "articleId","fields","publishedAt","updatedAt","releaseId"
    ])
      || typeof change.articleId !== "string"
      || !change.articleId
      || typeof change.publishedAt !== "string"
      || typeof change.updatedAt !== "string"
      || typeof change.releaseId !== "string"
      || stableJson(change.fields) !== stableJson([
        "publishedAt","updatedAt","releaseId"
      ]))) {
    throw new Error("Finalization diff does not prove the exact approval-bound release allowlist");
  }
  return diff;
}

async function verifyRenderedArtifact({artifactRoot,promotion,marker}) {
  const resolvedArtifact = await realpath(artifactRoot);
  if (resolvedArtifact !== resolve(artifactRoot)) {
    throw new Error("Final artifact root resolves through a symlink");
  }
  const artifactMarker = await readFile(
    resolve(resolvedArtifact,".well-known/bohonews-release.json")
  );
  const sourceMarker = await readFile(markerPath);
  if (!artifactMarker.equals(sourceMarker)) throw new Error("Final artifact marker bytes differ");
  const headers = await readFile(resolve(resolvedArtifact,"_headers"),"utf8");
  if (/X-Robots-Tag:\s*noindex|Cache-Control:\s*no-store/i.test(headers)) {
    throw new Error("Final artifact retained activation indexing or cache controls");
  }
  const [robots,rss,sitemap,newsSitemap] = await Promise.all([
    readFile(resolve(resolvedArtifact,"robots.txt"),"utf8"),
    readFile(resolve(resolvedArtifact,"rss.xml"),"utf8"),
    readFile(resolve(resolvedArtifact,"sitemap.xml"),"utf8"),
    readFile(resolve(resolvedArtifact,"news-sitemap.xml"),"utf8")
  ]);
  if (/Disallow:\s*\/$/.test(robots)) throw new Error("Final robots file blocks the site");
  for (const article of promotion.articles) {
    const url = new URL(article.canonicalUrl);
    if (url.origin !== "https://bohonews.com" || !url.pathname.startsWith("/articles/")) {
      throw new Error(`Unsafe final article route: ${article.id}`);
    }
    const pagePath = resolve(resolvedArtifact,`.${url.pathname}`,"index.html");
    if (!pagePath.startsWith(`${resolvedArtifact}${sep}`)) {
      throw new Error(`Final article route escapes artifact root: ${article.id}`);
    }
    const page = await readFile(pagePath,"utf8");
    if (page.includes("Preview candidate — not published")
      || /name="robots" content="noindex,nofollow"/.test(page)
      || !page.includes(article.publishedAt)) {
      throw new Error(`Final article rendering is not release-bound: ${article.id}`);
    }
    if (!sitemap.includes(article.canonicalUrl)) {
      throw new Error(`Final sitemap omitted article: ${article.id}`);
    }
    if (article.distribution.rss && !rss.includes(article.canonicalUrl)) {
      throw new Error(`Final RSS omitted distributed article: ${article.id}`);
    }
    if (article.distribution.newsSitemap && !newsSitemap.includes(article.canonicalUrl)) {
      throw new Error(`Final news sitemap omitted distributed article: ${article.id}`);
    }
  }
  if (marker.markerHash !== JSON.parse(artifactMarker).markerHash) {
    throw new Error("Rendered release marker hash differs from final source marker");
  }
}

async function postcheck({
  precheckPath,
  activationManifestPath,
  finalizationPlanPath,
  completionPath,
  artifactRoot,
  finalizationDiffPath,
  outputPath
}) {
  const pre = await readPrecheckRecord(precheckPath);
  const activation = await readActivationLayout(activationManifestPath);
  const [plan,completion] = await Promise.all([
    readFinalizationPlan(finalizationPlanPath),
    readFinalizationCompletion(completionPath)
  ]);
  if (pre.preparationBindingRecordHash !== activation.preparationBindingRecordHash
    || pre.sourceActivationArtifactSha256 !== activation.sourceActivationArtifactSha256
    || pre.sourceInventorySha256 !== activation.sourceInventorySha256
    || pre.sourceMarkerSha256 !== activation.sourceMarkerSha256
    || pre.approvalDigest !== activation.approvalDigest
    || pre.candidatePackageDigest !== activation.candidatePackageDigest
    || pre.activationLayoutRecordHash !== activation.recordHash
    || plan.activationLayoutRecordHash !== activation.recordHash
    || completion.activationLayoutRecordHash !== activation.recordHash
    || completion.finalizationPlanRecordHash !== plan.recordHash
    || completion.generatedTreeDigest !== plan.generatedTreeDigest
    || completion.finalTreeDigest !== plan.finalTreeDigest
    || completion.preparationBindingRecordHash !== activation.preparationBindingRecordHash
    || completion.approvalDigest !== activation.approvalDigest
    || completion.candidatePackageDigest !== activation.candidatePackageDigest
    || completion.sourceActivationArtifactSha256 !== activation.sourceActivationArtifactSha256
    || completion.sourceInventorySha256 !== activation.sourceInventorySha256
    || completion.sourceMarkerSha256 !== activation.sourceMarkerSha256) {
    throw new Error("Precheck, activation seal, plan, and completion do not bind one fastpath");
  }
  const code = await finalizationCodeInventory(root);
  if (code.inventoryDigest !== pre.codeInventoryDigest
    || code.files.length !== pre.codeFileCount) {
    throw new Error("Code or installed dependency state changed after full preactivation validation");
  }
  const repeatedCompletion = await applyFinalizationOverlay({
    artifactRoot,
    activationManifestPath,
    finalizationPlanPath,
    generatedRoot,
    publicRoot,
    completionPath
  });
  if (repeatedCompletion.recordHash !== completion.recordHash) {
    throw new Error("Idempotent overlay verification differs from completion record");
  }
  const diff = assertFinalizerDiff(JSON.parse(
    (await readBoundedBytes(finalizationDiffPath,"Finalization diff")).toString("utf8")
  ));
  const [promotionBytes,releaseBytes,markerBytes,schemaBytes] = await Promise.all([
    readFile(promotionPath),readFile(releasePath),readFile(markerPath),readFile(schemaPath)
  ]);
  const promotion = JSON.parse(promotionBytes);
  const release = JSON.parse(releaseBytes);
  const marker = JSON.parse(markerBytes);
  const schema = JSON.parse(schemaBytes);
  const preverifiedFiles = new Map(
    activation.files.filter(({role}) => role === "invariant")
      .map((entry) => [entry.path,entry])
  );
  const validated = validatePublicState(promotion,release,schema,{
    publicRoot:artifactRoot,
    preverifiedFiles
  });
  const markerResult = validateReleaseMarker(marker,promotion,release,{
    publicRoot:artifactRoot,
    preverifiedFiles,
    promotionBytes,
    releaseBytes
  });
  if (diff.candidatePackageDigest !== activation.candidatePackageDigest
    || diff.finalPackageDigest !== validated.packageDigest) {
    throw new Error("Finalization diff package digests differ from the approval-bound final state");
  }
  const finalArticles = new Map(promotion.articles.map((article) => [article.id,article]));
  for (const change of diff.changes) {
    const article = finalArticles.get(change.articleId);
    if (!article
      || change.publishedAt !== article.publishedAt
      || change.updatedAt !== article.updatedAt
      || change.releaseId !== article.releaseId) {
      throw new Error(`Finalization diff article state differs: ${change.articleId}`);
    }
  }
  await verifyRenderedArtifact({artifactRoot,promotion,marker});
  return writeExclusiveRecord(outputPath,{
    schemaVersion:"1.0.0",
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    phase:"post-first-public-targeted-validation",
    preparationBindingRecordHash:activation.preparationBindingRecordHash,
    approvalDigest:activation.approvalDigest,
    candidatePackageDigest:activation.candidatePackageDigest,
    sourceActivationArtifactSha256:activation.sourceActivationArtifactSha256,
    sourceInventorySha256:activation.sourceInventorySha256,
    sourceMarkerSha256:activation.sourceMarkerSha256,
    preactivationValidationRecordHash:pre.recordHash,
    activationLayoutRecordHash:activation.recordHash,
    finalizationPlanRecordHash:plan.recordHash,
    completionRecordHash:completion.recordHash,
    finalizationDiffRecordHash:diff.recordHash,
    codeInventoryDigest:code.inventoryDigest,
    finalPackageDigest:validated.packageDigest,
    publicContentInventoryDigest:markerResult.publicContentInventoryDigest,
    releaseMarkerHash:markerResult.markerHash,
    generatedTreeDigest:plan.generatedTreeDigest,
    finalTreeDigest:plan.finalTreeDigest,
    routeCount:validated.routes.length
  });
}

const [mode,...args] = process.argv.slice(2);
if (mode === "pre") {
  const [activationManifestPath,outputPath] = args;
  if (!activationManifestPath || !outputPath
    || basename(outputPath) !== "bohonews-finalization-precheck.v1.json") {
    throw new Error(
      "Usage: node scripts/publishing/attest-finalization-fastpath.mjs pre "
      + "ACTIVATION_LAYOUT bohonews-finalization-precheck.v1.json"
    );
  }
  const record = await precheck(resolve(activationManifestPath),resolve(outputPath));
  console.log(JSON.stringify({ok:true,phase:record.phase,recordHash:record.recordHash}));
} else if (mode === "post") {
  const [precheckPath,activationManifestPath,finalizationPlanPath,completionPath,
    artifactRoot,finalizationDiffPath,outputPath] = args;
  if (!precheckPath || !activationManifestPath || !finalizationPlanPath
    || !completionPath || !artifactRoot
    || !finalizationDiffPath || !outputPath
    || basename(outputPath) !== "bohonews-finalization-postcheck.v1.json") {
    throw new Error(
      "Usage: node scripts/publishing/attest-finalization-fastpath.mjs post "
      + "PRECHECK ACTIVATION_LAYOUT FINALIZATION_PLAN COMPLETION FINAL_PREPARED_DIST "
      + "FINALIZATION_DIFF bohonews-finalization-postcheck.v1.json"
    );
  }
  const record = await postcheck({
    precheckPath:resolve(precheckPath),
    activationManifestPath:resolve(activationManifestPath),
    finalizationPlanPath:resolve(finalizationPlanPath),
    completionPath:resolve(completionPath),
    artifactRoot:resolve(artifactRoot),
    finalizationDiffPath:resolve(finalizationDiffPath),
    outputPath:resolve(outputPath)
  });
  console.log(JSON.stringify({ok:true,phase:record.phase,recordHash:record.recordHash}));
} else {
  throw new Error("Finalization fastpath attestation mode must be pre or post");
}
