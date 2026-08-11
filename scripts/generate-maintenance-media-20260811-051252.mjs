import {mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-051252";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["gao-building.jpg","federal-program-effectiveness/gao-building"],
  ["nih-pipetting.jpg","nih-oriva/pipetting"],
  ["smithsonian-castle.jpg","smithsonian-stem/smithsonian-castle"],
  ["dublin-custom-house.jpg","imf-ireland/custom-house"],
  ["raleigh-houses.jpg","housing-vacancy/cameron-village"],
  ["magness-arena.jpg","ncaa-commercial-patches/magness-arena"]
];
const charts=[
  ["federal-program-effectiveness/three-steps","Performance cycle",["1. Define clear goals","2. Collect relevant data","3. Use results"],"Source: U.S. GAO"],
  ["federal-program-effectiveness/evaluations","Evaluation toolkit",["Process evaluation","Outcome evaluation","Impact evaluation"],"Source: U.S. GAO"],
  ["nih-oriva/methods","Human-based methods",["3D tissue models","Computational tools","Other animal-free methods"],"Source: National Institutes of Health"],
  ["nih-oriva/divisions","ORIVA structure",["Research innovation","Evaluation + acceptance","NIH-wide coordination"],"Source: National Institutes of Health"],
  ["smithsonian-stem/reach","Three-year reach",["40 communities","21 states","$2.3 million gift"],"Source: Smithsonian Institution"],
  ["smithsonian-stem/schools","School support",["24 sponsored schools","Professional learning","Virtual support"],"Source: Smithsonian Institution"],
  ["imf-ireland/growth","Domestic demand",["2025: almost 5%","2026-27: about 2.5%","Growth moderates"],"Source: International Monetary Fund"],
  ["imf-ireland/inflation","Inflation outlook",["2026: about 3.5%","Around 2028: 2%","Energy is a key risk"],"Source: International Monetary Fund"],
  ["housing-vacancy/rates","Q2 vacancy rates",["Rental: 7.3%","Homeowner: 1.2%","No confirmed annual shift"],"Source: U.S. Census Bureau"],
  ["housing-vacancy/homeownership","Homeownership",["Q2 2025: 65.0%","Q2 2026: 65.0%","Virtually unchanged"],"Source: U.S. Census Bureau"],
  ["ncaa-commercial-patches/limits","Added logo inventory",["Uniform/apparel: 2","Equipment: 1","No NCAA championships"],"Source: NCAA"],
  ["ncaa-commercial-patches/size","Patch boundaries",["Maximum: 4 sq. in.","Conference title: +1","Effective Aug. 1"],"Source: NCAA"]
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
