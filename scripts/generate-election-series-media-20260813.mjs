import {readFile, mkdir} from "node:fs/promises";
import {join} from "node:path";
import sharp from "sharp";

const sourceRoot=process.argv[2];
if(!sourceRoot) throw new Error("Usage: node generate-election-series-media-20260813.mjs <article-source-root>");
const root="public/media/newsroom/2026/08/election-series-20260813";
const roles={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const files=(await import("node:fs")).readdirSync(sourceRoot).filter(name=>/^\d\d-.*\.md$/.test(name)).sort();
const esc=value=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const clean=value=>value.replace(/^['"]|['"]$/g,"");
const wrap=(value,max=31)=>{const words=value.split(/\s+/),lines=[];let line="";for(const word of words){if(`${line} ${word}`.trim().length>max){lines.push(line);line=word;}else line=`${line} ${word}`.trim();}if(line)lines.push(line);return lines.slice(0,4);};
for(const name of files){
  const text=await readFile(join(sourceRoot,name),"utf8");
  const slug=name.replace(/^\d\d-/,"").replace(/\.md$/,"");
  const title=clean(text.match(/^title:\s*(.+)$/m)?.[1]??slug);
  const dek=clean(text.match(/^dek:\s*(.+)$/m)?.[1]??"");
  const lines=wrap(title);
  const visual=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#f4efe7"/><rect x="0" width="1600" height="44" fill="#1c3150"/><rect x="86" y="100" width="12" height="650" rx="6" fill="#a63d2d"/><text x="140" y="154" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="4" fill="#a63d2d">BOHO NEWS • ELECTION 2026</text>${lines.map((line,index)=>`<text x="140" y="${285+index*84}" font-family="Georgia,serif" font-size="66" font-weight="700" fill="#171717">${esc(line)}</text>`).join("")}<line x1="140" y1="${325+lines.length*84}" x2="1450" y2="${325+lines.length*84}" stroke="#d2c7b8" stroke-width="3"/><text x="140" y="${390+lines.length*84}" font-family="Arial,sans-serif" font-size="30" fill="#4f4a43">${esc(wrap(dek,76)[0]??"")}</text><g transform="translate(1130 600)"><rect width="320" height="160" rx="16" fill="#fff" stroke="#1c3150" stroke-width="6"/><path d="M35 42h250M35 80h170M35 118h220" stroke="#1c3150" stroke-width="12" stroke-linecap="round"/><circle cx="270" cy="112" r="24" fill="#a63d2d"/></g><text x="140" y="820" font-family="Arial,sans-serif" font-size="24" fill="#6b655d">Original Boho News graphic • source details in article</text></svg>`);
  const dir=join(root,slug);await mkdir(dir,{recursive:true});
  for(const [role,[width,height]] of Object.entries(roles)) await sharp(visual).resize(width,height,{fit:"cover"}).webp({quality:84}).toFile(join(dir,`${role}.webp`));
}
console.log(JSON.stringify({articles:files.length,derivatives:files.length*Object.keys(roles).length,root},null,2));
