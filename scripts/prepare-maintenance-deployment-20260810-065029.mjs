import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [phase, sourceDistArg, outputArg, batchId, expectedCommit, previousReference] = process.argv.slice(2);
if (!["activation", "final"].includes(phase) || !sourceDistArg || !outputArg || !batchId || !expectedCommit || !previousReference) {
  throw new Error("Usage: node scripts/prepare-maintenance-deployment-20260810-065029.mjs <activation|final> <dist> <output> <batch-id> <commit> <previous-reference>");
}

const root = resolve(import.meta.dirname, "..");
const sourceDist = resolve(sourceDistArg);
const output = resolve(outputArg);
const stage = join(output, "stage");
const payload = join(stage, "dist");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const packageRecord = JSON.parse(readFileSync(join(root, "src/publishing/public-news-promotion-package.v2.1.1.json"), "utf8"));
const slugs = [
  "cbo-federal-deficit-1-4-trillion-through-june-2026",
  "field-of-dreams-twins-phillies-august-13-2026",
  "nws-full-ocean-sea-state-analysis-proposal-2026",
  "imf-bangladesh-growth-3-5-percent-fy2027-reform-program",
  "federal-reserve-consumer-credit-june-2026-3-3-percent",
  "arkansas-education-waiver-ed-flex-8-8-million-2026"
];
const articles = slugs.map((slug) => packageRecord.articles.find((article) => article.slug === slug));
if (articles.some((article) => !article)) throw new Error("Exact maintenance article inventory is unavailable");

rmSync(output, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(sourceDist, payload, { recursive: true, errorOnExist: true });
const wellKnown = join(payload, ".well-known");
mkdirSync(wellKnown, { recursive: true });
let markerPath;
if (phase === "activation") {
  for (const name of ["bohonews-candidate.json", "bohonews-release.json"]) rmSync(join(wellKnown, name), { force: true });
  markerPath = join(wellKnown, "bohonews-activation.json");
  writeFileSync(markerPath, `${JSON.stringify({
    schemaVersion: "1.0.0",
    articleIds: articles.map(({ id }) => id),
    releaseState: "activation",
    candidateDigest: packageRecord.packageDigest
  }, null, 2)}\n`);
} else {
  rmSync(join(wellKnown, "bohonews-candidate.json"), { force: true });
  rmSync(join(wellKnown, "bohonews-activation.json"), { force: true });
  markerPath = join(wellKnown, "bohonews-release.json");
  if (!statSync(markerPath).isFile()) throw new Error("Final release marker is unavailable");
}

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unsupported artifact member: ${path}`);
  }
};
walk(payload);
const inventory = files.map((path) => ({
  path: relative(payload, path).split("\\").join("/"),
  sha256: sha256(readFileSync(path)),
  size: statSync(path).size
})).sort((left, right) => left.path.localeCompare(right.path));
const inventorySha256 = sha256(Buffer.from(JSON.stringify(inventory)));
const archive = join(output, `bohonews-${phase}-pages.tar.gz`);
const tar = spawnSync("tar", ["-czf", archive, "-C", stage, "dist"], { encoding: "utf8" });
if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);

const articleEvidence = articles.map((article) => ({
  articleId: article.id,
  bodySha256: sha256(Buffer.from(article.body)),
  dek: article.dek,
  headline: article.headline,
  route: new URL(article.canonicalUrl).pathname
}));
const routes = [
  "/", "/rss.xml", "/sitemap.xml", "/news-sitemap.xml", "/search/", "/robots.txt",
  "/politics/", "/sports/", "/weather-climate/", "/world/", "/business/", "/us/",
  "/articles/interlochen-abuse-investigation-report-findings/", "/games/",
  ...articleEvidence.map(({ route }) => route)
];
const request = {
  schemaVersion: "1.0.0", batchId, phase,
  artifactSha256: sha256(readFileSync(archive)), inventorySha256,
  markerSha256: sha256(readFileSync(markerPath)),
  articleIds: articles.map(({ id }) => id), articleEvidence, routes,
  expectedCommit, previousDeploymentReference: previousReference
};
writeFileSync(join(output, "deployment-request.v1.json"), `${JSON.stringify(request, null, 2)}\n`);
rmSync(stage, { recursive: true, force: true });
console.log(JSON.stringify({
  phase, batchId, archive: basename(archive), fileCount: inventory.length,
  artifactSha256: request.artifactSha256, inventorySha256, markerSha256: request.markerSha256,
  articleIds: request.articleIds, routes
}, null, 2));
