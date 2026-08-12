import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";
const root="public/media/newsroom/2026/08/manual-20260812-202001", assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[["opm-building.jpg","mspb-appeals/opm-building"],["swayambhunath.jpg","nepal-imports/swayambhunath"],["boeing-787.jpg","boeing-787-corrosion/dreamliner"],["clearing-yard.jpg","belt-railway-ptc/clearing-yard"],["pathologists.jpg","nih-methylation/pathologists"],["philadelphia-mint.jpg","mint-pricing/philadelphia-mint"]];
const charts=[
 ["mspb-appeals/changes","Three appeal paths change",["Probationary termination","Suitability actions","General reductions in force"],"Source: MSPB final rule, August 12, 2026"],
 ["mspb-appeals/exceptions","What MSPB still hears",["Pending cases","Qualifying earlier agency actions","Foreign Service RIF appeals"],"Source: MSPB; timing and appointment type matter"],
 ["nepal-imports/date-range","Designated cultural property",["Archaeological: 32,000 B.C.E.–1770","Ethnological: 13th century–1950","Representative category list"],"Source: CBP final rule and designated list"],
 ["nepal-imports/duration","Five-year agreement period",["Effective: Aug. 12, 2026","Scheduled end: Jan. 8, 2031","Extension possible under statute"],"Source: CBP; object documentation still controls entry"],
 ["boeing-787-corrosion/scope","Proposed 787 corrosion work",["U.S. aircraft: 116","Bolt-hole locations: 16","Comments due: Sept. 28"],"Source: FAA proposed airworthiness directive"],
 ["boeing-787-corrosion/cost","FAA principal-action estimate",["Per airplane: $38,260","U.S. operators: up to $4.44M","Actual work depends on findings"],"Source: FAA regulatory cost estimate"],
 ["belt-railway-ptc/process","PTC amendment review",["Submitted: Aug. 6","Comments due: Sept. 1","FRA: approve • condition • deny"],"Source: Federal Railroad Administration notice"],
 ["belt-railway-ptc/scope","Requested maintenance scope",["Four planned work windows","September and October","Brief communication losses possible"],"Source: FRA; BRC says I-ETMS will not be disabled"],
 ["nih-methylation/cns-scale","CNS classifier reference set",["Profiles: 16,567","Families: 22 • classes: 133","Newly developed classes: 21"],"Source: NIH technology-licensing notice"],
 ["nih-methylation/clinical-analysis","1,204 NIH validation cases",["Confirmed: 25.6% • refined: 14.6%","Increased precision: 54.7%","Substantially reclassified: 5.0%"],"Source: NIH; prototype technology, not medical advice"],
 ["mint-pricing/product-prices","2026 dollar product prices",["25-coin roll: $61","100-coin bag: $154.50","Effective: Aug. 14"],"Source: United States Mint price notice"],
 ["mint-pricing/gold-status","Gold proof price is not set",["One ounce • 24 karat","Published price: TBD","Precious-metal grid reviewed weekly"],"Source: United States Mint; LBMA-linked pricing"]
];
const esc=s=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function derivatives(input,dir){await mkdir(join(root,dir),{recursive:true});for(const [role,[width,height]] of Object.entries(roles))await sharp(input).rotate().resize(width,height,{fit:"cover",position:"centre"}).webp({quality:role==="compact-mobile"?80:82}).toFile(join(root,dir,`${role}.webp`));}
function svg(title,lines,foot){return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f3eee5"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#171717">${esc(title)}</text><rect x="72" y="180" width="1056" height="14" rx="7" fill="#a43b2d"/>${lines.map((x,i)=>`<text x="88" y="${310+i*145}" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="#171717">${esc(x)}</text>`).join("")}<text x="88" y="800" font-family="Arial,sans-serif" font-size="26" fill="#5b554c">${esc(foot)}</text></svg>`)}
for(const [file,dir] of leads)await derivatives(join(assets,file),dir);
for(const [dir,title,lines,foot] of charts)await derivatives(svg(title,lines,foot),dir);
console.log(JSON.stringify({leads:leads.length,charts:charts.length,derivatives:(leads.length+charts.length)*Object.keys(roles).length}));
