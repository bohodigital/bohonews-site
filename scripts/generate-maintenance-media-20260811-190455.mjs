import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-190455";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["fda-dbt-demonstration.jpg","fda-dbt/demonstration"],
  ["sec-overnight-nyse-floor.tif","sec-overnight/nyse-floor"],
  ["fmcsa-truck-inspection.jpg","fmcsa-elp/truck-inspection"],
  ["faa-military-student-pilot.jpg","faa-military-trainees/student-pilot"],
  ["nga-mining-russell-lee-miner.jpg","nga-mining-film/russell-lee-miner"],
  ["epa-dichlorobenzene-air-sampling.jpg","epa-dichlorobenzene/air-sampling"]
];
const charts=[
  ["fda-dbt/proposed-path","Proposed DBT regulatory path",["Current: Class III premarket approval","Proposed: Class II special controls","Still required: 510(k) clearance"],"Source: FDA proposed rule"],
  ["fda-dbt/safety-record","FDA record reviewed through July 21",["Class II recalls: 5","Class I and III recalls: 0","Medical-device reports reviewed: 968"],"Source: FDA; reports do not establish causation"],
  ["sec-overnight/band-formula","Temporary overnight price bands",["Most securities: ±20%","Leveraged ETPs: 20% × leverage","Sub-$1 securities: $1 minimum thresholds"],"Source: SEC order"],
  ["sec-overnight/phase-one","Overnight pilot sequence",["Expected start: December 6","Quarterly operational reports","Later phase-two proposal"],"Source: SEC; start depends on system readiness"],
  ["fmcsa-elp/assessment","Proposed roadside assessment",["1. Initial English contact","2. Driver interview","3. Highway-sign recognition if passed"],"Source: FMCSA proposed rule"],
  ["fmcsa-elp/commercial-zone","Scope and estimated cost",["Commercial-zone trip: cite, no OOS","Trip outside zone: OOS applies","Estimated annual carrier cost: $14.4M"],"Source: FMCSA"],
  ["faa-military-trainees/eligibility","Proposed military trainee exception",["Current military medical exam","Flight-status authorization","Specified sponsored civilian-aircraft training"],"Source: FAA proposed rule"],
  ["faa-military-trainees/estimates","FAA annual estimates",["Affected population: about 2,000","Potentially newly covered: 450","Estimated savings: $946,000"],"Source: FAA; estimates, not outcomes"],
  ["nga-mining-film/weekend-schedule","Final mining-film weekend",["Aug. 15: Harlan County, USA","Aug. 16: The Miners' Hymns","Aug. 16: Louisiana Story"],"Source: National Gallery of Art"],
  ["nga-mining-film/series-context","Unearthed: Mining on Film",["Free screenings","Advance registration required","East Building Large Auditorium"],"Source: National Gallery; schedule may change"],
  ["epa-dichlorobenzene/use-groups","Uses evaluated by EPA",["Cleaning and air care","Lubricants and solvents","Thermoplastics and selected building products"],"Source: EPA draft; not every product contains these chemicals"],
  ["epa-dichlorobenzene/review-path","TSCA review sequence",["Draft risk evaluations","Public comment through October 9","Final evaluation; possible later management"],"Source: EPA; no final restriction yet"]
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
