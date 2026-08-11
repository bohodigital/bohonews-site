import {mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-034822";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["tsa-checkpoint.jpg","gao-ai-acquisitions/tsa-checkpoint"],
  ["birch-bayh-courthouse.jpg","section-922g-sentencing/birch-bayh-courthouse"],
  ["summer-streets.jpg","cbo-demographic-outlook/summer-streets"],
  ["boise-streamflow.jpg","river-droughtcast/boise-streamflow"],
  ["nersc-technician.jpg","gao-ai-competitiveness/nersc-technician"],
  ["high-technology-high-school.jpg","school-spending/high-technology-high-school"]
];
const charts=[
  ["gao-ai-acquisitions/sample","GAO review sample",["13 AI acquisitions","4 federal agencies","Through FY 2025"],"Source: U.S. GAO"],
  ["gao-ai-acquisitions/recommendations","GAO recommendations",["Defense, DHS","GSA, Veterans Affairs","All 4 concurred"],"Source: U.S. GAO"],
  ["section-922g-sentencing/cases","Federal FY 2025",["66,662 total cases","7,245 under 922(g)","89% prior felony"],"Source: U.S. Sentencing Commission"],
  ["section-922g-sentencing/sentences","922(g) profile",["63 months average","23% in CHC VI","8% other minimum"],"Source: U.S. Sentencing Commission"],
  ["cbo-demographic-outlook/population","Population outlook",["2026: 349 million","2056: 364 million","+15 million"],"Source: Congressional Budget Office"],
  ["cbo-demographic-outlook/age-ratio","Aging ratio",["2026: 2.7 to 1","2056: 2.2 to 1","Ages 25-64 / 65+"],"Source: Congressional Budget Office"],
  ["river-droughtcast/coverage","DroughtCast coverage",[">3,000 streamgages","At least 40 years","Up to 13 weeks"],"Source: U.S. Geological Survey"],
  ["river-droughtcast/reliability","Forecast reliability",["Week 1: about 75%","Week 13: about 55%","Confidence included"],"Source: U.S. Geological Survey"],
  ["gao-ai-competitiveness/pillars","AI competitiveness",["Science + technology","People + governance","Economy"],"Source: U.S. GAO"],
  ["gao-ai-competitiveness/steps","Four-step method",["Choose outcomes","Select + analyze data","Develop options"],"Source: U.S. GAO"],
  ["school-spending/per-pupil","Per-pupil spending",["FY 2023: $16,526","FY 2024: $17,619","Change: +6.6%"],"Source: U.S. Census Bureau"],
  ["school-spending/revenue","School revenue shares",["State: 45.2%","Local: 43.2%","Federal: 11.6%"],"Source: U.S. Census Bureau"]
];
const esc=(s)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

async function derivatives(input,dir){
  await mkdir(join(root,dir),{recursive:true});
  for(const [role,[width,height]] of Object.entries(roles)){
    await sharp(input).rotate().resize(width,height,{fit:"cover",position:"centre"}).webp({quality:role==="compact-mobile"?80:82}).toFile(join(root,dir,`${role}.webp`));
  }
}
function chartSvg(title,lines,foot){
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f3eee5"/><text x="72" y="120" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#171717">${esc(title)}</text><rect x="72" y="180" width="1056" height="14" rx="7" fill="#a43b2d"/>${lines.map((l,i)=>`<text x="88" y="${310+i*145}" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#171717">${esc(l)}</text>`).join("")}<text x="88" y="800" font-family="Arial, sans-serif" font-size="26" fill="#5b554c">${esc(foot)}</text></svg>`);
}
for(const [file,dir] of leads) await derivatives(join(assets,file),dir);
for(const [dir,title,lines,foot] of charts) await derivatives(chartSvg(title,lines,foot),dir);
console.log(JSON.stringify({leads:leads.length,charts:charts.length,roles:Object.keys(roles).length}));
