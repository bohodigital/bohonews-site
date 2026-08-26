import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "./publishing/stable-json.mjs";

const root = resolve(import.meta.dirname, "..");
const candidateDir = process.argv[2] ? resolve(process.argv[2]) : null;
const assetRoot = process.argv[3] ? resolve(process.argv[3]) : null;
if (!candidateDir || !assetRoot) {
  throw new Error("Usage: install <review-records-dir> <review-package-root>");
}

const expected = {
  article: "67afbd88e0a5b2656c66f9063fc6096326af89d469180254ee8f58ca122bc57e",
  claims: "be42180222bef52da2e3b7939ad0dba8443ae7b991dca9f0f5b324acc2aab0c3",
  event: "3b42532dc3ebe4dab51e9712a0573386c3317d0e9c885c67913ff02057624d35",
  mediaRights: "75b77bea47fb297541b70a7096f04732de5364f98bf87f7378b1d294931011b1",
  sources: "585d5bf3c649af21cab0a82c4a7ef07c5d59d7d84e2dd7e3c59858a61d9fd698",
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const bytes = (name) => readFileSync(resolve(candidateDir, name));
const json = (name) => JSON.parse(bytes(name));
const digestFile = (name) => sha256(bytes(name));

for (const [name, expectedDigest] of Object.entries({
  "article.review.json": expected.article,
  "claims.json": expected.claims,
  "event.json": expected.event,
  "media-rights.json": expected.mediaRights,
  "source-items.json": expected.sources,
})) {
  if (digestFile(name) !== expectedDigest) {
    throw new Error(`Owner-approved review record drifted: ${name}`);
  }
}

const promotionPath = resolve(root, "src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root, "public-news-release.v2.1.1.json");
const promotion = JSON.parse(readFileSync(promotionPath, "utf8"));
const article = json("article.review.json");
const sourceItems = json("source-items.json");
const claims = json("claims.json");
const event = json("event.json");
const privateRights = [json("media-rights.json")];

if (promotion.releaseState !== "final") {
  throw new Error("Expected a verified final production baseline");
}
if (promotion.articles.some(({ id, slug }) => id === article.id || slug === article.slug)) {
  throw new Error("The Logan Paul-Coffeezilla article is already present");
}
if (article.id !== "article-logan-paul-coffeezilla-settlement-videos-unavailable"
  || article.publicationStatus !== "review"
  || article.publishedAt !== null
  || article.updatedAt !== null
  || article.releaseId !== null
  || article.bodyBlocks.length !== 35
  || sourceItems.length !== 11
  || claims.length !== 7
  || privateRights.length !== 1) {
  throw new Error("The owner-approved review package is not exact and release-unbound");
}
if (claims.some((claim) => claim.verificationState !== "verified"
  || claim.editorDecision !== "hold"
  || !claim.sourceItemIds.length)) {
  throw new Error("The reviewed claims are not in the expected verified human-hold state");
}

const sourceById = new Map(sourceItems.map((item) => [item.id, item]));
const citations = article.sourceItemIds.map((id) => {
  const source = sourceById.get(id);
  if (!source || source.publicCitationStatus !== "approved"
    || source.withdrawalState !== "active" || source.embargoUntil !== null) {
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
for (const block of article.bodyBlocks.filter(({ type }) => type === "source-callout")) {
  if (!sourceById.has(block.sourceId)) {
    throw new Error(`Inline source callout is unbound: ${block.sourceId}`);
  }
}

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
  throw new Error("Public article body bytes drifted during manual compilation");
}

const publicRights = privateRights.map((rights) => {
  if (!rights.publicationAllowed || rights.aiGenerated || rights.contextNotes?.misleading) {
    throw new Error(`Media rights do not permit publication: ${rights.id}`);
  }
  const derivatives = rights.derivatives.map((derivative) => {
    const source = resolve(assetRoot, derivative.path);
    const target = resolve(root, "public", derivative.publicPath.slice(1));
    if (!existsSync(source) || sha256(readFileSync(source)) !== derivative.hash) {
      throw new Error(`Approved derivative is unavailable: ${derivative.path}`);
    }
    mkdirSync(resolve(target, ".."), { recursive: true });
    cpSync(source, target);
    if (sha256(readFileSync(target)) !== derivative.hash) {
      throw new Error(`Copied derivative failed verification: ${derivative.publicPath}`);
    }
    return {
      role: derivative.role,
      publicPath: derivative.publicPath,
      width: derivative.width,
      height: derivative.height,
      hash: derivative.hash,
    };
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
    derivatives,
    caption: rights.caption,
    altText: rights.altText,
    archivalStatus: rights.archivalStatus,
    contextNotes: rights.contextNotes,
    aiGenerated: false,
    illustrationLabel: null,
  };
});

for (const image of [
  publicArticle.leadImage,
  ...publicArticle.media,
  ...publicArticle.bodyBlocks.filter(({ type }) => type === "media"),
]) {
  const rights = publicRights.find(({ id }) => id === image.rightsId);
  const derivative = rights?.derivatives.find(({ publicPath, role }) =>
    publicPath === image.src && (!image.role || image.role === role));
  if (!rights || !derivative || image.alt !== rights.altText
    || image.caption !== rights.caption || image.credit !== rights.attribution
    || image.width !== derivative.width || image.height !== derivative.height) {
    throw new Error(`Rendered media is not bound to verified rights: ${image.src}`);
  }
}

promotion.articles.push(publicArticle);
promotion.mediaRights.push(...publicRights);
promotion.compilerVersion = "bohonews-manual-logan-paul-coffeezilla-installer.v1.0.0";
promotion.generatedAt = new Date().toISOString();
promotion.releaseState = "candidate";
promotion.inputHashes = {
  sourceItems: expected.sources,
  events: expected.event,
  claims: expected.claims,
  articles: expected.article,
  approvals: sha256(Buffer.from(stableJson({
    actor: "human-owner",
    approvedCandidateSha256: expected.article,
    approvedMediaRightsSha256: expected.mediaRights,
    decision: "approved-as-written-for-manual-publication",
  }))),
  corrections: promotion.inputHashes.corrections,
  mediaRights: expected.mediaRights,
  releaseRecords: sha256(Buffer.from(stableJson(promotion.releaseRecords))),
  publicationIntents: sha256(Buffer.from(stableJson([]))),
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
  copiedDerivativeCount: publicRights.reduce((count, item) => count + item.derivatives.length, 0),
  sourceCount: citations.length,
  sourceCalloutCount: publicArticle.bodyBlocks.filter(({ type }) => type === "source-callout").length,
  eventId: event.id,
}, null, 2));
