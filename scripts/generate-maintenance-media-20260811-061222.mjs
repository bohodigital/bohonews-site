import {mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-061222";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["gao-fdta-eccles.jpg","gao-fdta/eccles-building"],
  ["ussc-prettyman-courthouse.jpg","ussc-identity-theft/prettyman-courthouse"],
  ["cbo-capitol.jpg","cbo-july-deficit/capitol"],
  ["noaa-lake-erie-flight.jpg","noaa-ice-flights/lake-erie"],
  ["nist-resin-form2.jpg","nist-resin-printing/form2"],
  ["census-charlotte-aerial.jpg","census-south-growth/charlotte"]
];
const charts=[
  ["gao-fdta/sequence","Implementation sequence",["Joint data standards","Agency implementation rules","Standardized reporting"],"Source: U.S. GAO"],
  ["gao-fdta/tradeoffs","Standards tradeoffs",["Interoperable analysis","Legacy-system upgrades","Coordination + testing"],"Source: U.S. GAO"],
  ["ussc-identity-theft/caseload","FY2025 caseload",["561 section 1028A cases","8% below FY2021","66,662 total cases"],"Source: U.S. Sentencing Commission"],
  ["ussc-identity-theft/sentences","Sentence measures",["FY2021 average: 46 months","FY2025 average: 54 months","99% received prison"],"Source: U.S. Sentencing Commission"],
  ["cbo-july-deficit/deficit","Ten-month deficit",["FY2026: $1.8 trillion","Year-over-year: +$169 billion","Through July"],"Source: Congressional Budget Office"],
  ["cbo-july-deficit/flows","Budget flows",["Revenue: +3%","Outlays: +5%","Spending grew faster"],"Source: Congressional Budget Office"],
  ["noaa-ice-flights/bands","Hyperspectral view",["Visible image: 3 bands","Research camera: 150+ bands","Unique spectral fingerprints"],"Source: NOAA GLERL"],
  ["noaa-ice-flights/stack","Observation stack",["Periodic satellite images","Numerical ice models","Aircraft + drone detail"],"Source: NOAA GLERL"],
  ["nist-resin-printing/working-curve","Resin working curve",["Radiant light exposure","Measured cure depth","Controlled layer bonding"],"Source: NIST"],
  ["nist-resin-printing/wavelengths","Interlaboratory test",["Calibrated light sources","385 nm + 405 nm","Shared RM 8047 resin"],"Source: NIST"],
  ["census-south-growth/regions","Population growth",["South: +6.0%","United States: +3.1%","April 2020 to July 2025"],"Source: U.S. Census Bureau"],
  ["census-south-growth/ages","Southern age growth",["Under 18: +1.1%","Ages 25-44: +9.0%","Age 65+: +17.5%"],"Source: U.S. Census Bureau"]
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
