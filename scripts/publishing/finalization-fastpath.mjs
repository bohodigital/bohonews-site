import { createHash, randomBytes } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile
} from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { stableJson } from "./stable-json.mjs";

export const FINALIZATION_FASTPATH_CONTRACT_VERSION =
  "bohonews-finalization-fastpath.v1.0.0";
export const ACTIVATION_LAYOUT_SCHEMA_VERSION = "1.0.0";
export const FINALIZATION_PLAN_SCHEMA_VERSION = "1.0.0";
export const COMPLETION_SCHEMA_VERSION = "1.0.0";
export const FINALIZATION_GENERATED_RELATIVE_ROOT =
  "tmp/mcp-finalization-generated";

const RELEASE_MARKER_PATH = ".well-known/bohonews-release.json";
const ACTIVATION_MARKER_PATH = ".well-known/bohonews-activation.json";
const CANDIDATE_MARKER_PATH = ".well-known/bohonews-candidate.json";
const HEADERS_PATH = "_headers";
const DYNAMIC_PUBLIC_PATHS = new Set([HEADERS_PATH,RELEASE_MARKER_PATH]);
const TEMP_TOKEN = ".bohonews-finalization-";
const MAX_ARTIFACT_FILES = 20_000;
const MAX_ARTIFACT_FILE_BYTES = 25n * 1024n * 1024n;
const MAX_ARTIFACT_TOTAL_BYTES = 2n * 1024n * 1024n * 1024n;
const MAX_RECORD_BYTES = 64n * 1024n * 1024n;
const STAT_FIELDS = [
  "size","device","inode","mode","modifiedNs","changedNs","links"
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function recordHash(value) {
  return digest(stableJson(value));
}

function slashPath(value) {
  return value.split(sep).join("/");
}

function comparePath(left,right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validRelativePath(value) {
  return typeof value === "string"
    && value.length > 0
    && !value.startsWith("/")
    && !value.includes("\\")
    && !value.split("/").some((part) => !part || part === "." || part === "..");
}

function confinedPath(root,path) {
  if (!validRelativePath(path)) throw new Error(`Unsafe finalization path: ${path}`);
  const base = resolve(root);
  const target = resolve(base,...path.split("/"));
  if (!target.startsWith(`${base}${sep}`)) {
    throw new Error(`Finalization path escapes artifact root: ${path}`);
  }
  return target;
}

function bigintText(value) {
  return value.toString(10);
}

async function fileSnapshot(path,{requireSingleLink = true} = {}) {
  const stat = await lstat(path,{bigint:true});
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Finalization artifact contains a non-regular file: ${path}`);
  }
  if (requireSingleLink && stat.nlink !== 1n) {
    throw new Error(`Finalization artifact file must have exactly one link: ${path}`);
  }
  if (stat.size > MAX_ARTIFACT_FILE_BYTES) {
    throw new Error(`Finalization artifact file exceeds 25 MiB: ${path}`);
  }
  return {
    size:bigintText(stat.size),
    device:bigintText(stat.dev),
    inode:bigintText(stat.ino),
    mode:bigintText(stat.mode),
    modifiedNs:bigintText(stat.mtimeNs),
    changedNs:bigintText(stat.ctimeNs),
    links:bigintText(stat.nlink)
  };
}

function sameSnapshot(left,right) {
  return STAT_FIELDS.every((field) => left?.[field] === right?.[field]);
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function sealedFile(path,{requireSingleLink = true} = {}) {
  const before = await fileSnapshot(path,{requireSingleLink});
  const sha256 = await sha256File(path);
  const after = await fileSnapshot(path,{requireSingleLink});
  if (!sameSnapshot(before,after)) {
    throw new Error(`Finalization artifact changed while it was hashed: ${path}`);
  }
  return {...after,sha256};
}

async function ensureDirectoryRoot(path) {
  if (!isAbsolute(path)) throw new Error(`Finalization root must be absolute: ${path}`);
  const stat = await lstat(path,{bigint:true});
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Finalization root is not a real directory: ${path}`);
  }
  const resolved = await realpath(path);
  if (resolved !== resolve(path)) {
    throw new Error(`Finalization root resolves through a symlink: ${path}`);
  }
  return {
    path:resolved,
    device:bigintText(stat.dev),
    inode:bigintText(stat.ino)
  };
}

async function walkFiles(root,{requireSingleLink = true} = {}) {
  const base = (await ensureDirectoryRoot(root)).path;
  const files = [];
  let totalBytes = 0n;
  async function visit(directory) {
    const directoryStat = await lstat(directory,{bigint:true});
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new Error(`Finalization artifact contains an unsafe directory: ${directory}`);
    }
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const path = resolve(directory,entry.name);
      const stat = await lstat(path,{bigint:true});
      if (stat.isSymbolicLink()) {
        throw new Error(`Finalization artifact contains a symlink: ${path}`);
      }
      if (stat.isDirectory()) await visit(path);
      else if (stat.isFile()) {
        if (requireSingleLink && stat.nlink !== 1n) {
          throw new Error(`Finalization artifact file must have exactly one link: ${path}`);
        }
        if (stat.size > MAX_ARTIFACT_FILE_BYTES) {
          throw new Error(`Finalization artifact file exceeds 25 MiB: ${path}`);
        }
        totalBytes += stat.size;
        if (totalBytes > MAX_ARTIFACT_TOTAL_BYTES) {
          throw new Error("Finalization artifact exceeds the two GiB safety bound");
        }
        files.push(slashPath(relative(base,path)));
        if (files.length > MAX_ARTIFACT_FILES) {
          throw new Error("Finalization artifact exceeds 20,000 files");
        }
      } else {
        throw new Error(`Finalization artifact contains a non-file entry: ${path}`);
      }
    }
  }
  await visit(base);
  return files.sort();
}

async function readBoundedFile(path,label) {
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

async function readBoundedJson(path,label) {
  try {
    return JSON.parse((await readBoundedFile(path,label)).toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`${label} is not valid JSON`);
    throw error;
  }
}

async function writeExclusiveJson(path,value) {
  const target = resolve(path);
  const parent = dirname(target);
  const bytes = stableJson(value);
  if (Buffer.byteLength(bytes) > MAX_RECORD_BYTES) {
    throw new Error("Sealed finalization record exceeds 64 MiB");
  }
  await mkdir(parent,{recursive:true});
  try {
    const existing = (await readBoundedFile(target,"Existing sealed record")).toString("utf8");
    if (existing !== bytes) throw new Error(`Existing sealed record differs: ${target}`);
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = resolve(
    parent,
    `.${basename(target)}${TEMP_TOKEN}${digest(bytes).slice(0,20)}.tmp`
  );
  try {
    await writeFile(temporary,bytes,{flag:"wx",mode:0o600});
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    if ((await readBoundedFile(
      temporary,"Existing sealed-record temporary"
    )).toString("utf8") !== bytes) {
      throw new Error(`Existing sealed-record temporary differs: ${target}`);
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
    if ((await readBoundedFile(target,"Existing sealed record")).toString("utf8") !== bytes) {
      throw new Error(`Existing sealed record differs: ${target}`);
    }
  }
  await fsyncDirectory(parent);
  try {
    await unlink(temporary);
    await fsyncDirectory(parent);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function unsignedRecord(value) {
  const output = structuredClone(value);
  delete output.recordHash;
  return output;
}

function validateRecordHash(value,label) {
  if (!value || value.recordHash !== recordHash(unsignedRecord(value))) {
    throw new Error(`${label} record hash is invalid`);
  }
}

function hasExactKeys(value,keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
}

function validDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validDecimal(value) {
  return typeof value === "string" && /^(?:0|[1-9][0-9]{0,31})$/.test(value);
}

function validBoundedSize(value) {
  return validDecimal(value) && BigInt(value) <= MAX_ARTIFACT_FILE_BYTES;
}

function exactPathOrder(records) {
  return records.every(({path},index) => validRelativePath(path)
    && (index === 0 || comparePath(records[index - 1].path,path) < 0));
}

function validateOldBinding(value,label) {
  if (!hasExactKeys(value,["size","sha256",...STAT_FIELDS.filter((field) => field !== "size")])
    || !validDigest(value.sha256)
    || !STAT_FIELDS.every((field) => validDecimal(value[field]))
    || value.links !== "1"
    || !validBoundedSize(value.size)) {
    throw new Error(`${label} old-state binding is invalid`);
  }
}

function validateDesiredBinding(value,label) {
  if (!hasExactKeys(value,["size","sha256"])
    || !validBoundedSize(value.size)
    || !validDigest(value.sha256)) {
    throw new Error(`${label} new-state binding is invalid`);
  }
}

export async function readPreparationBinding(path) {
  const binding = await readBoundedJson(path,"Finalization preparation binding");
  validateRecordHash(binding,"Finalization preparation binding");
  if (!hasExactKeys(binding,[
    "schemaVersion","contractVersion","approvalDigest","candidatePackageDigest",
    "sourceActivationArtifactSha256","sourceInventorySha256","sourceMarkerSha256",
    "recordHash"
  ])
    || binding.schemaVersion !== "1.0.0"
    || binding.contractVersion !== FINALIZATION_FASTPATH_CONTRACT_VERSION
    || ![
      "approvalDigest","candidatePackageDigest","sourceActivationArtifactSha256",
      "sourceInventorySha256","sourceMarkerSha256"
    ].every((field) => /^[a-f0-9]{64}$/.test(binding[field] ?? ""))) {
    throw new Error("Finalization preparation binding contract is invalid");
  }
  return binding;
}

export async function prepareActivationLayout({
  artifactRoot,
  publicRoot,
  preparationBinding,
  outputPath
}) {
  const artifact = await ensureDirectoryRoot(artifactRoot);
  const source = await ensureDirectoryRoot(publicRoot);
  if (!isAbsolute(outputPath) || resolve(outputPath).startsWith(`${artifact.path}${sep}`)) {
    throw new Error("Activation layout manifest must be an absolute private sibling artifact");
  }
  const [artifactPaths,publicPaths] = await Promise.all([
    walkFiles(artifact.path),
    walkFiles(source.path,{requireSingleLink:false})
  ]);
  const artifactSet = new Set(artifactPaths);
  const publicSet = new Set(publicPaths);
  if (artifactSet.has(RELEASE_MARKER_PATH)) {
    throw new Error("Activation artifact must not contain the final public release marker");
  }
  if (artifactSet.has(CANDIDATE_MARKER_PATH)) {
    throw new Error("Activation artifact must not contain the preview candidate marker");
  }
  if (!artifactSet.has(ACTIVATION_MARKER_PATH)) {
    throw new Error("Activation artifact omitted the activation marker");
  }
  for (const path of publicPaths) {
    if (path === RELEASE_MARKER_PATH) continue;
    if (!artifactSet.has(path)) {
      throw new Error(`Activation artifact omitted a required public file: ${path}`);
    }
  }

  const files = [];
  for (const path of artifactPaths) {
    const activation = await sealedFile(confinedPath(artifact.path,path));
    let role = "replace-or-delete";
    if (publicSet.has(path) && !DYNAMIC_PUBLIC_PATHS.has(path)) {
      const publicFile = await sealedFile(confinedPath(source.path,path),{
        requireSingleLink:false
      });
      if (activation.sha256 !== publicFile.sha256 || activation.size !== publicFile.size) {
        throw new Error(`Activation artifact changed an invariant public file: ${path}`);
      }
      role = "invariant";
    }
    files.push({path,role,...activation});
  }
  const activationMarker = files.find(({path}) => path === ACTIVATION_MARKER_PATH);
  if (activationMarker.sha256 !== preparationBinding.sourceMarkerSha256) {
    throw new Error("Activation marker bytes differ from the preparation binding");
  }
  const activationMarkerPath = confinedPath(artifact.path,ACTIVATION_MARKER_PATH);
  const activationMarkerBytes = await readFile(activationMarkerPath);
  if (digest(activationMarkerBytes) !== activationMarker.sha256
    || !sameSnapshot(await fileSnapshot(activationMarkerPath),activationMarker)) {
    throw new Error("Activation marker changed after the artifact was sealed");
  }
  let marker;
  try {
    marker = JSON.parse(activationMarkerBytes);
  } catch {
    throw new Error("Activation marker is not valid JSON");
  }
  if (!hasExactKeys(marker,[
    "articleIds","candidateDigest","releaseState","schemaVersion"
  ])
    || marker.schemaVersion !== "1.0.0"
    || marker.releaseState !== "activation"
    || marker.candidateDigest !== preparationBinding.candidatePackageDigest
    || !Array.isArray(marker.articleIds)
    || marker.articleIds.length < 1
    || marker.articleIds.some((id,index) => typeof id !== "string" || !id
      || (index > 0 && comparePath(marker.articleIds[index - 1],id) >= 0))) {
    throw new Error("Activation marker contract differs from the preparation binding");
  }
  const canonicalMarkerBytes = `${JSON.stringify({
    articleIds:marker.articleIds,
    candidateDigest:marker.candidateDigest,
    releaseState:marker.releaseState,
    schemaVersion:marker.schemaVersion
  })}\n`;
  if (!activationMarkerBytes.equals(Buffer.from(canonicalMarkerBytes))) {
    throw new Error("Activation marker is not canonically serialized");
  }
  const inventory = files.map(({path,size,sha256}) => ({path,size,sha256}));
  const invariantInventory = files
    .filter(({role}) => role === "invariant")
    .map(({path,size,sha256}) => ({path,size,sha256}));
  const withoutHash = {
    schemaVersion:ACTIVATION_LAYOUT_SCHEMA_VERSION,
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    phase:"activation",
    preparationBindingRecordHash:preparationBinding.recordHash,
    approvalDigest:preparationBinding.approvalDigest,
    candidatePackageDigest:preparationBinding.candidatePackageDigest,
    sourceActivationArtifactSha256:preparationBinding.sourceActivationArtifactSha256,
    sourceInventorySha256:preparationBinding.sourceInventorySha256,
    sourceMarkerSha256:preparationBinding.sourceMarkerSha256,
    rootDevice:artifact.device,
    rootInode:artifact.inode,
    dynamicPublicPaths:[...DYNAMIC_PUBLIC_PATHS].sort(),
    fileCount:files.length,
    invariantFileCount:invariantInventory.length,
    activationTreeDigest:recordHash({files:inventory}),
    invariantTreeDigest:recordHash({files:invariantInventory}),
    files
  };
  const manifest = {...withoutHash,recordHash:recordHash(withoutHash)};
  await writeExclusiveJson(resolve(outputPath),manifest);
  return manifest;
}

export async function readActivationLayout(path) {
  const manifest = await readBoundedJson(path,"Activation layout manifest");
  validateRecordHash(manifest,"Activation layout");
  if (!hasExactKeys(manifest,[
    "schemaVersion","contractVersion","phase","preparationBindingRecordHash",
    "approvalDigest","candidatePackageDigest","sourceActivationArtifactSha256",
    "sourceInventorySha256","sourceMarkerSha256","rootDevice","rootInode",
    "dynamicPublicPaths","fileCount","invariantFileCount","activationTreeDigest",
    "invariantTreeDigest","files","recordHash"
  ])
    || manifest.schemaVersion !== ACTIVATION_LAYOUT_SCHEMA_VERSION
    || manifest.contractVersion !== FINALIZATION_FASTPATH_CONTRACT_VERSION
    || manifest.phase !== "activation"
    || !Array.isArray(manifest.files)
    || manifest.fileCount !== manifest.files.length
    || manifest.fileCount > MAX_ARTIFACT_FILES
    || !validDecimal(manifest.rootDevice)
    || !validDecimal(manifest.rootInode)
    || stableJson(manifest.dynamicPublicPaths)
      !== stableJson([...DYNAMIC_PUBLIC_PATHS].sort())) {
    throw new Error("Activation layout manifest contract is invalid");
  }
  if (![
    "preparationBindingRecordHash","approvalDigest","candidatePackageDigest",
    "sourceActivationArtifactSha256","sourceInventorySha256",
    "sourceMarkerSha256"
  ].every((field) => /^[a-f0-9]{64}$/.test(manifest[field] ?? ""))) {
    throw new Error("Activation layout source binding is invalid");
  }
  const paths = manifest.files.map(({path}) => path);
  if (new Set(paths).size !== paths.length
    || paths.some((path,index) => !validRelativePath(path)
      || (index > 0 && path <= paths[index - 1]))) {
    throw new Error("Activation layout manifest paths are invalid or unsorted");
  }
  for (const file of manifest.files) {
    if (!hasExactKeys(file,[
      "path","role","size","device","inode","mode","modifiedNs","changedNs",
      "links","sha256"
    ])
      || !["invariant","replace-or-delete"].includes(file.role)
      || !/^[a-f0-9]{64}$/.test(file.sha256 ?? "")
      || !["size","device","inode","mode","modifiedNs","changedNs","links"]
        .every((field) => validDecimal(file[field]))
      || file.links !== "1") {
      throw new Error(`Activation layout entry is invalid: ${file.path}`);
    }
  }
  const inventory = manifest.files.map(({path,size,sha256}) => ({path,size,sha256}));
  const invariantInventory = manifest.files
    .filter(({role}) => role === "invariant")
    .map(({path,size,sha256}) => ({path,size,sha256}));
  const totalBytes = manifest.files.reduce((total,{size}) => total + BigInt(size),0n);
  if (manifest.invariantFileCount !== invariantInventory.length
    || totalBytes > MAX_ARTIFACT_TOTAL_BYTES
    || manifest.files.some(({size}) => BigInt(size) > MAX_ARTIFACT_FILE_BYTES)
    || manifest.activationTreeDigest !== recordHash({files:inventory})
    || manifest.invariantTreeDigest !== recordHash({files:invariantInventory})) {
    throw new Error("Activation layout inventory digest is invalid");
  }
  return manifest;
}

export async function readFinalizationPlan(path) {
  const plan = await readBoundedJson(path,"Finalization plan manifest");
  validateRecordHash(plan,"Finalization plan");
  if (!hasExactKeys(plan,[
    "schemaVersion","contractVersion","phase","activationLayoutRecordHash",
    "preparationBindingRecordHash","approvalDigest","candidatePackageDigest",
    "sourceActivationArtifactSha256","sourceInventorySha256","sourceMarkerSha256",
    "activationTreeDigest","generatedTreeDigest","finalTreeDigest",
    "desiredFileCount","changedPathCount","deletedPathCount","desired","changed",
    "deleted","recordHash"
  ])
    || plan.schemaVersion !== FINALIZATION_PLAN_SCHEMA_VERSION
    || plan.contractVersion !== FINALIZATION_FASTPATH_CONTRACT_VERSION
    || plan.phase !== "final-overlay-planned"
    || !Array.isArray(plan.desired)
    || !Array.isArray(plan.changed)
    || !Array.isArray(plan.deleted)
    || !Number.isInteger(plan.desiredFileCount)
    || !Number.isInteger(plan.changedPathCount)
    || !Number.isInteger(plan.deletedPathCount)
    || plan.desiredFileCount !== plan.desired.length
    || plan.changedPathCount !== plan.changed.length
    || plan.deletedPathCount !== plan.deleted.length
    || plan.desiredFileCount > MAX_ARTIFACT_FILES
    || plan.changedPathCount > MAX_ARTIFACT_FILES
    || plan.deletedPathCount > MAX_ARTIFACT_FILES
    || ![
      "activationLayoutRecordHash","preparationBindingRecordHash","approvalDigest",
      "candidatePackageDigest","sourceActivationArtifactSha256","sourceInventorySha256",
      "sourceMarkerSha256","activationTreeDigest","generatedTreeDigest","finalTreeDigest"
    ].every((field) => validDigest(plan[field]))) {
    throw new Error("Finalization plan manifest contract is invalid");
  }
  for (const [label,records] of [
    ["desired",plan.desired],["changed",plan.changed],["deleted",plan.deleted]
  ]) {
    if (!exactPathOrder(records)) {
      throw new Error(`Finalization plan ${label} paths are invalid or unsorted`);
    }
  }
  let desiredBytes = 0n;
  const desiredByPath = new Map();
  for (const entry of plan.desired) {
    if (!hasExactKeys(entry,["path","size","sha256"])) {
      throw new Error(`Finalization desired entry is invalid: ${entry.path}`);
    }
    validateDesiredBinding(
      {size:entry.size,sha256:entry.sha256},
      `Finalization desired ${entry.path}`
    );
    desiredBytes += BigInt(entry.size);
    desiredByPath.set(entry.path,entry);
  }
  if (desiredBytes > MAX_ARTIFACT_TOTAL_BYTES
    || plan.generatedTreeDigest !== recordHash({files:plan.desired})) {
    throw new Error("Finalization desired inventory digest is invalid");
  }
  const changedPaths = new Set();
  for (const entry of plan.changed) {
    if (!hasExactKeys(entry,["path","old","new"])) {
      throw new Error(`Finalization changed entry is invalid: ${entry.path}`);
    }
    if (entry.old !== null) validateOldBinding(entry.old,`Finalization changed ${entry.path}`);
    validateDesiredBinding(entry.new,`Finalization changed ${entry.path}`);
    const desired = desiredByPath.get(entry.path);
    if (!desired || desired.size !== entry.new.size || desired.sha256 !== entry.new.sha256) {
      throw new Error(`Finalization changed entry differs from desired output: ${entry.path}`);
    }
    changedPaths.add(entry.path);
  }
  for (const entry of plan.deleted) {
    if (!hasExactKeys(entry,["path","old"])) {
      throw new Error(`Finalization deleted entry is invalid: ${entry.path}`);
    }
    validateOldBinding(entry.old,`Finalization deleted ${entry.path}`);
    if (desiredByPath.has(entry.path) || changedPaths.has(entry.path)) {
      throw new Error(`Finalization deletion overlaps desired output: ${entry.path}`);
    }
  }
  return plan;
}

export async function readFinalizationCompletion(path) {
  const completion = await readBoundedJson(path,"Finalization completion manifest");
  validateRecordHash(completion,"Finalization completion");
  if (!hasExactKeys(completion,[
    "schemaVersion","contractVersion","phase","activationLayoutRecordHash",
    "preparationBindingRecordHash","approvalDigest","candidatePackageDigest",
    "sourceActivationArtifactSha256","sourceInventorySha256","sourceMarkerSha256",
    "activationTreeDigest","finalizationPlanRecordHash","generatedTreeDigest",
    "finalTreeDigest","finalRootDevice","finalRootInode","changed","deleted","recordHash"
  ])
    || completion.schemaVersion !== COMPLETION_SCHEMA_VERSION
    || completion.contractVersion !== FINALIZATION_FASTPATH_CONTRACT_VERSION
    || completion.phase !== "final-overlay-complete"
    || !Array.isArray(completion.changed)
    || !Array.isArray(completion.deleted)
    || completion.changed.length + completion.deleted.length > MAX_ARTIFACT_FILES * 2
    || !validDecimal(completion.finalRootDevice)
    || !validDecimal(completion.finalRootInode)
    || ![
      "activationLayoutRecordHash","preparationBindingRecordHash","approvalDigest",
      "candidatePackageDigest","sourceActivationArtifactSha256","sourceInventorySha256",
      "sourceMarkerSha256","activationTreeDigest","finalizationPlanRecordHash",
      "generatedTreeDigest","finalTreeDigest"
    ].every((field) => validDigest(completion[field]))
    || !exactPathOrder(completion.changed)
    || !exactPathOrder(completion.deleted)) {
    throw new Error("Finalization completion manifest contract is invalid");
  }
  const changedPaths = new Set();
  for (const entry of completion.changed) {
    if (!hasExactKeys(entry,["path","old","new"])) {
      throw new Error(`Finalization completion changed entry is invalid: ${entry.path}`);
    }
    if (entry.old !== null) validateOldBinding(entry.old,`Completion changed ${entry.path}`);
    if (!hasExactKeys(entry.new,[...STAT_FIELDS,"sha256"])
      || !STAT_FIELDS.every((field) => validDecimal(entry.new[field]))
      || entry.new.links !== "1"
      || !validBoundedSize(entry.new.size)
      || !validDigest(entry.new.sha256)) {
      throw new Error(`Finalization completion new state is invalid: ${entry.path}`);
    }
    changedPaths.add(entry.path);
  }
  for (const entry of completion.deleted) {
    if (!hasExactKeys(entry,["path","old"])) {
      throw new Error(`Finalization completion deleted entry is invalid: ${entry.path}`);
    }
    validateOldBinding(entry.old,`Completion deleted ${entry.path}`);
    if (changedPaths.has(entry.path)) {
      throw new Error(`Finalization completion path is both changed and deleted: ${entry.path}`);
    }
  }
  return completion;
}

async function fsyncDirectory(path) {
  const handle = await open(path,constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function currentSealedFile(path) {
  try {
    return await sealedFile(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function oldSnapshot(entry) {
  return Object.fromEntries(
    ["size","device","inode","mode","modifiedNs","changedNs","links"]
      .map((field) => [field,entry[field]])
  );
}

function isExactOldState(current,entry) {
  return current?.sha256 === entry.sha256
    && sameSnapshot(current,oldSnapshot(entry));
}

function tempRelativePath(path,sha256) {
  const directory = slashPath(dirname(path));
  const prefix = directory === "." ? "" : `${directory}/`;
  return `${prefix}.${basename(path)}${TEMP_TOKEN}${sha256.slice(0,20)}.tmp`;
}

async function desiredFiles({generatedRoot,publicRoot}) {
  const generated = await ensureDirectoryRoot(generatedRoot);
  const source = await ensureDirectoryRoot(publicRoot);
  const desired = new Map();
  for (const path of await walkFiles(generated.path)) {
    if (path.startsWith("media/")) {
      throw new Error(`Lightweight finalization output must not generate media: ${path}`);
    }
    desired.set(path,{
      path,
      sourcePath:confinedPath(generated.path,path),
      ...await sealedFile(confinedPath(generated.path,path))
    });
  }
  for (const path of [HEADERS_PATH,RELEASE_MARKER_PATH]) {
    const sourcePath = confinedPath(source.path,path);
    desired.set(path,{path,sourcePath,...await sealedFile(sourcePath,{requireSingleLink:false})});
  }
  return desired;
}

function boundOldState(entry) {
  return {size:entry.size,sha256:entry.sha256,...oldSnapshot(entry)};
}

function desiredInventoryFromMap(desired) {
  return [...desired].map(([path,{size,sha256}]) => ({path,size,sha256}))
    .sort(({path:left},{path:right}) => comparePath(left,right));
}

function deriveFinalizationPlan(activation,desired) {
  const oldByPath = new Map(activation.files.map((entry) => [entry.path,entry]));
  const desiredInventory = desiredInventoryFromMap(desired);
  for (const {path} of desiredInventory) {
    if (oldByPath.get(path)?.role === "invariant") {
      throw new Error(`Final generated output collides with an invariant activation file: ${path}`);
    }
  }
  const changed = desiredInventory.flatMap(({path,size,sha256}) => {
    const old = oldByPath.get(path) ?? null;
    if (old && old.size === size && old.sha256 === sha256) return [];
    return [{
      path,
      old:old ? boundOldState(old) : null,
      new:{size,sha256}
    }];
  });
  const desiredPaths = new Set(desiredInventory.map(({path}) => path));
  const deleted = activation.files
    .filter(({role,path}) => role === "replace-or-delete" && !desiredPaths.has(path))
    .map((entry) => ({path:entry.path,old:boundOldState(entry)}))
    .sort(({path:left},{path:right}) => comparePath(left,right));
  const finalInventory = [
    ...activation.files
      .filter(({role}) => role === "invariant")
      .map(({path,size,sha256}) => ({path,size,sha256})),
    ...desiredInventory
  ].sort(({path:left},{path:right}) => comparePath(left,right));
  if (new Set(finalInventory.map(({path}) => path)).size !== finalInventory.length) {
    throw new Error("Finalization plan contains a duplicate final path");
  }
  const finalBytes = finalInventory.reduce((total,{size}) => total + BigInt(size),0n);
  if (finalInventory.length > MAX_ARTIFACT_FILES
    || finalBytes > MAX_ARTIFACT_TOTAL_BYTES) {
    throw new Error("Finalization plan exceeds the bounded final artifact limits");
  }
  return {
    desired:desiredInventory,
    changed,
    deleted,
    generatedTreeDigest:recordHash({files:desiredInventory}),
    finalTreeDigest:recordHash({files:finalInventory})
  };
}

async function assertExactActivationRoot(artifact,activation) {
  if (artifact.device !== activation.rootDevice || artifact.inode !== activation.rootInode) {
    throw new Error("Activation artifact root differs from the sealed root");
  }
  const currentPaths = await walkFiles(artifact.path);
  const activationPaths = activation.files.map(({path}) => path);
  if (stableJson(currentPaths) !== stableJson(activationPaths)) {
    throw new Error("Activation artifact paths differ before finalization planning");
  }
  for (const entry of activation.files) {
    const path = confinedPath(artifact.path,entry.path);
    if (entry.role === "invariant") {
      if (!sameSnapshot(await fileSnapshot(path),oldSnapshot(entry))) {
        throw new Error(`Invariant activation file changed before planning: ${entry.path}`);
      }
    } else if (!isExactOldState(await currentSealedFile(path),entry)) {
      throw new Error(`Mutable activation file changed before planning: ${entry.path}`);
    }
  }
}

export async function planFinalizationOverlay({
  artifactRoot,
  activationManifestPath,
  generatedRoot,
  publicRoot,
  planPath
}) {
  const artifact = await ensureDirectoryRoot(artifactRoot);
  const activation = await readActivationLayout(activationManifestPath);
  if (!isAbsolute(planPath)
    || resolve(planPath).startsWith(`${artifact.path}${sep}`)
    || resolve(planPath).startsWith(`${resolve(generatedRoot)}${sep}`)
    || resolve(planPath).startsWith(`${resolve(publicRoot)}${sep}`)) {
    throw new Error("Finalization plan must be an absolute private sibling artifact");
  }
  await assertExactActivationRoot(artifact,activation);
  const desired = await desiredFiles({generatedRoot,publicRoot});
  const derived = deriveFinalizationPlan(activation,desired);
  const withoutHash = {
    schemaVersion:FINALIZATION_PLAN_SCHEMA_VERSION,
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    phase:"final-overlay-planned",
    activationLayoutRecordHash:activation.recordHash,
    preparationBindingRecordHash:activation.preparationBindingRecordHash,
    approvalDigest:activation.approvalDigest,
    candidatePackageDigest:activation.candidatePackageDigest,
    sourceActivationArtifactSha256:activation.sourceActivationArtifactSha256,
    sourceInventorySha256:activation.sourceInventorySha256,
    sourceMarkerSha256:activation.sourceMarkerSha256,
    activationTreeDigest:activation.activationTreeDigest,
    generatedTreeDigest:derived.generatedTreeDigest,
    finalTreeDigest:derived.finalTreeDigest,
    desiredFileCount:derived.desired.length,
    changedPathCount:derived.changed.length,
    deletedPathCount:derived.deleted.length,
    desired:derived.desired,
    changed:derived.changed,
    deleted:derived.deleted
  };
  const plan = {...withoutHash,recordHash:recordHash(withoutHash)};
  await writeExclusiveJson(resolve(planPath),plan);
  return plan;
}

async function writeReplacement({artifactRoot,path,desired,current,old}) {
  if (current?.sha256 === desired.sha256 && current.size === desired.size) return false;
  if (old) {
    if (!isExactOldState(current,old)) {
      throw new Error(`Finalization target is neither approved old nor exact new content: ${path}`);
    }
  } else if (current) {
    throw new Error(`Unexpected pre-existing finalization target: ${path}`);
  }
  const target = confinedPath(artifactRoot,path);
  const parent = dirname(target);
  await mkdir(parent,{recursive:true});
  const realParent = await realpath(parent);
  const realRoot = await realpath(artifactRoot);
  if (realParent !== realRoot && !realParent.startsWith(`${realRoot}${sep}`)) {
    throw new Error(`Finalization target parent escapes through a symlink: ${path}`);
  }
  const tempPath = confinedPath(artifactRoot,tempRelativePath(path,desired.sha256));
  let temp = await currentSealedFile(tempPath);
  if (temp && (temp.sha256 !== desired.sha256 || temp.size !== desired.size)) {
    throw new Error(`Stale finalization temporary file has unapproved bytes: ${path}`);
  }
  if (!temp) {
    await copyFile(desired.sourcePath,tempPath,constants.COPYFILE_EXCL);
    const handle = await open(tempPath,constants.O_RDONLY);
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    temp = await sealedFile(tempPath);
    if (temp.sha256 !== desired.sha256 || temp.size !== desired.size) {
      throw new Error(`Finalization temporary copy differs from approved output: ${path}`);
    }
  }
  await rename(tempPath,target);
  await fsyncDirectory(parent);
  const installed = await sealedFile(target);
  if (installed.sha256 !== desired.sha256 || installed.size !== desired.size) {
    throw new Error(`Finalization replacement verification failed: ${path}`);
  }
  return true;
}

async function removeOld({artifactRoot,path,current,old}) {
  if (!current) return false;
  if (!isExactOldState(current,old)) {
    throw new Error(`Finalization deletion target is not the approved activation file: ${path}`);
  }
  const target = confinedPath(artifactRoot,path);
  await unlink(target);
  await fsyncDirectory(dirname(target));
  return true;
}

async function writeAtomicCompletion(path,value) {
  const target = resolve(path);
  const parent = dirname(target);
  await mkdir(parent,{recursive:true});
  const bytes = stableJson(value);
  if (Buffer.byteLength(bytes) > MAX_RECORD_BYTES) {
    throw new Error("Finalization completion manifest exceeds 64 MiB");
  }
  try {
    const existing = (await readBoundedFile(
      target,"Existing completion manifest"
    )).toString("utf8");
    if (existing !== bytes) throw new Error("Existing completion manifest differs");
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = resolve(parent,`.${basename(target)}.${randomBytes(8).toString("hex")}.tmp`);
  await writeFile(temporary,bytes,{flag:"wx",mode:0o600});
  const handle = await open(temporary,constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary,target);
  await fsyncDirectory(parent);
}

export async function applyFinalizationOverlay({
  artifactRoot,
  activationManifestPath,
  finalizationPlanPath,
  generatedRoot,
  publicRoot,
  completionPath,
  onCheckpoint = null
}) {
  const artifact = await ensureDirectoryRoot(artifactRoot);
  const [activation,plan] = await Promise.all([
    readActivationLayout(activationManifestPath),
    readFinalizationPlan(finalizationPlanPath)
  ]);
  if (artifact.device !== activation.rootDevice || artifact.inode !== activation.rootInode) {
    throw new Error("Final artifact root is not the atomically renamed activation root");
  }
  if (!isAbsolute(completionPath) || resolve(completionPath).startsWith(`${artifact.path}${sep}`)) {
    throw new Error("Completion manifest must be a private sibling of the deploy tree");
  }
  const oldByPath = new Map(activation.files.map((entry) => [entry.path,entry]));
  const desired = await desiredFiles({generatedRoot,publicRoot});
  const derivedPlan = deriveFinalizationPlan(activation,desired);
  if (plan.activationLayoutRecordHash !== activation.recordHash
    || plan.preparationBindingRecordHash !== activation.preparationBindingRecordHash
    || plan.approvalDigest !== activation.approvalDigest
    || plan.candidatePackageDigest !== activation.candidatePackageDigest
    || plan.sourceActivationArtifactSha256 !== activation.sourceActivationArtifactSha256
    || plan.sourceInventorySha256 !== activation.sourceInventorySha256
    || plan.sourceMarkerSha256 !== activation.sourceMarkerSha256
    || plan.activationTreeDigest !== activation.activationTreeDigest
    || plan.generatedTreeDigest !== derivedPlan.generatedTreeDigest
    || plan.finalTreeDigest !== derivedPlan.finalTreeDigest
    || stableJson(plan.desired) !== stableJson(derivedPlan.desired)
    || stableJson(plan.changed) !== stableJson(derivedPlan.changed)
    || stableJson(plan.deleted) !== stableJson(derivedPlan.deleted)) {
    throw new Error("Finalization plan does not bind the activation seal and exact final sources");
  }
  const expectedTemps = new Set(
    [...desired].map(([path,file]) => tempRelativePath(path,file.sha256))
  );
  const currentPaths = await walkFiles(artifact.path);
  for (const path of currentPaths) {
    if (!oldByPath.has(path) && !desired.has(path) && !expectedTemps.has(path)) {
      throw new Error(`Final artifact contains an unapproved path: ${path}`);
    }
  }

  for (const entry of activation.files.filter(({role}) => role === "invariant")) {
    let current;
    try {
      current = await fileSnapshot(confinedPath(artifact.path,entry.path));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!sameSnapshot(current,oldSnapshot(entry))) {
      throw new Error(`Invariant activation file changed before finalization: ${entry.path}`);
    }
  }
  for (const entry of activation.files.filter(({role}) => role === "replace-or-delete")) {
    const current = await currentSealedFile(confinedPath(artifact.path,entry.path));
    const replacement = desired.get(entry.path);
    const alreadyNew = replacement
      && current?.sha256 === replacement.sha256
      && current.size === replacement.size;
    if (current && !alreadyNew && !isExactOldState(current,entry)) {
      throw new Error(`Mutable activation file has unapproved intermediate bytes: ${entry.path}`);
    }
  }
  for (const [path,file] of desired) {
    if (oldByPath.has(path)) continue;
    const current = await currentSealedFile(confinedPath(artifact.path,path));
    if (current && (current.sha256 !== file.sha256 || current.size !== file.size)) {
      throw new Error(`New finalization path contains unapproved intermediate bytes: ${path}`);
    }
  }

  const plannedChangedByPath = new Map(plan.changed.map((entry) => [entry.path,entry]));
  const changed = [];
  for (const [path,file] of [...desired].sort(([left],[right]) => comparePath(left,right))) {
    const old = oldByPath.get(path) ?? null;
    const before = await currentSealedFile(confinedPath(artifact.path,path));
    const replaced = await writeReplacement({
      artifactRoot:artifact.path,
      path,
      desired:file,
      current:before,
      old
    });
    if (replaced && onCheckpoint) {
      await onCheckpoint({phase:"after-replacement",path});
    }
    const after = await sealedFile(confinedPath(artifact.path,path));
    const plannedChange = plannedChangedByPath.get(path);
    if (plannedChange) {
      changed.push({
        path,
        old:plannedChange.old,
        new:after
      });
    }
    const tempPath = confinedPath(artifact.path,tempRelativePath(path,file.sha256));
    try {
      const temp = await sealedFile(tempPath);
      if (temp.sha256 !== file.sha256 || temp.size !== file.size) {
        throw new Error(`Residual finalization temp differs from exact new bytes: ${path}`);
      }
      await unlink(tempPath);
      await fsyncDirectory(dirname(tempPath));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const deleted = [];
  for (const plannedDeletion of plan.deleted) {
    const old = oldByPath.get(plannedDeletion.path);
    const current = await currentSealedFile(confinedPath(artifact.path,old.path));
    const removed = await removeOld({artifactRoot:artifact.path,path:old.path,current,old});
    if (removed && onCheckpoint) {
      await onCheckpoint({phase:"after-deletion",path:old.path});
    }
    deleted.push(plannedDeletion);
  }

  for (const entry of activation.files.filter(({role}) => role === "invariant")) {
    let current;
    try {
      current = await fileSnapshot(confinedPath(artifact.path,entry.path));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!sameSnapshot(current,oldSnapshot(entry))) {
      throw new Error(`Invariant activation file changed during finalization: ${entry.path}`);
    }
  }
  for (const [path,file] of desired) {
    const current = await currentSealedFile(confinedPath(artifact.path,path));
    if (!current || current.sha256 !== file.sha256 || current.size !== file.size) {
      throw new Error(`Final generated file is missing or invalid: ${path}`);
    }
  }
  for (const {path} of plan.deleted) {
    if (await currentSealedFile(confinedPath(artifact.path,path))) {
      throw new Error(`Preview-only activation file remains after finalization: ${path}`);
    }
  }

  const expectedFinalPaths = [
    ...activation.files.filter(({role}) => role === "invariant").map(({path}) => path),
    ...plan.desired.map(({path}) => path)
  ].sort();
  if (stableJson(await walkFiles(artifact.path)) !== stableJson(expectedFinalPaths)) {
    throw new Error("Final artifact paths differ from the durable finalization plan");
  }

  const withoutHash = {
    schemaVersion:COMPLETION_SCHEMA_VERSION,
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    phase:"final-overlay-complete",
    activationLayoutRecordHash:activation.recordHash,
    preparationBindingRecordHash:activation.preparationBindingRecordHash,
    approvalDigest:activation.approvalDigest,
    candidatePackageDigest:activation.candidatePackageDigest,
    sourceActivationArtifactSha256:activation.sourceActivationArtifactSha256,
    sourceInventorySha256:activation.sourceInventorySha256,
    sourceMarkerSha256:activation.sourceMarkerSha256,
    activationTreeDigest:activation.activationTreeDigest,
    finalizationPlanRecordHash:plan.recordHash,
    generatedTreeDigest:plan.generatedTreeDigest,
    finalTreeDigest:plan.finalTreeDigest,
    finalRootDevice:artifact.device,
    finalRootInode:artifact.inode,
    changed,
    deleted
  };
  const completion = {...withoutHash,recordHash:recordHash(withoutHash)};
  if (onCheckpoint) await onCheckpoint({phase:"before-completion"});
  await writeAtomicCompletion(resolve(completionPath),completion);
  return completion;
}
