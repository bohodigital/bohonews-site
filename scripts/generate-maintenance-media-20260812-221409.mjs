import {readFile} from "node:fs/promises";
import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const root="public/media/newsroom/2026/08/manual-20260812-221409";
const assets=join(root,"assets");
const definitions=JSON.parse(await readFile("scripts/maintenance-batch-20260812-221409.json","utf8"));
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const esc=(value)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const wrap=(value,max=34)=>{const words=value.split(/\s+/);const lines=[];let line="";for(const word of words){if(`${line} ${word}`.trim().length>max){lines.push(line);line=word;}else line=`${line} ${word}`.trim();}if(line)lines.push(line);return lines.slice(0,5);};
async function derivatives(input,dir){await mkdir(join(root,dir),{recursive:true});for(const [role,[width,height]] of Object.entries(roles))await sharp(input).rotate().resize(width,height,{fit:"cover",position:"centre"}).webp({quality:role==="compact-mobile"?80:82}).toFile(join(root,dir,`${role}.webp`));}
function graphic(caption,source){const lines=wrap(caption);return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#f3eee5"/><rect x="72" y="72" width="14" height="690" rx="7" fill="#a43b2d"/><text x="122" y="150" font-family="Arial,sans-serif" font-size="29" font-weight="700" letter-spacing="2" fill="#a43b2d">BOHO NEWS • PRIMARY RECORD</text>${lines.map((line,index)=>`<text x="122" y="${270+index*96}" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="#171717">${esc(line)}</text>`).join("")}<text x="122" y="810" font-family="Arial,sans-serif" font-size="25" fill="#5b554c">${esc(source)}</text></svg>`);}
for(const definition of definitions){await derivatives(join(assets,definition.lead.original),definition.lead.dir);for(const chart of definition.charts)await derivatives(graphic(chart.caption,definition.sources[0].publisher),chart.dir);}
console.log(JSON.stringify({leads:definitions.length,charts:definitions.flatMap(({charts})=>charts).length,derivatives:definitions.length*3*Object.keys(roles).length}));
