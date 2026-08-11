import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-205655";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["cpsc-counterfeit-toys.jpg","cpsc-counterfeit-toys/archive"],
  ["epa-water-operator.jpg","epa-water-workforce/jar-test"],
  ["student-loan-graduation.jpg","student-loan-autopay/graduation"],
  ["carstensz-pyramid.jpg","papua-glacier/summit",{left:0,top:0,width:6000,height:3000}],
  ["peruvian-fishing-boats.jpg","pace-chlorophyll/peru-boats"],
  ["roebuck-bay-low-tide.jpg","roebuck-bay/low-tide"]
];
const charts=[
  ["cpsc-counterfeit-toys/shipments","Counterfeit squishy toys stopped",["Violative shipments: 55","Units stopped: 355,683","Action: intercepted at U.S. ports"],"Source: CPSC, August 5, 2026"],
  ["cpsc-counterfeit-toys/hazards","Hazards identified by CPSC",["Water beads and small parts","Lead and prohibited phthalates","Heated toys can burst and worsen burns"],"Source: CPSC; not every squishy toy is implicated"],
  ["epa-water-workforce/retirement","Water-sector retirement wave",["About 1 in 3 workers","Agency estimate: nearing retirement","Planning need: hiring and knowledge transfer"],"Source: EPA; timing of departures varies"],
  ["epa-water-workforce/priorities","Water-workforce priorities",["Recruitment and retention","Interstate coordination","Cybersecurity and technical skills"],"Source: EPA roundtable, August 4, 2026"],
  ["student-loan-autopay/discount","Temporary autopay reduction",["Existing discount: 0.25 point","Temporary addition: 0.75 point","Total reduction: 1 percentage point"],"Source: U.S. Department of Education"],
  ["student-loan-autopay/timeline","Enrollment and benefit window",["Benefit began: July 1, 2026","Enroll by: September 30, 2026","Scheduled through: June 30, 2028"],"Source: Education Department; eligibility required"],
  ["papua-glacier/area","Papua tropical ice",["1988 area baseline: 100%","Remaining area: about 2%","Possible loss: end-2026 or early 2027"],"Source: WMO; disappearance date is an estimate"],
  ["papua-glacier/indicators","South-West Pacific indicators",["2025 anomaly: +0.37°C","Baseline: 1991–2020","Sea-level rise: 3.7 ±0.03 mm/year"],"Source: WMO; sea-level period 1999–2025"],
  ["pace-chlorophyll/comparison","PACE observes a changing Pacific",["June 2025: neutral conditions","June 2026: strengthening El Niño","Central Pacific chlorophyll: substantially lower"],"Source: NASA; chlorophyll is a proxy"],
  ["pace-chlorophyll/process","Why surface chlorophyll fell",["Weaker easterly trade winds","Less nutrient-rich upwelling","Lower satellite-detected chlorophyll"],"Source: NASA Earth Observatory"],
  ["roebuck-bay/tidal-range","An unusually large tidal range",["Roebuck Bay: up to 9 meters","Many Australian coasts: 2 meters or less","Wide shallow shelf amplifies the tide"],"Source: NASA; not every tide reaches 9 meters"],
  ["roebuck-bay/season-cycle","Roebuck Bay seasonal cycle",["Monsoon: December–March","Peak greenery: around March","Substantial drying: by June"],"Source: NASA Earth Observatory"]
];
const esc=(s)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function derivatives(input,dir,extract){
  await mkdir(join(root,dir),{recursive:true});
  for(const [role,[width,height]] of Object.entries(roles)){
    let pipeline=sharp(input).rotate();
    if(extract) pipeline=pipeline.extract(extract);
    await pipeline.resize(width,height,{fit:"cover",position:"centre"}).webp({quality:role==="compact-mobile"?80:82}).toFile(join(root,dir,`${role}.webp`));
  }
}
function chartSvg(title,lines,foot){
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f3eee5"/><text x="72" y="120" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#171717">${esc(title)}</text><rect x="72" y="180" width="1056" height="14" rx="7" fill="#a43b2d"/>${lines.map((line,index)=>`<text x="88" y="${310+index*145}" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#171717">${esc(line)}</text>`).join("")}<text x="88" y="800" font-family="Arial, sans-serif" font-size="26" fill="#5b554c">${esc(foot)}</text></svg>`);
}
for(const [file,dir,extract] of leads) await derivatives(join(assets,file),dir,extract);
for(const [dir,title,lines,foot] of charts) await derivatives(chartSvg(title,lines,foot),dir);
console.log(JSON.stringify({leads:leads.length,charts:charts.length,roles:Object.keys(roles).length}));
