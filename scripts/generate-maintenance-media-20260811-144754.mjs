import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-144754";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["eu-berlaymont.jpg","eu-ai-rules/berlaymont"],
  ["cpsc-port.jpg","cpsc-efiling/port"],
  ["union-station.jpg","union-station/interior"],
  ["defense-steel-workers.jpg","defense-critical-materials/steel-workers"],
  ["okefenokee.jpg","okefenokee/refuge"],
  ["cincinnati-open.jpg","cincinnati-open/center-court"]
];
const charts=[
  ["eu-ai-rules/providers","Provider duties",["Disclose direct AI interaction","Mark covered output","Use machine-readable techniques"],"Source: European Commission"],
  ["eu-ai-rules/deployers","Deployer disclosures",["Deepfakes","Some public-interest text","Biometric and emotion systems"],"Source: European Commission"],
  ["cpsc-efiling/scope","CPSC eFiling scope",["Most regulated imports","Certificate data before entry","No new testing requirement"],"Source: U.S. CPSC"],
  ["cpsc-efiling/timeline","CPSC eFiling timeline",["General start: July 8, 2026","Foreign Trade Zones","FTZ start: January 8, 2027"],"Source: U.S. CPSC"],
  ["union-station/funding","Union Station funding layers",["Partnership plan: $24 million","Repairs and upgrades: $466 million","Final construction scope: pending"],"Source: U.S. DOT"],
  ["union-station/partners","Public project partners",["U.S. DOT and FRA","Amtrak","Union Station Redevelopment Corp."],"Source: U.S. DOT"],
  ["defense-critical-materials/waiver-path","Covered-material waiver path",["Start: January 1, 2027","Accepted mitigation plan","Source, efforts and timeline"],"Sources: Executive Order 14415; 10 U.S.C. 4872"],
  ["defense-critical-materials/materials","Statutory covered materials",["Specified rare-earth magnets","Tungsten and tantalum","Molybdenum"],"Source: 10 U.S.C. 4872"],
  ["okefenokee/new-sites","2026 World Heritage additions",["19 cultural properties","5 natural properties","1 mixed property"],"Source: UNESCO"],
  ["okefenokee/profile","Okefenokee listing",["Natural criteria: ix and x","Area: 164,565.5 hectares","Inscribed: 2026"],"Source: UNESCO"],
  ["cincinnati-open/format","2026 ATP format",["Singles: 96 players","Doubles: 32 teams","Surface: hard court"],"Source: ATP Tour"],
  ["cincinnati-open/dates","Cincinnati Open men's event",["Dates: August 13–23","Prize money: $9,193,540","ATP Masters 1000"],"Source: ATP Tour"]
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
