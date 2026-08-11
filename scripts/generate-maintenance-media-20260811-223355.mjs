import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";
const root="public/media/newsroom/2026/08/manual-20260811-223355", assets=join(root,"assets");
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const leads=[["nrc-public-meeting.jpg","nrc-procedure/public-meeting"],["bank-branch.jpg","cra-thresholds/bank-branch"],["cyber-operations.jpg","nvd-ai/cyber-operations"],["national-mall-scooter.jpg","nps-micromobility/national-mall"],["open-source-workshop.jpg","pesose-open-source/workshop"],["zucchini-packing.jpg","fresh-cut-produce/zucchini-packing"]];
const charts=[
 ["nrc-procedure/changes","Four procedural changes",["Withholding affidavits","Post-publication comments","Advisory committees • security criteria"],"Source: NRC direct final rule, August 11, 2026"],
 ["nrc-procedure/timeline","Direct-final timeline",["Adverse comments due: Sept. 10","Scheduled effective date: Oct. 26","Significant adverse comment → withdrawal"],"Source: NRC; effective date remains conditional"],
 ["cra-thresholds/comparison","Proposed CRA bank categories",["Small: below $1 billion","Intermediate: $1B–$10B","Large: above $10 billion"],"Source: OCC and FDIC proposal"],
 ["cra-thresholds/distribution","Most banks, a small asset share",["Proposed small banks: 79.8%","Supervised banks measured: 3,577","Assets held by small banks: 4.9%"],"Source: OCC/FDIC estimate using 2024–25 data"],
 ["nvd-ai/seven-areas","Seven areas for NVD input",["Management • dissemination • priority","Remediation • data and standards","Development • five-year vision"],"Source: NIST request for information"],
 ["nvd-ai/workflow","How NVD records are enriched",["Automated CVE intake: about 1 hour","Analysts add severity and versions","Tools consume published context"],"Source: NIST; AI changes are not yet selected"],
 ["nps-micromobility/default","Park permission is not automatic",["Default: prohibited","Designation: park superintendent","Surfaces: improved areas only"],"Source: National Park Service final rule"],
 ["nps-micromobility/scope","Powered micromobility scope",["Examples: e-scooters, Segways","Maximum weight: 150 pounds","Separate rules: e-bikes and mobility aids"],"Source: National Park Service"],
 ["pesose-open-source/tracks","Three PESOSE tracks",["Track 1 planning: up to $300,000","Track 2 ecosystems: up to $1.5M","Track 3 security/privacy: up to $1.5M"],"Source: National Science Foundation"],
 ["pesose-open-source/deadlines","PESOSE dates",["Webinar: Aug. 12, 1 p.m. ET","First proposals: Sept. 1","Deadline: 5 p.m. submitter local time"],"Source: NSF solicitation and event page"],
 ["fresh-cut-produce/scope","Which produce the guide covers",["Ready to eat","Fresh cut","Water activity above 0.85"],"Source: FDA final guidance notice"],
 ["fresh-cut-produce/updates","What FDA added",["Antimicrobial control example","More pathogen supply-chain examples","Added time-temperature recommendations"],"Source: FDA; guidance is nonbinding"]
];
const esc=s=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function derivatives(input,dir){await mkdir(join(root,dir),{recursive:true});for(const [role,[width,height]] of Object.entries(roles))await sharp(input).rotate().resize(width,height,{fit:"cover",position:"centre"}).webp({quality:role==="compact-mobile"?80:82}).toFile(join(root,dir,`${role}.webp`));}
function svg(title,lines,foot){return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f3eee5"/><text x="72" y="120" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#171717">${esc(title)}</text><rect x="72" y="180" width="1056" height="14" rx="7" fill="#a43b2d"/>${lines.map((x,i)=>`<text x="88" y="${310+i*145}" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="#171717">${esc(x)}</text>`).join("")}<text x="88" y="800" font-family="Arial,sans-serif" font-size="26" fill="#5b554c">${esc(foot)}</text></svg>`)}
for(const [file,dir] of leads)await derivatives(join(assets,file),dir);
for(const [dir,title,lines,foot] of charts)await derivatives(svg(title,lines,foot),dir);
console.log(JSON.stringify({leads:leads.length,charts:charts.length,derivatives:(leads.length+charts.length)*Object.keys(roles).length}));
