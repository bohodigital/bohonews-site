import {mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-071852";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["state-truman-building.jpg","state-overseas-housing/truman-building"],
  ["fed-eccles-building.jpg","fed-lending-survey/federal-reserve"],
  ["nih-cancer-lab.jpg","nih-cancer-models/laboratory"],
  ["smithsonian-natural-history.jpg","smithsonian-bison/natural-history-museum"],
  ["ncaa-flag-football.jpg","ncaa-flag-football/flag-football-game"],
  ["who-headquarters.jpg","who-health-days/headquarters"]
];
const charts=[
  ["state-overseas-housing/standards-age","Standards age",["Last updated: 1991","Review year: 2026","35 years without revision"],"Source: U.S. GAO"],
  ["state-overseas-housing/costs","2025 housing costs",["87% met cost standards","$497M annual leases","$8.8M waiver overages"],"Source: U.S. GAO"],
  ["fed-lending-survey/demand","Loan demand",["Large-firm business: stronger","Mortgages: weaker","Auto loans: weaker"],"Source: Federal Reserve"],
  ["fed-lending-survey/sample","July survey sample",["56 domestic banks","18 foreign-bank branches","Published Aug. 3, 2026"],"Source: Federal Reserve"],
  ["nih-cancer-models/inventory","Cancer-model inventory",["665 laboratory models","25 cancer types","2,780 donors"],"Source: NIH"],
  ["nih-cancer-models/concordance","Tumor-model agreement",["Genetic: 97.8%","Epigenetic: 95%","RNA expression: 92%"],"Source: NIH"],
  ["smithsonian-bison/timeline","2026 bison program",["Bronzes: March 19","Standing Strong: May 7","Imagining Bison: May 21"],"Source: Smithsonian Institution"],
  ["smithsonian-bison/exhibition","Exhibition elements",["Fossils + specimens","Indigenous objects + archives","Sound, video + replicas"],"Source: Smithsonian Institution"],
  ["ncaa-flag-football/path","Championship path",["Participation thresholds met","Board funding approved","Membership vote in January"],"Source: NCAA"],
  ["ncaa-flag-football/oversight","Budget and oversight",["National Collegiate event","Sport committee funded","Division I oversight: 2027-28"],"Source: NCAA"],
  ["who-health-days/observances","Global observances",["108 recognized observances","11 WHA-mandated days","2 WHA-mandated weeks"],"Source: WHO independent evaluation"],
  ["who-health-days/method","Evaluation sample",["120 qualitative participants","111 survey responses","3 campaign case studies"],"Source: WHO independent evaluation"]
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
