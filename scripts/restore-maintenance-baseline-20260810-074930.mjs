import {execFileSync} from "node:child_process";
import {writeFileSync} from "node:fs";

for (const path of [
  "src/publishing/public-news-promotion-package.v2.1.1.json",
  "public-news-release.v2.1.1.json"
]) {
  const baseline = execFileSync("git", ["show", `HEAD:${path}`], {maxBuffer: 64 * 1024 * 1024});
  writeFileSync(path, baseline);
}
console.log("Restored authoritative package files from isolated-clone HEAD.");
