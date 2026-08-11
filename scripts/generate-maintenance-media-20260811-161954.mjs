import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-161954";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["polysilicon-solar-line.jpg","polysilicon/solar-production"],
  ["sba-event.jpg","sba-8a/small-business-event"],
  ["ies-classroom.jpg","ies-grants/classroom"],
  ["gras-grocery-aisle.jpg","gras/grocery-aisle"],
  ["usitc-asus-router.jpg","usitc-wifi/asus-router"],
  ["federal-mileage-highway.jpg","federal-mileage/highway-driving"]
];
const charts=[
  ["polysilicon/price-floors","Minimum import prices",["Polysilicon: $21/kg","Ingots/wafers: $100/kg","Cells: $0.22/W; modules: $0.38/W"],"Source: Proclamation 11052"],
  ["polysilicon/capacity-shares","U.S. capacity shares",["Polysilicon: 50% to below 2%","Years: 2005 to 2024","Wafers: 37% to 10%, 1990–2024"],"Source: Proclamation 11052"],
  ["sba-8a/timeline","8(a) rule timeline",["Published: August 11","Effective: September 10","Pending individual applications covered"],"Source: U.S. SBA final rule"],
  ["sba-8a/scope","Who must re-establish?",["Pending individual applicants: yes","Already certified: no","Specified entity-owned firms: unaffected"],"Source: U.S. SBA final rule"],
  ["ies-grants/award-caps","Maximum IES awards",["Training programs: $800,000","Methods training: $900,000","State data systems: $1.2 million"],"Source: U.S. Education Department"],
  ["ies-grants/programs","Five FY2027 competitions",["Training and mentoring","Replication and methods","State longitudinal data systems"],"Applications due October 1, 2026"],
  ["gras/notice-change","GRAS notice proposal",["Current: voluntary notice","Proposed: mandatory notice","Covered human and animal food uses"],"Source: U.S. FDA"],
  ["gras/record-cost","FDA proposal record",["Human-food notices: over 1,200","Veterinary notices: 75","10-year central cost: $89.6 million"],"Source: U.S. FDA, 2024 dollars"],
  ["usitc-wifi/remedies","Recommended Wi-Fi remedies",["Limited exclusion order","Two cease-and-desist orders","No final commission order yet"],"Source: USITC Inv. 337-TA-1454"],
  ["usitc-wifi/public-interest","Public-interest review",["Competition and substitutes","U.S. capacity and consumers","Comments due September 8"],"Source: U.S. ITC"],
  ["federal-mileage/current-rates","Federal mileage rates",["Private auto: $0.76/mile","Airplane: $1.935/mile","Motorcycle: $0.74/mile"],"Source: GSA FTR Bulletin 26-03"],
  ["federal-mileage/changes","Midyear rate changes",["Private auto: 72.5¢ to 76¢","Gov. auto available: 20.5¢ to 23.5¢","Moving purpose: 20.5¢ to 23.5¢"],"Effective July 1, 2026"]
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
