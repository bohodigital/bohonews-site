import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-132424";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["hybrid-saab.jpg","hybrid-saab/farnborough"],
  ["sweet15-wing.jpg","sweet15/mock-test"],
  ["sec-edelivery.jpg","sec-edelivery/nyse"],
  ["italy-rome.jpg","italy-outlook/rome"],
  ["education-lbj.jpg","titlevi-rules/lbj-building"],
  ["kala-azar-sandfly.jpg","kala-azar/sandfly"]
];
const charts=[
  ["hybrid-saab/system","Hybrid propulsion system",["Electric motors","Gas turbine","Energy storage"],"Source: NASA"],
  ["hybrid-saab/milestones","Hybrid flight milestones",["Flight: above 30,000 ft","Lab simulation: 45,000 ft","More than 15 years of work"],"Source: NASA"],
  ["sweet15/load-result","SWEET-15 load result",["Expected flight loads: passed","Models matched sensors","Failure: about 127%"],"Source: NASA"],
  ["sweet15/test-article","SWEET-15 test article",["15-foot structure","Composite construction","Fiber-optic strain sensors"],"Source: NASA"],
  ["sec-edelivery/default","Proposed delivery default",["Today: paper default","Proposal: electronic default","Paper remains on request"],"Source: U.S. SEC"],
  ["sec-edelivery/documents","Documents in proposed scope",["Prospectuses and reports","Proxy statements","Trade confirmations"],"Source: U.S. SEC"],
  ["italy-outlook/growth","Italy economic outlook",["2026 growth: 0.5%","2027 growth: 0.5%","2026 inflation: 2.9%"],"Source: International Monetary Fund"],
  ["italy-outlook/constraints","Italy's medium-term constraints",["High public debt","Rapid population aging","Persistently weak productivity"],"Source: International Monetary Fund"],
  ["titlevi-rules/change","Title VI enforcement change",["Disparate-impact provisions removed","Intentional discrimination remains","Complaint process continues"],"Source: U.S. Department of Education"],
  ["titlevi-rules/scope","Title VI protected classes",["Race","Color","National origin"],"Source: U.S. Department of Education"],
  ["kala-azar/treatment","East Africa regimen change",["New course: 14 days","One daily injection","Prior course: 17 days, two injections"],"Source: World Health Organization"],
  ["kala-azar/burden","Kala-azar global burden",["50,000–90,000 cases yearly","80 endemic countries","Only 25%–45% reported"],"Source: World Health Organization"]
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
