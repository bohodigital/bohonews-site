import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const publicFigurePath = resolve(
  root,
  "public/media/investigations/one-nation-network/figures/figure-03-meta-ad-library-north-carolinian-results.png",
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const expectedPackageDigest = "d756d21839dd353345f9dc3247c00731c1b63768a9499c169650f88c1574c884";
const expectedSourceHash = "3ce8ae4d1d7e97ab38061c98e12fc859649aa9a1697fc670489723ffff0536b9";
const expectedBodyHash = "8f5e169d30883767d61520ff0791e4ac7dba39f059432eb4f59a49e3c8563cde";

const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const release = JSON.parse(readFileSync(releasePath, "utf8"));
const article = promotion.articles.find(({ id }) => id === "article-one-nation-astroturf-network");
const rights = promotion.mediaRights.find(({ id }) => id === "media-one-nation-figure-7");
const derivative = rights?.derivatives.find(({ publicPath }) => publicPath.endsWith(
  "/figure-03-meta-ad-library-north-carolinian-results.png",
));
const sourceBytes = readFileSync(publicFigurePath);

if (promotion.packageDigest !== expectedPackageDigest
  || release.packageDigest !== expectedPackageDigest
  || sha256(Buffer.from(article?.body ?? "")) !== expectedBodyHash
  || sha256(sourceBytes) !== expectedSourceHash
  || derivative?.hash !== expectedSourceHash
  || rights?.originalFileHash !== expectedSourceHash) {
  throw new Error("The installed One Nation candidate is not the exact repair baseline");
}

const publicPng = await sharp(sourceBytes)
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toBuffer();
const metadata = await sharp(publicPng).metadata();
if (metadata.format !== "png" || metadata.width !== 1280 || metadata.height !== 720) {
  throw new Error("The lossless public PNG rendition did not preserve the approved dimensions");
}
const publicHash = sha256(publicPng);
writeFileSync(publicFigurePath, publicPng);
derivative.hash = publicHash;
rights.contextNotes.usage = `${rights.contextNotes.usage} The public .png file is a lossless PNG rendition of the preserved JPEG source; the private archive retains and hashes the original source bytes.`;

promotion.compilerVersion = "bohonews-manual-one-nation-installer.v1.0.1";
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
  publicPngSha256: publicHash,
  candidatePackageDigest: promotion.packageDigest,
}, null, 2));
