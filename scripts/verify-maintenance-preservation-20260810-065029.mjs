import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const baselineCommit = "ff5f183c49249a77f8ad67a0678cd502456b9cb4";
const packagePath = "src/publishing/public-news-promotion-package.v2.1.1.json";
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout;
};

const baseline = JSON.parse(git("show", `${baselineCommit}:${packagePath}`));
const candidate = JSON.parse(readFileSync(resolve(root, packagePath), "utf8"));
if (candidate.articles.length !== baseline.articles.length + 6) throw new Error("Candidate does not append exactly six articles");
if (candidate.mediaRights.length !== baseline.mediaRights.length + 18) throw new Error("Candidate does not append exactly eighteen media-rights records");

for (let index = 0; index < baseline.articles.length; index += 1) {
  if (stableJson(candidate.articles[index]) !== stableJson(baseline.articles[index])) {
    throw new Error(`Published article drift at index ${index}: ${baseline.articles[index].id}`);
  }
}
for (let index = 0; index < baseline.mediaRights.length; index += 1) {
  if (stableJson(candidate.mediaRights[index]) !== stableJson(baseline.mediaRights[index])) {
    throw new Error(`Published media-rights drift at index ${index}: ${baseline.mediaRights[index].id}`);
  }
}

const changedPaths = git("diff", "--name-only", baselineCommit, "HEAD").trim().split("\n").filter(Boolean);
const forbidden = changedPaths.filter((path) => (
  path.startsWith("public/games/")
  || path.startsWith("src/pages/games/")
  || path.startsWith("src/lib/games/")
  || path.includes("interlochen")
));
if (forbidden.length) throw new Error(`Protected Games or Interlochen paths changed: ${forbidden.join(", ")}`);

const interlochen = candidate.articles.find(({ slug }) => slug === "interlochen-abuse-investigation-report-findings");
if (!interlochen) throw new Error("Restored Interlochen investigation is missing");

console.log(JSON.stringify({
  baselineCommit,
  baselineArticleCount: baseline.articles.length,
  candidateArticleCount: candidate.articles.length,
  baselineMediaCount: baseline.mediaRights.length,
  candidateMediaCount: candidate.mediaRights.length,
  preservedArticleInventorySha256: digest(candidate.articles.slice(0, baseline.articles.length)),
  preservedMediaInventorySha256: digest(candidate.mediaRights.slice(0, baseline.mediaRights.length)),
  interlochenArticleSha256: digest(interlochen),
  protectedPathChanges: forbidden
}, null, 2));
