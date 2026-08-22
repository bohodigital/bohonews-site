import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";
import sharp from "sharp";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const candidateDir = process.argv[2] ? resolve(process.argv[2]) : null;
const assetRoot = process.argv[3] ? resolve(process.argv[3]) : null;
if (!candidateDir || !assetRoot) {
  throw new Error("Usage: install <final-approval-candidate-dir> <materialized-assets-dir>");
}

const expected = {
  article: "0e212b15f16dd5cf00950cd8ca04ceed8b1b0618bccf9265057b039a13f35371",
  candidateState: "0b9f8909ebec80e7671f1b70c1510af90c28b3f11f2aaf2b4b601e91e0facacc",
  checksumLedger: "aca876e7a8b46b86a47c430193406b4b2f551248ffd42de2e91d5abefaa04957",
};
const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const bytes = (name) => readFileSync(resolve(candidateDir, name));
const json = (name) => JSON.parse(bytes(name));
const digestFile = (name) => sha256(bytes(name));

if (digestFile("article-package.v2.json") !== expected.article
  || digestFile("candidate-state.v1.json") !== expected.candidateState
  || digestFile("SHA256SUMS.txt") !== expected.checksumLedger) {
  throw new Error("The owner-approved One Nation candidate hashes do not match");
}

const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const article = json("article-package.v2.json");
const sourceItems = json("source-items.v1.json");
const privateRights = json("media-rights.v1.json");
if (promotion.releaseState !== "final") {
  throw new Error("Expected the currently verified final promotion baseline");
}
if (promotion.articles.some(({ id, slug }) => id === article.id || slug === article.slug)) {
  throw new Error("The One Nation article is already present in the promotion package");
}
if (article.publicationStatus !== "review"
  || article.publishedAt !== null
  || article.updatedAt !== null
  || article.releaseId !== null
  || article.bodyBlocks.length !== 93
  || sourceItems.length !== 41
  || privateRights.length !== 11) {
  throw new Error("The approved One Nation candidate state is not release-unbound and exact");
}

const sourceById = new Map(sourceItems.map((item) => [item.id, item]));
const citations = article.sourceItemIds.map((id) => {
  const source = sourceById.get(id);
  if (!source || source.publicCitationStatus !== "approved" || source.withdrawalState !== "active") {
    throw new Error(`Approved public source is unavailable: ${id}`);
  }
  return {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    url: source.canonicalUrl,
    publishedAt: source.publishedAt,
  };
});

const publicArticle = {
  schemaVersion: article.schemaVersion,
  id: article.id,
  slug: article.slug,
  headline: article.headline,
  dek: article.dek,
  articleType: article.articleType,
  publicationStatus: "approved",
  section: article.section,
  desk: article.desk,
  topics: article.topics,
  entities: article.entities,
  locations: article.locations,
  authors: article.authors,
  editor: article.editor,
  publishedAt: null,
  updatedAt: null,
  releaseId: null,
  publicChangeLog: [],
  eventId: article.eventId,
  body: article.body,
  bodyBlocks: article.bodyBlocks,
  confirmedFactsSummary: article.confirmedFactsSummary,
  uncertainty: article.uncertainty,
  citations,
  leadImage: article.leadImage,
  media: article.media,
  corrections: [],
  retractionState: article.retractionState,
  distribution: article.distribution,
  social: article.social,
  search: article.search,
  relatedArticleIds: article.relatedArticleIds,
  canonicalUrl: article.canonicalUrl,
  supersedesArticleId: article.supersedesArticleId,
  supersededByArticleId: article.supersededByArticleId,
};
if (sha256(Buffer.from(publicArticle.body)) !== sha256(Buffer.from(article.body))) {
  throw new Error("Public article body bytes drifted during compilation");
}

const originalBlocks = new Map(
  article.bodyBlocks
    .filter(({ type }) => type === "official-document-render")
    .map((block) => [block.rightsId, block]),
);
const publicRights = await Promise.all(privateRights.map(async (rights) => {
  if (!rights.publicationAllowed || rights.aiGenerated || rights.contextNotes?.misleading) {
    throw new Error(`Media rights do not permit publication: ${rights.id}`);
  }
  const original = originalBlocks.get(rights.id);
  if (!original) throw new Error(`Approved original figure is unbound: ${rights.id}`);
  const originalSitePath = resolve(root, "public", original.src.slice(1));
  if (!existsSync(originalSitePath) || statSync(originalSitePath).size === 0) {
    throw new Error(`Approved original figure bytes are unavailable: ${rights.id}`);
  }
  const originalBytes = readFileSync(originalSitePath);
  if (sha256(originalBytes) !== rights.originalFileHash) {
    throw new Error(`Approved original figure bytes are unavailable: ${rights.id}`);
  }

  let publicOriginalHash = rights.originalFileHash;
  let publicContextNotes = rights.contextNotes;
  if (rights.id === "media-one-nation-figure-7") {
    const publicPng = await sharp(originalBytes)
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toBuffer();
    writeFileSync(originalSitePath, publicPng);
    publicOriginalHash = sha256(publicPng);
    publicContextNotes = {
      ...rights.contextNotes,
      usage: `${rights.contextNotes.usage} The public .png file is a lossless PNG rendition of the preserved JPEG source; the private archive retains and hashes the original source bytes.`,
    };
  }

  const publicDerivatives = rights.derivatives.map((derivative) => {
    const source = resolve(assetRoot, derivative.path);
    const target = resolve(root, "public", derivative.publicPath.slice(1));
    if (!existsSync(source) || sha256(readFileSync(source)) !== derivative.hash) {
      throw new Error(`Approved responsive derivative is unavailable: ${derivative.path}`);
    }
    mkdirSync(resolve(target, ".."), { recursive: true });
    cpSync(source, target);
    if (sha256(readFileSync(target)) !== derivative.hash) {
      throw new Error(`Copied responsive derivative failed verification: ${derivative.publicPath}`);
    }
    return {
      role: derivative.role,
      publicPath: derivative.publicPath,
      width: derivative.width,
      height: derivative.height,
      hash: derivative.hash,
    };
  });

  publicDerivatives.push({
    role: "lead",
    publicPath: original.src,
    width: original.width,
    height: original.height,
    hash: publicOriginalHash,
  });
  return {
    schemaVersion: rights.schemaVersion,
    id: rights.id,
    sourceUrl: rights.sourceUrl,
    creator: rights.creator,
    rightsBasis: rights.rightsBasis,
    license: rights.license,
    attribution: rights.attribution,
    restrictions: rights.restrictions,
    retrievedAt: rights.retrievedAt,
    originalFileHash: rights.originalFileHash,
    derivatives: publicDerivatives,
    caption: rights.caption,
    altText: rights.altText,
    archivalStatus: rights.archivalStatus,
    contextNotes: publicContextNotes,
    aiGenerated: false,
    illustrationLabel: null,
  };
}));

promotion.articles.push(publicArticle);
promotion.mediaRights.push(...publicRights);
promotion.compilerVersion = "bohonews-manual-one-nation-installer.v1.0.0";
promotion.generatedAt = new Date().toISOString();
promotion.releaseState = "candidate";
promotion.inputHashes = {
  sourceItems: digestFile("source-items.v1.json"),
  events: digestFile("event.v1.json"),
  claims: digestFile("claims.v1.json"),
  articles: expected.article,
  approvals: sha256(Buffer.from(stableJson({
    actor: "human-owner",
    approvedCandidateSha256: expected.article,
    approvedHomepageLead: true,
  }))),
  corrections: promotion.inputHashes.corrections,
  mediaRights: digestFile("media-rights.v1.json"),
  releaseRecords: sha256(Buffer.from(stableJson(promotion.releaseRecords))),
  publicationIntents: digestFile("publication-intent.v1.json"),
};
promotion.inventory = {
  articleCount: promotion.articles.length,
  routeCount: promotion.articles.length,
  mediaCount: promotion.mediaRights.length,
};
delete promotion.packageDigest;
promotion.packageDigest = sha256(Buffer.from(stableJson(promotion)));

const release = {
  schemaVersion: promotion.schemaVersion,
  compilerVersion: promotion.compilerVersion,
  generatedAt: promotion.generatedAt,
  packageDigest: promotion.packageDigest,
  articleCount: promotion.inventory.articleCount,
  mediaCount: promotion.inventory.mediaCount,
  routes: promotion.articles.map(({ canonicalUrl }) => new URL(canonicalUrl).pathname),
  releaseRecords: promotion.releaseRecords,
  releaseState: promotion.releaseState,
};
writeFileSync(promotionPath, stableJson(promotion));
writeFileSync(releasePath, stableJson(release));

console.log(JSON.stringify({
  articleId: publicArticle.id,
  articleSha256: expected.article,
  bodySha256: sha256(Buffer.from(publicArticle.body)),
  candidatePackageDigest: promotion.packageDigest,
  articleCount: promotion.inventory.articleCount,
  mediaRightsCount: promotion.inventory.mediaCount,
  copiedDerivativeCount: publicRights.reduce((count, item) => count + item.derivatives.length - 1, 0),
  approvedOriginalCount: originalBlocks.size,
  sourceItemCount: citations.length,
  sourceCandidate: basename(candidateDir),
}, null, 2));
