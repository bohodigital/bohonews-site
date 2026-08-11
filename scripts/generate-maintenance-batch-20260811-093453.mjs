import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-093453";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["womens-lacrosse.jpg","womens-lacrosse/game-action"],
  ["tregzi-laboratory.jpg","tregzi/nci-laboratory"],
  ["recording-registry.jpg","recording-registry/packard-campus"],
  ["cambodia-outlook.jpg","cambodia-outlook/phnom-penh"],
  ["retirement-consent.jpg","retirement-consent/couple"],
  ["pentagon-audit.jpg","pentagon-audit/pentagon"]
];
const charts=[
  ["womens-lacrosse/penalties","Proposed penalty structure",["Yellow cards: 2 minutes","All are non-releasable","Targeting: red card"],"Source: NCAA"],
  ["womens-lacrosse/experiments","Fall experiments",["60-second possession clock","11-player lineups","Backcourt-style rule"],"Source: NCAA"],
  ["tregzi/survival","One-year GVHD-free survival",["Tregzi: 78%","Standard transplant: 38.4%","Randomized trial: 187 adults"],"Source: U.S. FDA"],
  ["tregzi/serious-gvhd","Serious chronic GVHD",["Tregzi: 12.6%","Standard transplant: 44%","Within one year"],"Source: U.S. FDA"],
  ["recording-registry/class","2026 registry class",["25 recordings","70-year span","3,000+ nominations"],"Source: Library of Congress"],
  ["recording-registry/total","Preservation scale",["700 registry entries","4 million collected recordings","Registry: about 0.01%"],"Source: Library of Congress"],
  ["cambodia-outlook/growth","Cambodia real GDP growth",["2024: 6.0%","2025: 5.3%","2026 forecast: 3.0%"],"Source: IMF staff"],
  ["cambodia-outlook/inflation","2026 outlook",["Inflation: 5.6%","Reserves: about 8 months","Risks tilted downward"],"Source: IMF staff"],
  ["retirement-consent/removal","Married households in 2021",["About 1 in 10 removed funds","Typically less than 10%","Knowledge not measured"],"Source: U.S. GAO"],
  ["retirement-consent/coverage","Plans with removal consent",["Money-purchase plans","Target-benefit plans","Together: less than 1%"],"Source: U.S. GAO"],
  ["pentagon-audit/strategy","DOD audit strategy shift",["Centralized coordination","Material line-item focus","Large-sample testing"],"Source: U.S. GAO"],
  ["pentagon-audit/scale","Defense financial scale",["Spending: more than $1T","Federal physical assets: 82%","Clean-opinion goal: 2028"],"Source: U.S. GAO"]
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
