import { lstat, mkdir, readdir, realpath, rm } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const temporaryRoot = resolve(root,"tmp");
const generatedRoot = resolve(temporaryRoot,"mcp-finalization-generated");
const emptyPublicRoot = resolve(temporaryRoot,"mcp-finalization-empty-public");
const MAX_TREE_FILES = 20_000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TREE_BYTES = 2 * 1024 * 1024 * 1024;

const resolvedRepositoryRoot = await realpath(root);
if (resolvedRepositoryRoot !== resolve(root)) {
  throw new Error("Repository root resolves through a symlink");
}
const repositoryStat = await lstat(resolvedRepositoryRoot);
const safeDirectoryStat = (stat,label) => {
  if (!stat.isDirectory() || stat.isSymbolicLink()
    || stat.uid !== repositoryStat.uid
    || stat.dev !== repositoryStat.dev
    || (stat.mode & 0o022) !== 0) {
    throw new Error(`${label} has unsafe ownership, permissions, or device`);
  }
};
const directorySeal = (stat) => ({
  device:String(stat.dev),
  inode:String(stat.ino),
  owner:String(stat.uid),
  mode:String(stat.mode)
});
const sameSeal = (left,right) => ["device","inode","owner","mode"]
  .every((field) => left[field] === right[field]);
const inspectDirectory = async (path,label,expected = null) => {
  const stat = await lstat(path);
  safeDirectoryStat(stat,label);
  if (await realpath(path) !== path) {
    throw new Error(`${label} is not a real directory`);
  }
  const seal = directorySeal(stat);
  if (expected && !sameSeal(seal,expected)) {
    throw new Error(`${label} changed during guarded finalization cleanup`);
  }
  return seal;
};
const inspectBoundedTree = async (path,label,expectedRootSeal) => {
  let fileCount = 0;
  let totalBytes = 0;
  const visit = async (directory,expectedSeal = null) => {
    const before = await inspectDirectory(directory,label,expectedSeal);
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const target = resolve(directory,entry.name);
      const stat = await lstat(target);
      if (stat.isSymbolicLink()) {
        throw new Error(`${label} contains a symlink`);
      }
      if (stat.isDirectory()) {
        safeDirectoryStat(stat,label);
        await visit(target,directorySeal(stat));
        continue;
      }
      if (!stat.isFile() || stat.uid !== repositoryStat.uid
        || stat.dev !== repositoryStat.dev || stat.nlink !== 1
        || stat.size > MAX_FILE_BYTES) {
        throw new Error(`${label} contains an unsafe or oversized file`);
      }
      fileCount += 1;
      totalBytes += stat.size;
      if (fileCount > MAX_TREE_FILES || totalBytes > MAX_TREE_BYTES) {
        throw new Error(`${label} exceeds the bounded cleanup limits`);
      }
    }
    await inspectDirectory(directory,label,before);
  };
  await visit(path,expectedRootSeal);
};
let temporarySeal;
try {
  temporarySeal = await inspectDirectory(
    temporaryRoot,"Fixed finalization temporary parent"
  );
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  await mkdir(temporaryRoot,{recursive:false,mode:0o700});
  temporarySeal = await inspectDirectory(
    temporaryRoot,"New finalization temporary parent"
  );
}

for (const path of [generatedRoot,emptyPublicRoot]) {
  if (!path.startsWith(`${temporaryRoot}${sep}`)) {
    throw new Error("Finalization build path escaped the fixed temporary root");
  }
  await inspectDirectory(
    temporaryRoot,"Fixed finalization temporary parent",temporarySeal
  );
  let existingSeal = null;
  try {
    existingSeal = await inspectDirectory(path,"Existing finalization build target");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (existingSeal) {
    await inspectDirectory(
      temporaryRoot,"Fixed finalization temporary parent",temporarySeal
    );
    await inspectDirectory(path,"Existing finalization build target",existingSeal);
    await inspectBoundedTree(
      path,"Existing finalization build target",existingSeal
    );
  }
  await rm(path,{recursive:true,force:true});
  try {
    await lstat(path);
    throw new Error(`Finalization build target remained after guarded cleanup: ${path}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await inspectDirectory(
    temporaryRoot,"Fixed finalization temporary parent",temporarySeal
  );
  await mkdir(path,{recursive:true,mode:0o700});
  const recreatedSeal = await inspectDirectory(path,"Recreated finalization build target");
  await inspectDirectory(
    temporaryRoot,"Fixed finalization temporary parent",temporarySeal
  );
  await inspectDirectory(path,"Recreated finalization build target",recreatedSeal);
}

console.log("Prepared fixed lightweight Boho News finalization build directories.");
