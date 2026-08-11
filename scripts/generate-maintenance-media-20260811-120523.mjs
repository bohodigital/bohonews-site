import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-120523";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["tax-fraud.tif","tax-fraud/miami-courthouse"],
  ["education-durham.jpg","education/durham"],
  ["speech-neurons.jpg","speech-neurons/mgh"],
  ["mauritius.jpg","mauritius/port-louis"],
  ["from-these-lands.jpg","from-these-lands/museum"],
  ["womens-college-cup.jpg","womens-college-cup/wakemed"]
];
const charts=[
  ["tax-fraud/cases-loss","Federal tax-fraud cases in FY2025",["324 cases","Median loss: $546,562","Down 12% since FY2021"],"Source: U.S. Sentencing Commission"],
  ["tax-fraud/punishment","Tax-fraud sentencing outcomes",["68% sentenced to prison","Average term: 17 months","57% were variances"],"Source: U.S. Sentencing Commission"],
  ["education/metro-change","Metro bachelor's attainment",["2015–2019: 34.2%","2020–2024: 37.8%","About 89% of metros gained"],"Source: U.S. Census Bureau ACS"],
  ["education/local-changes","Selected local changes",["Durham–Chapel Hill: +8.1 pts","Taos micro area: +9.8 pts","Springfield, MA: −3.5 pts"],"Source: U.S. Census Bureau ACS"],
  ["speech-neurons/design","Human speech study design",["8 participants","Hundreds of neurons","Natural English conversation"],"Source: NIH / Nature"],
  ["speech-neurons/signals","Language features in neural activity",["Word meaning","Grammatical roles","Sentence context"],"Source: NIH-funded study"],
  ["mauritius/outlook","Mauritius economic outlook",["2025 growth: 3.2%","2026 forecast: 2.8%","End-2026 inflation: 6.4%"],"Source: International Monetary Fund"],
  ["mauritius/buffers","Mauritius policy buffers",["Public debt: 86% of GDP","Current account: −7.1%","Reserves: $10.3B"],"Source: International Monetary Fund"],
  ["from-these-lands/scale","From These Lands exhibition",["5,000 square feet","More than 600 objects","Open through December 2029"],"Source: Smithsonian Institution"],
  ["from-these-lands/geography","Places represented",["50 states","District of Columbia","5 inhabited territories"],"Source: Smithsonian Institution"],
  ["womens-college-cup/calendar","Women's College Cup calendar",["Moves one week later","Second full December weekend","Beginning in 2026"],"Source: NCAA"],
  ["womens-college-cup/cary","College Cups in Cary",["Men's and women's events","Same weekend","2026 and 2027"],"Source: NCAA"]
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
