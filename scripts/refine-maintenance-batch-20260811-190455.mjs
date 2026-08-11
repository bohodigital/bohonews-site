import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=process.cwd();
const promotionPath=join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=join(root,"public-news-release.v2.1.1.json");
const defs=JSON.parse(readFileSync(join(root,"scripts/maintenance-batch-20260811-190455.json"),"utf8"));
const promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
if(promotion.releaseState!=="candidate") throw new Error("Headline refinement requires candidate state");
const stableDigest=(value)=>createHash("sha256").update(stableJson(value)).digest("hex");
const articles=[];
for(const def of defs){
  const article=promotion.articles.find(({slug})=>slug===def.slug);
  if(!article) throw new Error(`Missing candidate article: ${def.slug}`);
  if(article.publishedAt||article.updatedAt||article.releaseId) throw new Error(`Release-bound article cannot be refined: ${def.slug}`);
  article.headline=def.headline;
  article.dek=def.dek;
  article.search={description:def.seoDescription,index:true,title:def.seoTitle};
  article.social={description:def.dek,image:article.social.image,title:def.headline};
  articles.push(article);
}
promotion.generatedAt=new Date().toISOString();
promotion.inputHashes.articles=stableDigest(articles);
promotion.inputHashes.approvals=stableDigest({mode:"owner-authorized-maintenance",date:"2026-08-11"});
delete promotion.packageDigest;
promotion.packageDigest=stableDigest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);
writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({headlines:articles.map(({headline,slug})=>({headline,slug})),packageDigest:promotion.packageDigest},null,2));
