import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { stableJson } from "./publishing/stable-json.mjs";

const [privateRootArg] = process.argv.slice(2);
if (!privateRootArg) throw new Error("Usage: install-election-photo-correction PRIVATE_ELECTION_SERIES_ROOT");
const root = resolve(import.meta.dirname,"..");
const privateRoot = resolve(privateRootArg);
const promotionPath = resolve(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = resolve(root,"public-news-release.v2.1.1.json");
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const slugs = ["where-the-primaries-stand","august-18-voter-guide","democratic-change","trump-endorsement-scorecard","runoffs","senate-field","governors","house-turnover","close-results","fragmented-election-data"];
const rights = JSON.parse(readFileSync(resolve(privateRoot,"photo-correction/media-rights.v1.json"),"utf8"));
const promotion = JSON.parse(readFileSync(promotionPath,"utf8"));
if (promotion.releaseState !== "final") throw new Error("Correction must begin from a final public package");
const prior = promotion.releaseRecords.at(-1);
if (prior?.releaseId !== "release-pb-20260813t070900z-15b3e0f77c89") throw new Error("Unexpected election-series predecessor");
const oldRights = new Map(promotion.mediaRights.map((record,index) => [record.id,{record,index}]));
const articles = slugs.map((slug) => promotion.articles.find((article) => article.slug === slug));
if (articles.some((article) => !article)) throw new Error("Election article inventory is incomplete");
if (articles.some((article) => article.publishedAt !== "2026-08-13T07:16:39.142Z")) throw new Error("Original publication time drifted");
const replacementBySlug = new Map(rights.map((record) => [record.id.replace(/^media-/,"").replace(/-photo$/,"") ,record]));
const publicRights = (record) => {
  const output = structuredClone(record);
  delete output.originalPath;
  delete output.publicationAllowed;
  output.derivatives = output.derivatives.map(({path,...derivative}) => derivative);
  return output;
};

for (const article of articles) {
  const old = oldRights.get(article.leadImage.rightsId);
  if (!old) throw new Error(`Missing prior rights: ${article.leadImage.rightsId}`);
  let record;
  if (article.slug === "house-turnover") {
    const verified = oldRights.get("house-chamber-2017")?.record;
    if (!verified) throw new Error("Verified House chamber media is unavailable");
    record = structuredClone(verified);
    record.id = "media-house-turnover-photo";
    record.caption = "The chamber of the U.S. House of Representatives at the Capitol in Washington.";
    record.altText = "The empty U.S. House chamber viewed from the gallery, with the Speaker's rostrum and voting boards visible.";
    record.contextNotes = {misleading:false,usage:"Contextual photograph of the institution discussed; it does not depict a 2026 primary."};
  } else {
    record = replacementBySlug.get(article.slug);
  }
  if (!record) throw new Error(`Missing corrected rights: ${article.slug}`);
  promotion.mediaRights[old.index] = publicRights(record);
  const lead = record.derivatives.find(({role}) => role === "lead");
  const openGraph = record.derivatives.find(({role}) => role === "open-graph");
  article.leadImage = {alt:record.altText,caption:record.caption,credit:record.attribution,height:lead.height,rightsId:record.id,role:"lead",src:lead.publicPath,width:lead.width};
  article.social.image = openGraph.publicPath;
}

if (new Set(articles.map(({leadImage}) => leadImage.rightsId)).size !== 10) throw new Error("Every election article must have a distinct lead rights record");
if (articles.some(({leadImage}) => /graphic/i.test(leadImage.credit) || /graphic/i.test(leadImage.alt))) throw new Error("Synthetic headline graphic remains in corrected article inventory");

for (const record of rights) for (const derivative of record.derivatives) {
  const source = resolve(privateRoot,derivative.path);
  const target = resolve(root,`public${derivative.publicPath}`);
  mkdirSync(dirname(target),{recursive:true});
  cpSync(source,target,{errorOnExist:true});
}
const houseRights = promotion.mediaRights.find(({id}) => id === "media-house-turnover-photo");
const originalHouse = oldRights.get("house-chamber-2017").record;
for (const derivative of houseRights.derivatives) {
  const source = resolve(root,`public${originalHouse.derivatives.find(({role}) => role === derivative.role).publicPath}`);
  const target = resolve(root,`public${derivative.publicPath}`);
  if (source !== target) { mkdirSync(dirname(target),{recursive:true}); cpSync(source,target,{errorOnExist:true}); }
}

promotion.compilerVersion="bohonews-manual-election-photo-correction.v1.0.0";
promotion.generatedAt=new Date().toISOString();
promotion.releaseState="candidate";
promotion.inputHashes.mediaRights=digest(promotion.mediaRights);
promotion.inputHashes.articles=digest(promotion.articles);
promotion.inputHashes.publicationIntents=digest(slugs.map((slug) => ({slug,operation:"correction",publicChangeType:"correction",summary:"Replaced the original headline graphic with a rights-cleared photograph and corrected homepage placement."})));
delete promotion.packageDigest;
promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);
writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({slugs,rightsIds:articles.map(({leadImage})=>leadImage.rightsId),packageDigest:promotion.packageDigest},null,2));
