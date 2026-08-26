import { createHash } from "node:crypto";
import {
  chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync,
  readdirSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [archiveArg, finalRootArg, legacyRequestArg, activationRootArg, reuseSeal] = process.argv.slice(2);
if (!archiveArg || !finalRootArg || !legacyRequestArg || !activationRootArg
  || !/^[0-9a-f]{64}$/.test(reuseSeal ?? "")) {
  throw new Error("Usage: prepare-final <archive> <final-phase-root> <legacy-request> <activation-phase-root> <activation-seal>");
}
const archive = resolve(archiveArg);
const phaseRoot = resolve(finalRootArg);
const activationPhaseRoot = resolve(activationRootArg);
const activationPrepared = join(activationPhaseRoot, "prepared-dist");
const preparedRoot = join(phaseRoot, "prepared-dist");
const legacyRequest = JSON.parse(readFileSync(resolve(legacyRequestArg), "utf8"));
const repositoryHead = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", cwd: resolve(import.meta.dirname, "..") });
if (repositoryHead.status !== 0 || !/^[0-9a-f]{40}\n?$/.test(repositoryHead.stdout)) {
  throw new Error("Unable to resolve the exact final repository commit");
}
legacyRequest.expectedCommit = repositoryHead.stdout.trim();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const inventory = (root) => {
  const paths = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) paths.push(path);
      else throw new Error(`Unsupported prepared entry: ${path}`);
    }
  };
  walk(root);
  return paths.map((path) => ({
    path: relative(root, path).split("\\").join("/"),
    size: statSync(path).size,
    sha256: sha256(readFileSync(path)),
  })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
};

mkdirSync(phaseRoot, { recursive: true, mode: 0o700 });
chmodSync(phaseRoot, 0o700);
if (!existsSync(preparedRoot)) renameSync(activationPrepared, preparedRoot);
const activationManifest = JSON.parse(readFileSync(
  join(activationPhaseRoot, "prepared-directory-manifest.v1.json"),
  "utf8",
));
const activationInventory = new Map(activationManifest.files.map((item) => [item.path, {
  path: item.path,
  size: item.size,
  sha256: item.sha256,
}]));

const extractRoot = join(phaseRoot, ".final-extraction");
rmSync(extractRoot, { recursive: true, force: true });
mkdirSync(extractRoot, { mode: 0o700 });
const extract = spawnSync("tar", ["-xzf", archive, "-C", extractRoot], { encoding: "utf8" });
if (extract.status !== 0) throw new Error(`tar extraction failed: ${extract.stderr}`);
const desiredRoot = join(extractRoot, "dist");
const desiredInventory = inventory(desiredRoot);
const desiredPaths = new Set(desiredInventory.map(({ path }) => path));

for (const current of inventory(preparedRoot)) {
  if (!desiredPaths.has(current.path)) rmSync(join(preparedRoot, current.path));
}
for (const desired of desiredInventory) {
  const source = join(desiredRoot, desired.path);
  const target = join(preparedRoot, desired.path);
  const current = activationInventory.get(desired.path);
  if (current && current.size === desired.size && current.sha256 === desired.sha256 && existsSync(target)) continue;
  mkdirSync(dirname(target), { recursive: true, mode: 0o755 });
  const temporary = `${target}.final-${process.pid}`;
  copyFileSync(source, temporary);
  chmodSync(temporary, 0o644);
  renameSync(temporary, target);
}
const pruneEmpty = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmpty(join(directory, entry.name));
  }
  if (directory !== preparedRoot && readdirSync(directory).length === 0) rmdirSync(directory);
};
pruneEmpty(preparedRoot);
for (const entry of readdirSync(preparedRoot, { withFileTypes: true })) {
  if (entry.isDirectory()) chmodSync(join(preparedRoot, entry.name), 0o755);
}
rmSync(extractRoot, { recursive: true, force: true });

const finalInventory = inventory(preparedRoot);
const inventorySha256 = sha256(Buffer.from(canonical(finalInventory)));
if (inventorySha256 !== legacyRequest.inventorySha256) throw new Error("Final prepared inventory drifted");
const manifest = {
  schemaVersion: "1.0.0",
  batchId: legacyRequest.batchId,
  phase: "final",
  artifactFormat: "prepared-directory.v1",
  preparedDeploymentContractVersion: "bohonews-prepared-pages.v1.0.0",
  files: finalInventory.map((item) => {
    const prior = activationInventory.get(item.path);
    return { ...item, reuseFromPhase: prior && prior.size === item.size && prior.sha256 === item.sha256 ? "activation" : null };
  }),
};
const manifestBytes = Buffer.from(canonical(manifest));
writeFileSync(join(phaseRoot, "prepared-directory-manifest.v1.json"), manifestBytes, { mode: 0o600 });
const request = {
  ...legacyRequest,
  schemaVersion: "1.1.0",
  artifactFormat: "prepared-directory.v1",
  preparedDeploymentContractVersion: "bohonews-prepared-pages.v1.0.0",
  artifactSha256: sha256(manifestBytes),
  reusePreparedPayloadSealSha256: reuseSeal,
};
writeFileSync(join(phaseRoot, "deployment-request.v1.json"), `${canonical(request)}\n`, { mode: 0o600 });
console.log(JSON.stringify({
  batchId: request.batchId,
  fileCount: finalInventory.length,
  artifactSha256: request.artifactSha256,
  inventorySha256,
  markerSha256: request.markerSha256,
  reusedFiles: manifest.files.filter(({ reuseFromPhase }) => reuseFromPhase === "activation").length,
}, null, 2));
