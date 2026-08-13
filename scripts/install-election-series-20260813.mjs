import {createHash} from "node:crypto";
import {readFileSync,readdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const sourceRoot=process.argv[2];
if(!sourceRoot) throw new Error("Usage: node install-election-series-20260813.mjs <article-source-root>");
const root=process.cwd(),promotionPath=join(root,"src/publishing/public-news-promotion-package.v2.1.1.json"),releasePath=join(root,"public-news-release.v2.1.1.json"),mediaRoot="/media/newsroom/2026/08/election-series-20260813";
const digest=value=>createHash("sha256").update(typeof value==="string"||Buffer.isBuffer(value)?value:stableJson(value)).digest("hex"),fileHash=path=>digest(readFileSync(join(root,"public",path.slice(1))));
const dims={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]},roles=Object.keys(dims),retrievedAt=new Date().toISOString();
const files=readdirSync(sourceRoot).filter(name=>/^\d\d-.*\.md$/.test(name)).sort();
if(files.length!==10) throw new Error(`Expected ten article sources, found ${files.length}`);
const strip=value=>value.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*_`]/g,"").trim();
const citationDates=new Map([
  ["https://apnews.com/article/0618c650d24c17a2a8f2d3273d813808","2026-08-12T15:32:57Z"],
  ["https://apnews.com/article/226b31e324cdd9b72200fb9abc9acb69","2026-08-11T04:05:35Z"],
  ["https://apnews.com/article/44408088e8b55ba6a6224713782bbf90","2026-08-11T04:07:15Z"],
  ["https://apnews.com/article/03a658b1a45593ad04ebf6283a3fdb47","2026-05-19T04:01:16Z"],
  ["https://apnews.com/article/4fa609e7ddb93b47ac4e3398a12a472e","2026-05-26T04:02:12Z"],
  ["https://apnews.com/article/304d74d4042e7ad43b00c4d125b08c8e","2026-05-29T22:56:29Z"],
  ["https://apnews.com/article/8eb9f54741ce0313ab15b291bd742c16","2026-05-19T04:13:14Z"],
  ["https://apnews.com/article/b23fe75b1fb54f5c0c27379ed0693319","2026-08-12T15:10:33Z"],
  ["https://apnews.com/article/fa563af2a410965335456ea76e103ad3","2026-08-03T12:32:53Z"],
  ["https://apnews.com/article/bbadfd4d2a4a1184be74f75ed26b9b72","2026-08-11T04:01:04Z"],
  ["https://apnews.com/article/b97eeb496692027b802116f353112029","2026-08-10T12:39:41Z"],
  ["https://apnews.com/article/ca0863958befa2571dff1827f9109999","2026-08-11T13:38:12Z"],
  ["https://apnews.com/article/4c3280bbca4e98ba9530211735c95650","2026-03-04T22:49:05Z"],
  ["https://apnews.com/article/78d9cc60faff70ffe27fd8d7f6dc1355","2026-06-23T04:02:40Z"],
  ["https://www.fec.gov/resources/cms-content/documents/2026pdates.pdf","2026-05-18T14:20:31Z"],
  ["https://www.fec.gov/updates/reporting-deadlines-change-as-states-reschedule-elections/","2026-05-21T12:00:00Z"],
  ["https://www.elections.alaska.gov/","2026-08-10T22:53:23Z"],
  ["https://dos.fl.gov/elections/for-voters/","2026-08-13T06:27:02Z"],
  ["https://dos.fl.gov/elections/for-voters/election-dates/","2026-08-13T06:27:02Z"],
  ["https://sos.wyo.gov/Elections/","2026-08-13T06:27:01Z"],
  ["https://sos.wyo.gov/Elections/Docs/2026/2026_Key_Election_Dates.pdf","2026-02-20T18:46:18Z"]
]);
const citationPublisher=url=>{const host=new URL(url).hostname.replace(/^www\./,"");if(host==="apnews.com")return "Associated Press";if(host==="fec.gov")return "Federal Election Commission";if(host==="elections.alaska.gov")return "Alaska Division of Elections";if(host==="dos.fl.gov")return "Florida Division of Elections";if(host==="sos.wyo.gov")return "Wyoming Secretary of State";return host;};
function parse(name){
  const raw=readFileSync(join(sourceRoot,name),"utf8"),parts=raw.split("---"),front=parts[1],content=parts.slice(2).join("---"),get=key=>(front.match(new RegExp(`^${key}:\\s*[\"']?(.*?)[\"']?$`,"m"))?.[1]??"").trim();
  const slug=name.replace(/^\d\d-/,"").replace(/\.md$/,"");
  const citations=[];let inSources=false;const blocks=[],lines=content.split(/\r?\n/);let paragraph=[],list=[];
  const flushParagraph=()=>{if(paragraph.length){blocks.push({type:"paragraph",text:strip(paragraph.join(" "))});paragraph=[];}};
  const flushList=()=>{if(list.length){blocks.push({type:"unordered-list",items:list.map(strip)});list=[];}};
  for(const line of lines){
    if(/^### Sources\s*$/.test(line)){flushParagraph();flushList();inSources=true;continue;}
    if(inSources){const match=line.match(/^- \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);if(match){const publishedAt=citationDates.get(match[2]);if(!publishedAt)throw new Error(`Missing verified citation date for ${match[2]}`);citations.push({id:`source-${slug}-${citations.length+1}`,title:match[1],publisher:citationPublisher(match[2]),publishedAt,url:match[2]});}continue;}
    if(/^# /.test(line)||/^\*.*\*$/.test(line)||/^!\[/.test(line)||/^By BohoNews Staff/.test(line)||/^August 13, 2026/.test(line)||/^\*Illustration:/.test(line)) continue;
    if(/^#{2,3} /.test(line)){flushParagraph();flushList();blocks.push({type:"subheading",level:line.startsWith("## ")?2:3,text:strip(line.replace(/^#{2,3}\s+/,""))});continue;}
    if(/^- /.test(line)){flushParagraph();list.push(line.slice(2));continue;}
    if(/^\d+\. /.test(line)){flushParagraph();list.push(line.replace(/^\d+\. /,""));continue;}
    if(!line.trim()){flushParagraph();flushList();continue;}
    if(/^\*.*\*$/.test(line)) continue;
    paragraph.push(line.trim());
  }
  flushParagraph();flushList();
  if(!citations.length){
    for(const match of raw.matchAll(/^- \[([^\]]+)\]\((https?:\/\/[^)]+)\)/gm)){
      const publishedAt=citationDates.get(match[2]);
      if(!publishedAt)throw new Error(`Missing verified citation date for ${match[2]}`);
      citations.push({id:`source-${slug}-${citations.length+1}`,title:match[1],publisher:citationPublisher(match[2]),publishedAt,url:match[2]});
    }
  }
  if(!citations.length)throw new Error(`Article ${slug} has no citations`);
  const sourceIndex=blocks.findIndex(block=>block.type==="subheading"&&block.text==="Sources");if(sourceIndex>=0)blocks.splice(sourceIndex);
  const body=blocks.map(block=>block.type==="paragraph"?block.text:block.type==="subheading"?block.text:block.items.join("\n")).join("\n\n");
  return {slug,title:get("title"),dek:get("dek"),blocks,body,citations};
}
const parsed=files.map(parse),promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
if(promotion.releaseState!=="final") throw new Error(`Append baseline must be final, found ${promotion.releaseState}`);
const existing=new Set(promotion.articles.map(article=>article.slug));for(const item of parsed)if(existing.has(item.slug))throw new Error(`Duplicate slug ${item.slug}`);
const themes=[
  ["elections",["Primary elections","2026 midterms","Election calendar"],["United States"],["Federal Election Commission","Associated Press"],"The nationwide field is mostly set, while late primaries and runoffs remain."],
  ["elections",["Voter guide","Alaska elections","Florida elections","Wyoming elections"],["Alaska","Florida","Wyoming"],["Alaska Division of Elections","Florida Division of Elections","Wyoming Secretary of State"],"Voting rules and deadlines differ among the three August 18 primary states."],
  ["elections",["Democratic Party","Generational change","Primary elections"],["Michigan","Minnesota","Wisconsin","Connecticut"],["Democratic Party","Associated Press"],"Democratic voters selected change in several races without choosing one uniform ideology."],
  ["elections",["Donald Trump","Republican Party","Political endorsements"],["United States"],["Donald Trump","Republican Party"],"Trump-backed challengers defeated major critics, while some gubernatorial endorsements failed."],
  ["elections",["Runoff elections","Primary rules","Voter participation"],["Texas","South Carolina","Oklahoma"],["Federal Election Commission"],"Runoffs create a separate election when the first round does not satisfy state nomination rules."],
  ["elections",["U.S. Senate","2026 midterms","Open seats"],["United States","Michigan","Minnesota","South Carolina"],["United States Senate","Federal Election Commission"],"Most Senate nominees are selected, while several late contests remain."],
  ["elections",["Governors","State government","2026 midterms"],["Wisconsin","Minnesota","Connecticut"],["State governments"],"Governor races determine control over budgets, vetoes, appointments and administration."],
  ["elections",["U.S. House","Congressional primaries","Incumbents"],["United States"],["United States House of Representatives"],"Ten House incumbents had lost primaries through August 11, for different local reasons."],
  ["elections",["Close elections","Election certification","Ranked-choice voting"],["Wisconsin","Michigan"],["Associated Press","State election officials"],"Narrow-result comparisons require compatible rules, complete counts and a valid denominator."],
  ["elections",["Election data","Election administration","Public records"],["United States"],["Federal Election Commission","State election officials","Associated Press"],"The United States has many official result publishers but no single official national feed."]
];
const articles=parsed.map((item,index)=>{const [desk,topics,locations,entities,fact]=themes[index],src=`${mediaRoot}/${item.slug}`;return {articleType:index===2||index===3?"analysis":"news-report",authors:["Boho News Staff"],body:item.body,bodyBlocks:item.blocks,canonicalUrl:`https://bohonews.com/articles/${item.slug}/`,citations:item.citations,confirmedFactsSummary:[fact],corrections:[],dek:item.dek,desk,distribution:{newsSitemap:true,rss:true},editor:"Boho News Editorial Desk",entities,eventId:`event-${item.slug}`,headline:item.title,id:`article-${item.slug}`,leadImage:{alt:`Boho News election graphic for ${item.title}`,caption:`Boho News election coverage graphic for “${item.title}.” Source details appear in the article.`,credit:"Boho News original graphic",height:900,rightsId:`media-${item.slug}-lead`,role:"lead",src:`${src}/lead.webp`,width:1600},locations,media:[],publicChangeLog:[],publicationStatus:"approved",publishedAt:null,relatedArticleIds:parsed.filter(other=>other.slug!==item.slug).slice(0,3).map(other=>`article-${other.slug}`),releaseId:null,retractionState:"current",schemaVersion:"2.0.0",search:{description:item.dek,index:true,title:item.title},section:"politics",slug:item.slug,social:{description:item.dek,image:`${src}/open-graph.webp`,title:item.title},supersededByArticleId:null,supersedesArticleId:null,topics,uncertainty:["Primary results, remaining election dates and certification status can change after this article's source cutoff.","Associated Press race calls and official certification are distinct."],updatedAt:null};});
const rights=parsed.map(item=>{const src=`${mediaRoot}/${item.slug}`;return {aiGenerated:false,altText:`Boho News election graphic for ${item.title}`,archivalStatus:"current",attribution:"Boho News original graphic",caption:`Boho News election coverage graphic for “${item.title}.”`,contextNotes:{misleading:false,usage:"Original headline graphic derived from the article's cited election records; not a photograph or simulation of an actual event."},creator:"Boho News",derivatives:roles.map(role=>({hash:fileHash(`${src}/${role}.webp`),height:dims[role][1],publicPath:`${src}/${role}.webp`,role,width:dims[role][0]})),id:`media-${item.slug}-lead`,illustrationLabel:null,license:"Boho News original graphic",originalFileHash:fileHash(`${src}/lead.webp`),restrictions:["Use with the associated election article.","Do not describe as a photograph or depiction of an actual ballot."],retrievedAt,rightsBasis:"Original deterministic newsroom graphic created from editor-approved article metadata and cited public election records.",schemaVersion:"1.1.0",sourceUrl:item.citations[0]?.url??"https://www.fec.gov/resources/cms-content/documents/2026pdates.pdf"};});
promotion.articles.push(...articles);promotion.mediaRights.push(...rights);promotion.compilerVersion="bohonews-manual-election-installer.v1.0.0";promotion.generatedAt=new Date().toISOString();promotion.releaseState="candidate";promotion.inventory={articleCount:promotion.articles.length,routeCount:promotion.articles.length,mediaCount:promotion.mediaRights.length};promotion.inputHashes={sourceItems:digest(parsed.map(item=>item.citations)),events:digest(parsed.map(item=>`event-${item.slug}`)),claims:digest(articles.map(item=>item.confirmedFactsSummary)),articles:digest(articles),approvals:digest({mode:"owner-authorized-manual-election-publication",date:"2026-08-13"}),corrections:digest([]),mediaRights:digest(rights),releaseRecords:digest(promotion.releaseRecords),publicationIntents:digest(parsed.map(item=>({slug:item.slug,intent:"manual-election-publication"})))};delete promotion.packageDigest;promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(article=>new URL(article.canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);console.log(JSON.stringify({articles:articles.map(({slug,headline})=>({slug,headline})),packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount},null,2));
