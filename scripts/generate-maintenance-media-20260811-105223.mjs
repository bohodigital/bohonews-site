import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-105223";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["supervised-release.jpg","supervised-release/courthouse"],
  ["strategic-reviews.jpg","strategic-reviews/eeob"],
  ["social-security.jpg","social-security/cohen-building"],
  ["sequoia-burns.png","sequoia-burns/prescribed-fire"],
  ["laser-alloys.jpg","laser-alloys/advanced-photon-source"],
  ["public-pensions.jpg","public-pensions/calpers-headquarters"]
];
const charts=[
  ["supervised-release/imposition","Federal prison sentences in FY2025",["61,557 included prison","50,688 included supervision","Imposition rate: 82%"],"Source: U.S. Sentencing Commission"],
  ["supervised-release/closures","53,087 supervision cases closed",["66% without revocation","34% with revocation","23% technical violation"],"Source: U.S. Courts / USSC"],
  ["strategic-reviews/implementation","Strategic-review implementation",["4 selected agencies","0 fully implemented requirements","4 leadership/stakeholder gaps"],"Source: U.S. GAO"],
  ["strategic-reviews/agencies","Agency process documentation",["DHS and Treasury: most requirements","State and GSA: no documents","State review in 2026 unconfirmed"],"Source: U.S. GAO"],
  ["social-security/financing","OASI financing reference points",["75-year gap: $30.3T","Top 1% wealth: $55T","Trust fund exhaustion: FY2032"],"Sources: CBO, SSA trustees, Federal Reserve"],
  ["social-security/effects","CBO's tax-design cautions",["Assets are hard to value","Behavior reduces collections","Gap widens after 75 years"],"Source: Congressional Budget Office"],
  ["sequoia-burns/study","Giant-sequoia study scale",["26,403 trees","19 groves","2020 and 2021 fires"],"Source: NASA / Nature Communications"],
  ["sequoia-burns/outcomes","Prescribed-fire findings",["Nearly 4x survival likelihood","About 1,800 trees saved","19% of mature range lost"],"Source: NASA-funded study"],
  ["laser-alloys/process","Laser stirring in metal printing",["Looping scan path","No major new printer parts","Solidifies in under 1 second"],"Source: NIST"],
  ["laser-alloys/measurement","How the team verified mixing",["RHEA-19 plus titanium alloy","Synchrotron X-ray diffraction","Electron microscopy"],"Source: NIST / Additive Manufacturing"],
  ["public-pensions/assets","State and local pension assets",["2024: $5.98T","2025: $6.49T","Increase: 8.46%"],"Source: U.S. Census Bureau"],
  ["public-pensions/flows","Public pension money in 2025",["Contributions: $315.02B","Benefits: $418.25B","Participants: 37M+"],"Source: U.S. Census Bureau"]
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
