#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderEvidenceLibrary } from "./evidence/render-evidence-library.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "src", "lib", "public-evidence-library.v2.json");
const library = JSON.parse(await readFile(sourcePath, "utf8"));
const promotion = JSON.parse(await readFile(join(root, "src", "publishing", "public-news-promotion-package.v2.1.1.json"), "utf8"));
const articleBySlug = new Map(promotion.articles.map((article) => [article.slug, article]));
if (library.schemaVersion !== "bohonews.public-evidence-library.v2") {
  throw new Error("Unsupported public evidence-library schema");
}

const recordsById = new Map(library.documents.map((record) => [record.documentId, record]));
const stories = library.stories.map((story) => {
  const article = articleBySlug.get(story.slug);
  const records = story.documentIds.map((id) => recordsById.get(id)).filter(Boolean);
  const suggestedIds = new Set(story.suggestedDocumentIds);
  const suggested = story.suggestedDocumentIds.map((id) => recordsById.get(id)).filter(Boolean);
  const typeCounts = Object.fromEntries([...new Set(records.map((record) => record.metadata.documentType.id))]
    .map((id) => [id, records.filter((record) => record.metadata.documentType.id === id).length]));
  return {
    ...story,
    dek: article?.dek ?? null,
    section: article?.section ?? article?.desk ?? null,
    relatedArticleIds: article?.relatedArticleIds ?? [],
    records,
    suggested: suggested.length ? suggested : records.filter((record) => suggestedIds.has(record.documentId)).slice(0, 3),
    typeCounts
  };
});

const globalRoot = join(root, "dist", "evidence");
const interlochenRoot = join(root, "dist", "investigations", "interlochen", "evidence");
const noindex = process.env.BOHONEWS_INCLUDE_FIXTURES === "1"
  || process.env.BOHONEWS_PREVIEW === "1"
  || process.env.BOHONEWS_ACTIVATION === "1";
await mkdir(globalRoot, { recursive: true });
await mkdir(interlochenRoot, { recursive: true });
await writeFile(join(globalRoot, "index.html"), renderEvidenceLibrary(library.documents, stories, { noindex }));
await writeFile(join(interlochenRoot, "index.html"), renderEvidenceLibrary(library.documents, stories, { interlochenOnly: true, noindex }));
