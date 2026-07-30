import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const binary = join(root, "node_modules/.bin/pagefind");
const started = performance.now();
const result = spawnSync(binary, ["--site", join(root,"dist")], {encoding:"utf8"});
const durationMs = Math.round((performance.now() - started) * 100) / 100;
if (result.status === 0) {
  console.log(`Pagefind index completed in ${durationMs} ms.`);
  process.exit(0);
}

// Pagefind's native ARM64 binary is incompatible with Bohopi's 16 KiB kernel
// page size. Keep the site search functional and deterministic on that builder;
// supported x64 release lanes still run Pagefind above.
const includeFixtures = process.env.BOHONEWS_INCLUDE_FIXTURES === "1";
const benchmark = process.env.BOHONEWS_BENCHMARK_1000 === "1";
const promotion = JSON.parse(await readFile(join(root,"src/publishing/public-news-promotion-package.v2.1.1.json"),"utf8"));
let records = promotion.articles;
if (benchmark) {
  records = Array.from({length:1000},(_,index) => {
    const suffix = String(index + 1).padStart(4,"0");
    return {headline:`Synthetic benchmark article ${suffix}`,dek:"Non-production scale fixture.",slug:`benchmark-${suffix}`,section:"politics",articleType:"news-report",publishedAt:"2026-07-25T10:30:00Z"};
  });
} else if (includeFixtures) {
  records = [
    {headline:"Fixture developing report",dek:"Non-production developing story presentation.",slug:"fixture-developing",section:"politics",articleType:"developing-story",publishedAt:"2026-07-25T10:30:00Z"},
    {headline:"Fixture correction presentation",dek:"Non-production correction presentation.",slug:"fixture-correction",section:"congress",articleType:"news-report",publishedAt:"2026-07-25T10:30:00Z"},
    {headline:"Fixture retraction presentation",dek:"Non-production retraction presentation.",slug:"fixture-retraction",section:"politics",articleType:"news-report",publishedAt:"2026-07-25T10:30:00Z"}
  ];
}
const index = records.map(({headline,dek,slug,section,articleType,publishedAt}) => ({
  title:headline,
  excerpt:dek,
  url:`/articles/${slug}/`,
  section,
  articleType,
  year:publishedAt?.slice(0,4) ?? null
}));
const pagefindDir = join(root,"dist/pagefind");
await mkdir(pagefindDir,{recursive:true});
await writeFile(join(root,"dist/search-index.json"),`${JSON.stringify(index)}\n`);
await writeFile(join(pagefindDir,"pagefind-ui.css"),".pagefind-ui__form{display:grid;gap:1rem}.pagefind-ui__search-input{font:inherit;padding:.8rem}.pagefind-ui__result{border-top:1px solid #c8c7c1;padding:1rem 0}\n");
await writeFile(join(pagefindDir,"pagefind-ui.js"),`window.PagefindUI=class PagefindUI{constructor({element}){const root=document.querySelector(element),form=document.createElement('form'),label=document.createElement('label'),input=document.createElement('input'),out=document.createElement('div');form.className='pagefind-ui__form';form.setAttribute('role','search');label.htmlFor='local-search';label.textContent='Search approved articles';input.id='local-search';input.className='pagefind-ui__search-input';input.type='search';out.className='pagefind-ui__results';form.append(label,input,out);root.replaceChildren(form);fetch('/search-index.json').then(r=>r.json()).then(rows=>{input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase(),matches=q?rows.filter(x=>(x.title+' '+x.excerpt+' '+x.section+' '+x.articleType).toLowerCase().includes(q)):[];out.replaceChildren(...matches.map(x=>{const article=document.createElement('article'),heading=document.createElement('h2'),link=document.createElement('a'),excerpt=document.createElement('p');article.className='pagefind-ui__result';link.href=x.url;link.textContent=x.title;excerpt.textContent=x.excerpt;heading.append(link);article.append(heading,excerpt);return article;}));});});}}\n`);
console.warn(`Pagefind native index unavailable (${result.status}); deterministic local fallback generated in ${durationMs} ms.`);
