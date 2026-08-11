import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260811-174624";
const assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[
  ["cms-rapid-fda-device-lab.jpg","cms-rapid/device-lab"],
  ["unalaska-sea-otter.jpg","unalaska-otters/alaska-sea-otter"],
  ["usitc-disassembled-lcd.jpg","usitc-lcd/disassembled-display"],
  ["nh-emissions-nara-test.jpg","nh-emissions/emissions-test"],
  ["patent-bar-biomedical-lab.jpg","patent-bar/biomedical-lab"],
  ["nrc-public-meeting.jpg","nrc-rule/commission-meeting"]
];
const charts=[
  ["cms-rapid/eligibility","Proposed RAPID eligibility",["Selected Class II breakthrough devices","Class III breakthrough devices","Medicare-population evidence required"],"Source: CMS proposed notice"],
  ["cms-rapid/timeline","Proposed coverage goals",["FDA authorization: proposed NCD","Class II final goal: 60 days","Class III final goal: 90 days"],"Source: CMS; goals are not guarantees"],
  ["unalaska-otters/pile-work","Robert Storrs Harbor pile work",["Remove: 33 steel piles","Temporary: 5 piles","Permanent: 44 piles; up to 100 days"],"Source: U.S. Fish and Wildlife Service"],
  ["unalaska-otters/estimates","Modeled sea-otter exposure",["Level A events: 32","Level B events: 273","Individuals potentially affected: up to 112"],"Source: proposed authorization; not deaths"],
  ["usitc-lcd/respondents","Four remaining respondent groups",["Caihong","CSOT and CHOT","TCL"],"Source: USITC final notice"],
  ["usitc-lcd/remedies","Final LCD glass remedies",["Limited exclusion order","TCL cease-and-desist order","Presidential-review bond: 0%"],"Source: USITC"],
  ["nh-emissions/modeling","Modeled 2022-to-2026 change",["Nitrogen oxides: −16.0%","VOCs: −2.7%","Carbon monoxide: −1.9%"],"Source: EPA proposal; projected, not observed"],
  ["nh-emissions/conditions","Conditional approval path",["Ozone Transport Region removal","Final conditional EPA approval","Follow-up SIP due within one year"],"Source: EPA proposed action"],
  ["patent-bar/routes","Technical-training routes",["Category A: listed degrees","Category B: coursework","Categories C and D: other evidence"],"Source: USPTO General Requirements Bulletin"],
  ["patent-bar/update","Biomedical Science update",["Previous route: Category B","New route: Category A","Effective: August 11, 2026"],"Source: USPTO"],
  ["nrc-rule/change-areas","Four NRC procedure updates",["Withholding affidavits","Post-promulgation comments","Advisory committees and security eligibility"],"Source: NRC direct final rule"],
  ["nrc-rule/timeline","Direct final rule timeline",["Adverse comments due: September 10","Scheduled effective date: October 26","Significant comments can trigger withdrawal"],"Source: NRC"]
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
