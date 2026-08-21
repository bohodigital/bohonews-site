import { createHash } from "node:crypto";
import { lstat, readFile, readlink, readdir, realpath } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { stableJson } from "./stable-json.mjs";

export const FINALIZATION_CODE_PATHS = Object.freeze([
  "astro.config.mjs","package.json","package-lock.json","tsconfig.json",
  "content","schemas","scripts","src","test","node_modules"
]);

const MUTABLE_RELEASE_PATHS = new Set([
  "src/publishing/public-news-promotion-package.v2.1.1.json"
]);
const MUTABLE_DEPENDENCY_CACHE_PATHS = [
  "node_modules/.astro","node_modules/.vite","node_modules/.cache"
];
const MAX_CODE_FILES = 20_000;
const MAX_CODE_FILE_BYTES = 128n * 1024n * 1024n;
const MAX_CODE_TOTAL_BYTES = 1024n * 1024n * 1024n;

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function recordHash(value) {
  return digest(stableJson(value));
}

function isMutableDependencyCachePath(path) {
  return MUTABLE_DEPENDENCY_CACHE_PATHS.some((cachePath) =>
    path === cachePath || path.startsWith(`${cachePath}/`));
}

function sameStat(left,right) {
  return ["size","dev","ino","mode","mtimeNs","ctimeNs","nlink"]
    .every((field) => left[field] === right[field]);
}

export async function finalizationCodeInventory(repositoryRoot) {
  const root = resolve(repositoryRoot);
  if (await realpath(root) !== root) {
    throw new Error("Finalization code root resolves through a symlink");
  }
  const dependencyRoot = resolve(root,"node_modules");
  const files = [];
  let totalBytes = 0n;

  async function visit(path) {
    const relativePath = relative(root,path).split(sep).join("/");
    if (isMutableDependencyCachePath(relativePath)) return;
    const stat = await lstat(path,{bigint:true});
    if (stat.isSymbolicLink()) {
      const target = await readlink(path);
      const resolvedTarget = await realpath(path);
      const resolvedRelativeTarget = relative(root,resolvedTarget).split(sep).join("/");
      if (!relativePath.startsWith("node_modules/")
        || (resolvedTarget !== dependencyRoot
          && !resolvedTarget.startsWith(`${dependencyRoot}${sep}`))
        || isMutableDependencyCachePath(resolvedRelativeTarget)) {
        throw new Error(`Code inventory contains an escaping symlink: ${path}`);
      }
      const after = await lstat(path,{bigint:true});
      if (!after.isSymbolicLink() || !sameStat(stat,after)
        || await readlink(path) !== target) {
        throw new Error(`Code or dependency changed while inventoried: ${relativePath}`);
      }
      const targetBytes = Buffer.from(target);
      files.push({
        path:relativePath,
        kind:"symlink",
        size:String(targetBytes.length),
        sha256:digest(targetBytes)
      });
    } else if (stat.isDirectory()) {
      for (const entry of await readdir(path)) await visit(resolve(path,entry));
    } else if (stat.isFile()) {
      if (MUTABLE_RELEASE_PATHS.has(relativePath)) return;
      if (stat.size > MAX_CODE_FILE_BYTES) {
        throw new Error(`Code or dependency file exceeds 128 MiB: ${relativePath}`);
      }
      totalBytes += stat.size;
      if (totalBytes > MAX_CODE_TOTAL_BYTES) {
        throw new Error("Code and dependency inventory exceeds one GiB");
      }
      const bytes = await readFile(path);
      const after = await lstat(path,{bigint:true});
      if (!after.isFile() || after.isSymbolicLink()
        || !sameStat(stat,after)) {
        throw new Error(`Code or dependency changed while inventoried: ${relativePath}`);
      }
      files.push({
        path:relativePath,
        kind:"file",
        size:String(stat.size),
        mode:String(stat.mode),
        sha256:digest(bytes)
      });
    } else {
      throw new Error(`Code inventory contains a non-file: ${path}`);
    }
    if (files.length > MAX_CODE_FILES) {
      throw new Error("Code and dependency inventory exceeds 20,000 entries");
    }
  }

  for (const path of FINALIZATION_CODE_PATHS) await visit(resolve(root,path));
  files.sort(({path:left},{path:right}) => left < right ? -1 : left > right ? 1 : 0);
  return {files,inventoryDigest:recordHash({files})};
}
