import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=process.cwd();
const promotionPath=join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=join(root,"public-news-release.v2.1.1.json");
const mediaRoot="/media/newsroom/2026/08/manual-20260811-161954";
const retrievedAt=new Date().toISOString();
const digest=(value)=>createHash("sha256").update(typeof value==="string"||Buffer.isBuffer(value)?value:stableJson(value)).digest("hex");
const fileHash=(publicPath)=>digest(readFileSync(join(root,"public",publicPath.slice(1))));
const dims={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const roles=Object.keys(dims);

function rights({id,dir,sourceUrl,creator,rightsBasis,license,attribution,caption,alt,usage="Editorial scene tied to the article subject.",original}) {
  return {aiGenerated:false,altText:alt,archivalStatus:"current",attribution,caption,contextNotes:{misleading:false,usage},creator,
    derivatives:roles.map((role)=>({hash:fileHash(`${mediaRoot}/${dir}/${role}.webp`),height:dims[role][1],publicPath:`${mediaRoot}/${dir}/${role}.webp`,role,width:dims[role][0]})),
    id,illustrationLabel:null,license,originalFileHash:original?digest(readFileSync(join(root,"public",`${mediaRoot}/assets/${original}`.slice(1)))):fileHash(`${mediaRoot}/${dir}/four-three.webp`),
    restrictions:["Use only in the documented editorial context.","Preserve visible credit and do not imply endorsement.","Responsive crops must not alter documentary meaning."],
    retrievedAt,rightsBasis,schemaVersion:"1.1.0",sourceUrl};
}
function graphic({id,dir,sourceUrl,caption,alt}) {return rights({id,dir,sourceUrl,caption,alt,creator:"Boho News",rightsBasis:"Original editorial graphic derived only from the cited primary record.",license:"Boho News original graphic",attribution:"Boho News graphic from cited primary data",usage:"Inline explanatory graphic; never headline media."});}

const articleDefs=JSON.parse(readFileSync(join(root,"scripts/maintenance-batch-20260811-161954.json"),"utf8"));
const promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
if(promotion.releaseState!=="final")throw new Error(`Append-preserving install requires final baseline, found ${promotion.releaseState}`);
const existingSlugs=new Set(promotion.articles.map(({slug})=>slug));
const existingRights=new Set(promotion.mediaRights.map(({id})=>id));
const existingSourceUrls=new Set(promotion.mediaRights.map(({sourceUrl})=>sourceUrl));
for(const def of articleDefs){
  if(existingSlugs.has(def.slug))throw new Error(`Duplicate slug: ${def.slug}`);
  if(existingSourceUrls.has(def.lead.sourceUrl))throw new Error(`Duplicate lead source: ${def.lead.sourceUrl}`);
  for(const related of def.relatedSlugs)if(!existingSlugs.has(related))throw new Error(`Missing internal link target: ${related}`);
  for(const id of [def.lead.id,...def.charts.map(({id})=>id)])if(existingRights.has(id))throw new Error(`Duplicate rights ID: ${id}`);
}
function article(def){
  const blocks=def.paragraphs.map((text)=>({type:"paragraph",text}));
  for(const [chart,index] of [[def.charts[1],6],[def.charts[0],2]]) blocks.splice(index,0,{type:"media",rightsId:chart.id,src:`${mediaRoot}/${chart.dir}/four-three.webp`,alt:chart.alt,caption:chart.caption,credit:"Boho News graphic from cited primary data",width:1200,height:900,sourceUrl:def.sources[0].url});
  return {articleType:"news-report",authors:["Boho News Staff"],body:def.paragraphs.join("\n\n"),bodyBlocks:blocks,canonicalUrl:`https://bohonews.com/articles/${def.slug}/`,citations:def.sources,confirmedFactsSummary:def.facts,corrections:[],dek:def.dek,desk:def.desk,distribution:{newsSitemap:true,rss:true},editor:"Boho News Editorial Desk",entities:def.entities,eventId:`event-${def.slug}`,headline:def.headline,id:`article-${def.slug}`,leadImage:{alt:def.lead.alt,caption:def.lead.caption,credit:def.lead.attribution,height:900,rightsId:def.lead.id,role:"lead",src:`${mediaRoot}/${def.lead.dir}/lead.webp`,width:1600},locations:def.locations,media:[],publicChangeLog:[],publicationStatus:"approved",publishedAt:null,relatedArticleIds:def.relatedSlugs.map((slug)=>`article-${slug}`),releaseId:null,retractionState:"current",schemaVersion:"2.0.0",search:{description:def.seoDescription,index:true,title:def.seoTitle},section:def.section,slug:def.slug,social:{description:def.dek,image:`${mediaRoot}/${def.lead.dir}/open-graph.webp`,title:def.headline},supersededByArticleId:null,supersedesArticleId:null,topics:def.topics,uncertainty:def.uncertainty,updatedAt:null};
}
const newArticles=articleDefs.map(article);
const newRights=articleDefs.flatMap((def)=>[rights(def.lead),...def.charts.map((chart)=>graphic({...chart,sourceUrl:def.sources[0].url}))]);
promotion.articles.push(...newArticles);promotion.mediaRights.push(...newRights);
promotion.compilerVersion="bohonews-manual-maintenance-installer.v1.0.0";promotion.generatedAt=new Date().toISOString();promotion.releaseState="candidate";
promotion.inventory={articleCount:promotion.articles.length,routeCount:promotion.articles.length,mediaCount:promotion.mediaRights.length};
promotion.inputHashes={sourceItems:digest(articleDefs.map(({sources})=>sources)),events:digest(articleDefs.map(({slug})=>`event-${slug}`)),claims:digest(articleDefs.map(({facts})=>facts)),articles:digest(newArticles),approvals:digest({mode:"owner-authorized-maintenance",date:"2026-08-11"}),corrections:digest([]),mediaRights:digest(newRights),releaseRecords:digest(promotion.releaseRecords),publicationIntents:digest(articleDefs.map(({slug})=>({slug,intent:"manual-maintenance-release"})))};
delete promotion.packageDigest;promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({newArticles:newArticles.map(({headline,slug,section,desk})=>({headline,slug,section,desk})),packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount},null,2));
