import {mkdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-082653";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["critical-isotopes.jpg","critical-isotopes/einsteinium-production"],
  ["sentenced-organizations.jpg","escape-offenses/courthouse"],
  ["treasury-priorities.jpg","treasury-priorities/treasury-building"],
  ["wildlife-resilience.jpg","wildlife-resilience/prairie-pond"],
  ["water-remote-access.jpg","water-remote-access/deer-island"],
  ["traffic-deaths.jpg","traffic-deaths/interstate-80"]
];
const charts=[
  ["critical-isotopes/output","Isotope program output",["265 isotopes","7,700+ shipments","Fiscal 2020-2025"],"Source: U.S. GAO"],
  ["critical-isotopes/disruptions","Market disruptions",["2023: 40 isotopes","2025: 25 isotopes","Most still rely on sensitive countries"],"Source: U.S. GAO"],
  ["escape-offenses/custody","Escape custody context",["Non-secure community custody: 63%","Voluntary return in 96 hours: 7%","Force or threat: 2%"],"Source: U.S. Sentencing Commission"],
  ["escape-offenses/sentences","Escape sentences",["Average: 13 months","Prison: 99%","Within guideline range: 72%"],"Source: U.S. Sentencing Commission"],
  ["treasury-priorities/counts","Treasury priorities",["August 2025: 32","Implemented: 4","June 2026 open: 28"],"Source: U.S. GAO"],
  ["treasury-priorities/areas","Three priority areas",["Improper payments","Cybersecurity + privacy","Financial management"],"Source: U.S. GAO"],
  ["wildlife-resilience/funding","Resilience funding",["Appropriation: $125M","Obligated: 99.6%","Spent: $48.9M"],"Source: U.S. GAO"],
  ["wildlife-resilience/restoration","Project reach",["9 projects across 23 states","75+ refuge units","21,000+ acres restored"],"Source: U.S. GAO"],
  ["water-remote-access/designs","Remote-access guide",["3 reference designs","Commercial technologies","Lab demonstrated"],"Source: NIST SP 1800-45"],
  ["water-remote-access/controls","Control layers",["Authentication","Access control + monitoring","Risk management"],"Source: NIST SP 1800-45"],
  ["traffic-deaths/rate","First-quarter estimate",["7,770 traffic deaths","Rate: 0.99 per 100M miles","Second-lowest Q1 rate"],"Source: NHTSA"],
  ["traffic-deaths/change","Year-over-year change",["Estimated deaths: -4.3%","Travel: +11B miles","30 states + Puerto Rico down"],"Source: NHTSA"]
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
