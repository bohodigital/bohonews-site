import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const publicFigurePath = resolve(
  root,
  "public/media/investigations/one-nation-network/figures/figure-03-meta-ad-library-north-carolinian-results.png",
);
const publicJpegPath = publicFigurePath.replace(/\.png$/, ".jpg");
const preservedSourceArg = process.argv[2] ? resolve(process.argv[2]) : null;
if (!preservedSourceArg) {
  throw new Error("Usage: repair-one-nation-public-figure <preserved-original-file>");
}
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const expectedTranscodedPackageDigest = "95f34670fe24077a89ba50412e7b3fd887b0d7dd7c15490607c67ede4735c652";
const expectedSourceHash = "3ce8ae4d1d7e97ab38061c98e12fc859649aa9a1697fc670489723ffff0536b9";
const expectedTranscodedHash = "1e22c694318ce97832723dbb77864c5cd1bef39afdf6f92414cb14a4363d3500";
const expectedBodyHash = "8f5e169d30883767d61520ff0791e4ac7dba39f059432eb4f59a49e3c8563cde";

const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const release = JSON.parse(readFileSync(releasePath, "utf8"));
const article = promotion.articles.find(({ id }) => id === "article-one-nation-astroturf-network");
const rights = promotion.mediaRights.find(({ id }) => id === "media-one-nation-figure-7");
const derivative = rights?.derivatives.find(({ publicPath }) => publicPath.endsWith(
  "/figure-03-meta-ad-library-north-carolinian-results.png",
));
const transcodedBytes = readFileSync(publicFigurePath);
const sourceBytes = readFileSync(preservedSourceArg);
const bodyBlock = article?.bodyBlocks.find(({ src }) => src?.endsWith(
  "/figure-03-meta-ad-library-north-carolinian-results.png",
));

if (promotion.packageDigest !== expectedTranscodedPackageDigest
  || release.packageDigest !== expectedTranscodedPackageDigest
  || sha256(Buffer.from(article?.body ?? "")) !== expectedBodyHash
  || sha256(sourceBytes) !== expectedSourceHash
  || sha256(transcodedBytes) !== expectedTranscodedHash
  || derivative?.hash !== expectedTranscodedHash
  || rights?.originalFileHash !== expectedSourceHash) {
  throw new Error("The installed One Nation candidate is not the exact repair baseline");
}

writeFileSync(publicFigurePath, sourceBytes);
writeFileSync(publicJpegPath, sourceBytes);
derivative.publicPath = derivative.publicPath.replace(/\.png$/, ".jpg");
derivative.hash = expectedSourceHash;
bodyBlock.src = bodyBlock.src.replace(/\.png$/, ".jpg");
rights.contextNotes.usage = rights.contextNotes.usage.replace(
  " The public .png file is a lossless PNG rendition of the preserved JPEG source; the private archive retains and hashes the original source bytes.",
  " The public article uses a byte-identical .jpg copy of the preserved JPEG source so its served extension matches its bytes; the frozen source remains retained under its original captured filename and hash.",
);

promotion.compilerVersion = "bohonews-manual-one-nation-installer.v1.0.2";
promotion.generatedAt = new Date().toISOString();
delete promotion.packageDigest;
promotion.packageDigest = sha256(Buffer.from(stableJson(promotion)));

release.compilerVersion = promotion.compilerVersion;
release.generatedAt = promotion.generatedAt;
release.packageDigest = promotion.packageDigest;
writeFileSync(promotionPath, stableJson(promotion));
writeFileSync(releasePath, stableJson(release));

console.log(JSON.stringify({
  articleId: article.id,
  approvedBodySha256: expectedBodyHash,
  privateOriginalSha256: expectedSourceHash,
  publicArticleJpegSha256: expectedSourceHash,
  candidatePackageDigest: promotion.packageDigest,
}, null, 2));
