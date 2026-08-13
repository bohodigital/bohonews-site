import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const [
  phase,
  sourceDistArg,
  outputArg,
  batchId,
  expectedCommit,
  previousReference,
] = process.argv.slice(2);
if (
  !["activation", "final"].includes(phase) ||
  !sourceDistArg ||
  !outputArg ||
  !batchId ||
  !expectedCommit ||
  !previousReference
)
  throw new Error(
    "Usage: prepare <activation|final> <dist> <output> <batch-id> <commit> <previous-reference>",
  );
const root = resolve(import.meta.dirname, ".."),
  sourceDist = resolve(sourceDistArg),
  output = resolve(outputArg),
  stage = join(output, "stage"),
  payload = join(stage, "dist"),
  sha256 = (value) => createHash("sha256").update(value).digest("hex"),
  packageRecord = JSON.parse(
    readFileSync(
      join(root, "src/publishing/public-news-promotion-package.v2.1.1.json"),
      "utf8",
    ),
  );
const definitions = JSON.parse(
    readFileSync(
      join(root, "scripts/maintenance-batch-20260813-005034.json"),
      "utf8",
    ),
  ),
  slugs = definitions.map(({ slug }) => slug),
  articles = slugs.map((slug) =>
    packageRecord.articles.find((article) => article.slug === slug),
  );
if (articles.some((article) => !article) || articles.length !== 6)
  throw new Error("Exact maintenance article inventory unavailable");
rmSync(output, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(sourceDist, payload, { recursive: true, errorOnExist: true });
const wellKnown = join(payload, ".well-known");
mkdirSync(wellKnown, { recursive: true });
let markerPath;
if (phase === "activation") {
  for (const name of ["bohonews-candidate.json", "bohonews-release.json"])
    rmSync(join(wellKnown, name), { force: true });
  markerPath = join(wellKnown, "bohonews-activation.json");
  writeFileSync(
    markerPath,
    JSON.stringify(
      {
        schemaVersion: "1.0.0",
        articleIds: articles.map(({ id }) => id),
        releaseState: "activation",
        candidateDigest: packageRecord.packageDigest,
      },
      null,
      2,
    ) + "\n",
  );
} else {
  rmSync(join(wellKnown, "bohonews-candidate.json"), { force: true });
  rmSync(join(wellKnown, "bohonews-activation.json"), { force: true });
  markerPath = join(wellKnown, "bohonews-release.json");
  if (!statSync(markerPath).isFile())
    throw new Error("Final release marker unavailable");
}
const mediaRoot = join(payload, "media"),
  referencedPaths = new Set(),
  textExtensions = /\.(?:css|html|js|json|mjs|txt|xml)$/i,
  collectRenderedReferences = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (filePath !== mediaRoot) collectRenderedReferences(filePath);
      } else if (entry.isFile() && textExtensions.test(entry.name)) {
        const text = readFileSync(filePath, "utf8");
        for (const match of text.matchAll(
          /["'(](\/media\/[^"')?#\s]+)(?:[?#][^"')\s]*)?/g,
        ))
          referencedPaths.add(match[1].slice(1));
      }
    }
  };
collectRenderedReferences(payload);
const pruneUnreferencedMedia = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) pruneUnreferencedMedia(filePath);
    else if (
      entry.isFile() &&
      !referencedPaths.has(relative(payload, filePath).split("\\").join("/"))
    )
      rmSync(filePath);
  }
};
pruneUnreferencedMedia(mediaRoot);
for (const path of referencedPaths)
  if (!statSync(join(payload, path)).isFile())
    throw new Error(`Rendered media reference is missing: ${path}`);
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  files = [],
  walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      compareText(a.name, b.name),
    )) {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) walk(filePath);
      else if (entry.isFile()) files.push(filePath);
      else throw new Error(`Unsupported artifact member: ${filePath}`);
    }
  };
walk(payload);
const inventory = files
    .map((filePath) => ({
      path: relative(payload, filePath).split("\\").join("/"),
      sha256: sha256(readFileSync(filePath)),
      size: statSync(filePath).size,
    }))
    .sort((a, b) => compareText(a.path, b.path)),
  inventorySha256 = sha256(Buffer.from(JSON.stringify(inventory))),
  archive = join(output, `bohonews-${phase}-pages.tar.gz`),
  uncompressedArchive = archive.replace(/\.gz$/, "");
const tar = spawnSync(
  "tar",
  ["-cf", uncompressedArchive, "-C", stage, "dist"],
  { encoding: "utf8" },
);
if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
const gzip = spawnSync("gzip", ["-9", "-f", uncompressedArchive], {
  encoding: "utf8",
});
if (gzip.status !== 0) throw new Error(`gzip failed: ${gzip.stderr}`);
const articleEvidence = articles.map((article) => ({
    articleId: article.id,
    bodySha256: sha256(Buffer.from(article.body)),
    dek: article.dek,
    headline: article.headline,
    route: new URL(article.canonicalUrl).pathname,
  })),
  routes = [
    "/",
    "/rss.xml",
    "/sitemap.xml",
    "/news-sitemap.xml",
    "/search/",
    "/robots.txt",
    "/world/",
    "/business/",
    "/us/",
    "/politics/",
    "/culture/",
    "/sports/",
    "/health-science/",
    "/technology/",
    "/weather-climate/",
    ...(phase === "activation" ? ["/games/"] : []),
    ...articleEvidence.map(({ route }) => route),
  ],
  request = {
    schemaVersion: "1.0.0",
    batchId,
    phase,
    artifactSha256: sha256(readFileSync(archive)),
    inventorySha256,
    markerSha256: sha256(readFileSync(markerPath)),
    articleIds: articles.map(({ id }) => id),
    articleEvidence,
    routes,
    expectedCommit,
    previousDeploymentReference: previousReference,
  };
writeFileSync(
  join(output, "deployment-request.v1.json"),
  JSON.stringify(request, null, 2) + "\n",
);
rmSync(stage, { recursive: true, force: true });
console.log(
  JSON.stringify(
    {
      phase,
      batchId,
      archive: basename(archive),
      fileCount: inventory.length,
      artifactSha256: request.artifactSha256,
      inventorySha256,
      markerSha256: request.markerSha256,
      articleIds: request.articleIds,
      routes,
    },
    null,
    2,
  ),
);
