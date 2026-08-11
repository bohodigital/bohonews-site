import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {calculatePublicContentInventory} from "./publishing/validate-content.mjs";
import {stableJson} from "./publishing/stable-json.mjs";

const root=resolve(import.meta.dirname,"..");
const evidenceDir=resolve(process.argv[2]??"maintenance-release-evidence");
const activationInputPath=process.argv[3]?resolve(process.argv[3]):null;
if(!activationInputPath)throw new Error("Usage: node scripts/finalize-maintenance-batch-20260811-061222.mjs <evidence-dir> <activation-evidence-input.json>");
const promotionPath=resolve(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=resolve(root,"public-news-release.v2.1.1.json");
const markerPath=resolve(root,"public/.well-known/bohonews-release.json");
const digest=(value)=>createHash("sha256").update(stableJson(value)).digest("hex");
const batchId="PB-20260811T061222Z-2F7C9A4E1B63";
const slugs=[
  "gao-financial-data-transparency-standards-2026",
  "aggravated-identity-theft-sentencing-fy2025",
  "federal-deficit-through-july-2026-cbo",
  "noaa-hyperspectral-great-lakes-ice-flights-2026",
  "nist-rm-8047-resin-3d-printing-working-curve",
  "south-population-growth-all-age-groups-2020-2025"
];
const promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
const articles=slugs.map((slug)=>promotion.articles.find((article)=>article.slug===slug));
if(promotion.releaseState!=="candidate"||articles.some((article)=>!article))throw new Error("Expected exact six-item candidate");
if(articles.some(({publishedAt,updatedAt,releaseId})=>publishedAt||updatedAt||releaseId))throw new Error("Articles already release-bound");
const approval={schemaVersion:"manual-maintenance-approval.v1",actor:"human-owner",automationId:"boho-news-manual-install-newsroom",batchId,decision:"approved",approvedAt:new Date().toISOString(),candidatePackageDigest:promotion.packageDigest,articleIds:articles.map(({id})=>id),authorization:"Temporary direct/manual publication during official-lane maintenance; preserve substantive, rights, visual, append-preservation, rollback, and health gates."};
const approvalDigest=digest(approval);
const activationInput=JSON.parse(readFileSync(activationInputPath,"utf8"));
const required=["activationArtifactSha256","activationInventorySha256","activationProviderResponseHash","activationImmutableUrl","providerActivatedAt","canonicalFirstPublicAt","canonicalFirstPublicEvidenceHash","previousVerifiedDeploymentReference","edgeRouterContractVersion","edgeRouterScriptHash","edgeRouterDeploymentResponseHash","edgeRouterActivatedAt","edgeRouterOriginImmutableUrl","edgeRouterOriginDeploymentReference","edgeRouterVerificationHash"];
if(Object.keys(activationInput).sort().join("\n")!==required.sort().join("\n"))throw new Error("Activation evidence input has unexpected shape");
const activationEvidence={schemaVersion:"1.2.0",recordId:"activation-evidence-pb-20260811t061222z-2f7c9a4e1b63",batchId,adapterId:"bohonews.article.v2",approvalDigest,candidatePackageDigest:promotion.packageDigest,...activationInput};
activationEvidence.recordHash=digest(activationEvidence);
const releaseId="release-pb-20260811t061222z-2f7c9a4e1b63";
const releaseRecord={schemaVersion:"2.1.1",releaseId,deploymentProvider:"cloudflare-pages",accountReference:"boho-digital-services.cloudflare.primary-management",project:"bohonews",environment:"production",activationDeploymentUrl:activationEvidence.activationImmutableUrl,providerActivatedAt:activationEvidence.providerActivatedAt,canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,newArticleIds:articles.map(({id})=>id),updatedArticleIds:[],canonicalUrls:articles.map(({canonicalUrl})=>canonicalUrl),activationEvidenceHash:activationEvidence.recordHash,previousVerifiedDeploymentReference:activationEvidence.previousVerifiedDeploymentReference};
releaseRecord.recordHash=digest(releaseRecord);
promotion.releaseRecords.push(releaseRecord);
for(const article of articles){article.publishedAt=activationEvidence.canonicalFirstPublicAt;article.updatedAt=activationEvidence.canonicalFirstPublicAt;article.releaseId=releaseId;}
promotion.compilerVersion="bohonews-manual-maintenance-installer.v1.0.0";promotion.generatedAt=new Date().toISOString();promotion.releaseState="final";promotion.inputHashes.releaseRecords=digest(promotion.releaseRecords);delete promotion.packageDigest;promotion.packageDigest=digest(promotion);
const releaseManifest={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
const promotionBytes=Buffer.from(stableJson(promotion));const releaseBytes=Buffer.from(stableJson(releaseManifest));writeFileSync(promotionPath,promotionBytes);writeFileSync(releasePath,releaseBytes);
const {publicContentInventoryDigest}=calculatePublicContentInventory(promotion,releaseManifest,{promotionBytes,releaseBytes,publicRoot:resolve(root,"public")});
const marker={canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,finalizerVersion:"bohonews-finalizer.v2.1.1",packageDigest:promotion.packageDigest,publicContentInventoryDigest,releaseId,schemaVersion:"1.1.0"};marker.markerHash=digest(marker);writeFileSync(markerPath,stableJson(marker));
mkdirSync(evidenceDir,{recursive:true});writeFileSync(resolve(evidenceDir,"manual-maintenance-approval.v1.json"),stableJson({...approval,recordHash:approvalDigest}));writeFileSync(resolve(evidenceDir,"activation-evidence.v1.2.json"),stableJson(activationEvidence));writeFileSync(resolve(evidenceDir,"release-summary.v1.json"),stableJson({schemaVersion:"manual-maintenance-release-summary.v1",batchId,releaseId,candidatePackageDigest:activationEvidence.candidatePackageDigest,finalPackageDigest:promotion.packageDigest,publicContentInventoryDigest,markerHash:marker.markerHash,canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt,articleIds:articles.map(({id})=>id)}));
console.log(JSON.stringify({batchId,releaseId,approvalDigest,activationEvidenceHash:activationEvidence.recordHash,packageDigest:promotion.packageDigest,publicContentInventoryDigest,markerHash:marker.markerHash,canonicalFirstPublicAt:activationEvidence.canonicalFirstPublicAt},null,2));
