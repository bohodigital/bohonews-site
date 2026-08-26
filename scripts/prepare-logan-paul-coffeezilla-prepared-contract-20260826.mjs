import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [sourceDistArg, phaseRootArg, legacyRequestArg, releaseRunId,
  releaseAuthorizationId, authorizationExpiresAt, approvalDigest,
  candidatePackageDigest, batchIdOverride] = process.argv.slice(2);

if (!sourceDistArg || !phaseRootArg || !legacyRequestArg
  || !/^APR-[0-9]{8}T[0-9]{6}Z-[A-F0-9]{12}$/.test(releaseRunId ?? "")
  || !/^PRA-[0-9]{8}T[0-9]{6}Z-[A-F0-9]{12}$/.test(releaseAuthorizationId ?? "")
  || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(authorizationExpiresAt ?? "")
  || !/^[0-9a-f]{64}$/.test(approvalDigest ?? "")
  || !/^[0-9a-f]{64}$/.test(candidatePackageDigest ?? "")
  || (batchIdOverride && !/^PB-[0-9]{8}T[0-9]{6}Z-[A-F0-9]{12}$/.test(batchIdOverride))) {
  throw new Error("Usage: prepare-prepared <dist-or-archive> <phase-root> <legacy-request> <APR-id> <PRA-id> <expires-at> <approval-digest> <candidate-package-digest> [batch-id]");
}

const sourceDist = resolve(sourceDistArg);
const phaseRoot = resolve(phaseRootArg);
const legacyRequest = JSON.parse(readFileSync(resolve(legacyRequestArg), "utf8"));
if (batchIdOverride) legacyRequest.batchId = batchIdOverride;
const preparedRoot = join(phaseRoot, "prepared-dist");
const manifestPath = join(phaseRoot, "prepared-directory-manifest.v1.json");
const authorizationPath = join(phaseRoot, "edge-activation-authorization.v1.json");
const requestPath = join(phaseRoot, "deployment-request.v1.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

mkdirSync(phaseRoot, { recursive: true, mode: 0o700 });
rmSync(preparedRoot, { recursive: true, force: true });
if (statSync(sourceDist).isDirectory()) {
  cpSync(sourceDist, preparedRoot, { recursive: true, errorOnExist: true });
} else {
  const extractionRoot = join(phaseRoot, ".prepared-extraction");
  rmSync(extractionRoot, { recursive: true, force: true });
  mkdirSync(extractionRoot, { mode: 0o700 });
  const extract = spawnSync("tar", ["-xzf", sourceDist, "-C", extractionRoot], { encoding: "utf8" });
  if (extract.status !== 0) throw new Error(`tar extraction failed: ${extract.stderr}`);
  renameSync(join(extractionRoot, "dist"), preparedRoot);
  rmSync(extractionRoot, { recursive: true, force: true });
}

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unsupported prepared artifact member: ${path}`);
  }
};
walk(preparedRoot);
const inventory = files.map((path) => ({
  path: relative(preparedRoot, path).split("\\").join("/"),
  sha256: sha256(readFileSync(path)),
  size: statSync(path).size,
})).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
const inventorySha256 = sha256(Buffer.from(canonical(inventory)));
if (inventorySha256 !== legacyRequest.inventorySha256) {
  throw new Error(`Prepared inventory drifted: ${inventorySha256}`);
}

const manifest = {
  schemaVersion: "1.0.0",
  batchId: legacyRequest.batchId,
  phase: "activation",
  artifactFormat: "prepared-directory.v1",
  preparedDeploymentContractVersion: "bohonews-prepared-pages.v1.0.0",
  files: inventory.map((item) => ({ ...item, reuseFromPhase: null })),
};
const manifestBytes = Buffer.from(canonical(manifest));
writeFileSync(manifestPath, manifestBytes, { mode: 0o600 });
chmodSync(manifestPath, 0o600);

const authorization = {
  schemaVersion: "bohonews.edge-activation-authorization.v1.0.0",
  batchId: legacyRequest.batchId,
  phase: "activation",
  destinationId: "bohonews.article.v2",
  releaseRunId,
  releaseAuthorizationId,
  authorizationStatus: "CLAIMED",
  authorizationExpiresAt,
  approvalDigest,
  candidatePackageDigest,
};
const authorizationBytes = Buffer.from(`${canonical(authorization)}\n`);
writeFileSync(authorizationPath, authorizationBytes, { mode: 0o600 });
chmodSync(authorizationPath, 0o600);

const request = {
  ...legacyRequest,
  schemaVersion: "1.1.0",
  artifactFormat: "prepared-directory.v1",
  preparedDeploymentContractVersion: "bohonews-prepared-pages.v1.0.0",
  artifactSha256: sha256(manifestBytes),
  authorizationContextSha256: sha256(authorizationBytes),
  reusePreparedPayloadSealSha256: null,
};
const requestBytes = Buffer.from(`${canonical(request)}\n`);
writeFileSync(requestPath, requestBytes, { mode: 0o600 });
chmodSync(requestPath, 0o600);

console.log(JSON.stringify({
  batchId: request.batchId,
  phase: request.phase,
  fileCount: inventory.length,
  artifactSha256: request.artifactSha256,
  inventorySha256,
  markerSha256: request.markerSha256,
  authorizationContextSha256: request.authorizationContextSha256,
  releaseRunId,
  releaseAuthorizationId,
  authorizationExpiresAt,
}, null, 2));
