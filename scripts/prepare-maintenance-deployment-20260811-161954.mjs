import {createHash} from "node:crypto";
import {cpSync,mkdirSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync} from "node:fs";
import {basename,join,relative,resolve} from "node:path";
import {spawnSync} from "node:child_process";
const [phase,sourceDistArg,outputArg,batchId,expectedCommit,previousReference]=process.argv.slice(2);
if(!["activation","final"].includes(phase)||!sourceDistArg||!outputArg||!batchId||!expectedCommit||!previousReference)throw new Error("Usage: prepare <activation|final> <dist> <output> <batch-id> <commit> <previous-reference>");
const root=resolve(import.meta.dirname,"..");const sourceDist=resolve(sourceDistArg);const output=resolve(outputArg);const stage=join(output,"stage");const payload=join(stage,"dist");const sha256=(v)=>createHash("sha256").update(v).digest("hex");
const packageRecord=JSON.parse(readFileSync(join(root,"src/publishing/public-news-promotion-package.v2.1.1.json"),"utf8"));
const slugs=["us-polysilicon-import-price-floors-december-2026","sba-8a-social-disadvantage-rule-september-2026","ies-fy2027-education-research-grants-october-deadline","fda-mandatory-gras-notice-proposal-2026","usitc-asus-plume-wifi-import-relief-comments-2026","federal-mileage-reimbursement-76-cents-july-2026"];
const articles=slugs.map((slug)=>packageRecord.articles.find((article)=>article.slug===slug));if(articles.some((article)=>!article))throw new Error("Exact maintenance article inventory unavailable");
rmSync(output,{recursive:true,force:true});mkdirSync(stage,{recursive:true});cpSync(sourceDist,payload,{recursive:true,errorOnExist:true});const wellKnown=join(payload,".well-known");mkdirSync(wellKnown,{recursive:true});let markerPath;
if(phase==="activation"){for(const name of ["bohonews-candidate.json","bohonews-release.json"])rmSync(join(wellKnown,name),{force:true});markerPath=join(wellKnown,"bohonews-activation.json");writeFileSync(markerPath,JSON.stringify({schemaVersion:"1.0.0",articleIds:articles.map(({id})=>id),releaseState:"activation",candidateDigest:packageRecord.packageDigest},null,2)+"\n");}else{rmSync(join(wellKnown,"bohonews-candidate.json"),{force:true});rmSync(join(wellKnown,"bohonews-activation.json"),{force:true});markerPath=join(wellKnown,"bohonews-release.json");if(!statSync(markerPath).isFile())throw new Error("Final release marker unavailable");}
const manualMediaRoot=join(payload,"media/newsroom/2026/08");
for(const entry of readdirSync(manualMediaRoot,{withFileTypes:true})){
  if(entry.isDirectory()&&entry.name.startsWith("manual-")){
    const sourcePrefix=`/media/newsroom/2026/08/${entry.name}/assets/`;
    if(JSON.stringify(packageRecord).includes(sourcePrefix))throw new Error(`Referenced media cannot be pruned: ${sourcePrefix}`);
    rmSync(join(manualMediaRoot,entry.name,"assets"),{recursive:true,force:true});
  }
}
const files=[];const walk=(dir)=>{for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const path=join(dir,entry.name);if(entry.isDirectory())walk(path);else if(entry.isFile())files.push(path);else throw new Error(`Unsupported artifact member: ${path}`);}};walk(payload);
const inventory=files.map((path)=>({path:relative(payload,path).split("\\").join("/"),sha256:sha256(readFileSync(path)),size:statSync(path).size})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);const inventorySha256=sha256(Buffer.from(JSON.stringify(inventory)));const archive=join(output,`bohonews-${phase}-pages.tar.gz`);const tar=spawnSync("tar",["-czf",archive,"-C",stage,"dist"],{encoding:"utf8"});if(tar.status!==0)throw new Error(`tar failed: ${tar.stderr}`);
const articleEvidence=articles.map((article)=>({articleId:article.id,bodySha256:sha256(Buffer.from(article.body)),dek:article.dek,headline:article.headline,route:new URL(article.canonicalUrl).pathname}));const routes=["/","/rss.xml","/sitemap.xml","/news-sitemap.xml","/search/","/robots.txt","/world/","/business/","/us/","/politics/","/culture/","/sports/",...(phase==="activation"?["/games/"]:[]),...articleEvidence.map(({route})=>route)];
const request={schemaVersion:"1.0.0",batchId,phase,artifactSha256:sha256(readFileSync(archive)),inventorySha256,markerSha256:sha256(readFileSync(markerPath)),articleIds:articles.map(({id})=>id),articleEvidence,routes,expectedCommit,previousDeploymentReference:previousReference};writeFileSync(join(output,"deployment-request.v1.json"),JSON.stringify(request,null,2)+"\n");rmSync(stage,{recursive:true,force:true});console.log(JSON.stringify({phase,batchId,archive:basename(archive),fileCount:inventory.length,artifactSha256:request.artifactSha256,inventorySha256,markerSha256:request.markerSha256,articleIds:request.articleIds,routes},null,2));
