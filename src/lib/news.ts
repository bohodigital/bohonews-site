import release from "../publishing/public-news-promotion-package.v1.json";
import { previewFixtures } from "../publishing/preview-fixtures";

export type Correction = {
  id: string; type: string; notice: string; effectiveAt: string;
};

export type ArticleImage = {
  rightsId: string; src: string; alt: string; caption: string; credit: string;
  width: number; height: number; role?: string; sourceUrl?: string;
};

export type BodyBlock =
  | {type:"paragraph";text:string}
  | {type:"subheading";text:string;level:2|3}
  | {type:"ordered-list"|"unordered-list";items:string[]}
  | ({type:"media"|"official-document-render"} & ArticleImage)
  | {type:"table";caption:string;columns:string[];rows:string[][]}
  | {type:"source-callout";title:string;text:string;sourceId:string}
  | {type:"related-story";articleId:string};

export type PublicArticle = {
  schemaVersion: string; id: string; slug: string; headline: string; dek: string;
  articleType: string; publicationStatus: string; section: string; desk: string|null; topics: string[];
  entities: string[]; locations: string[]; authors: string[]; editor: string;
  publishedAt: string; updatedAt: string; eventId: string; body: string;
  bodyBlocks: BodyBlock[];
  confirmedFactsSummary: string[]; uncertainty: string[];
  citations: Array<{id:string;title:string;publisher:string;url:string;publishedAt:string}>;
  leadImage: null | ArticleImage;
  media: unknown[]; revisionHistory: Array<{version:number;at:string;summary:string}>;
  corrections: Correction[]; retractionState: string; distribution: {rss:boolean;newsSitemap:boolean};
  social: {title?:string;description?:string;image?:string}; search: {index:boolean};
  relatedArticleIds: string[]; canonicalUrl: string;
  supersedesArticleId: string|null; supersededByArticleId: string|null;
  fixture?: boolean;
};

const promoted = release.articles as PublicArticle[];
export const promotionGeneratedAt = release.generatedAt;
export const fixturesEnabled = import.meta.env.BOHONEWS_INCLUDE_FIXTURES === "1";
export const benchmarkEnabled = import.meta.env.BOHONEWS_BENCHMARK_1000 === "1";
function benchmarkArticles(): PublicArticle[] {
  return Array.from({length:1000},(_,index) => {
    const suffix = String(index + 1).padStart(4,"0");
    return {
      ...structuredClone(previewFixtures[index % previewFixtures.length]),
      id:`benchmark-${suffix}`,slug:`benchmark-${suffix}`,
      headline:`Synthetic benchmark article ${suffix}`,
      canonicalUrl:`https://bohonews.com/articles/benchmark-${suffix}/`,
      relatedArticleIds:[],fixture:true
    };
  });
}
export const articles: PublicArticle[] = benchmarkEnabled ? benchmarkArticles() : fixturesEnabled ? previewFixtures : promoted;
export const sections = [
  ["latest","Latest"],["live","Live"],["us","U.S."],["world","World"],["politics","Politics"],
  ["business","Business"],["crime-justice","Crime & Justice"],["weather-climate","Weather & Climate"],
  ["health-science","Health & Science"],["technology","Technology"],["culture","Culture"],["sports","Sports"],
  ["investigations","Investigations"],["analysis","Analysis"],["opinion","Opinion"],["visuals","Visuals"],
  ["documents","Documents"],["data","Data"],["video","Video"],["newsletters","Newsletters"],
  ["latest-news","Latest News"],["white-house","White House"],["congress","Congress"],
  ["courts","Courts"],["elections","Elections"],["explainers","Explainers"]
] as const;

export const contextualNavigation: Record<string,Array<[string,string]>> = {
  politics:[["White House","/politics/white-house/"],["Congress","/politics/congress/"],["Policy","/politics/"],
    ["State politics","/politics/"],["Elections","/politics/elections/"],["Campaign money","/politics/campaign-finance/"]],
  "weather-climate":[["Severe weather","/weather-climate/severe-weather/"],["Hurricanes","/weather-climate/hurricanes/"],
    ["Wildfires","/weather-climate/wildfires/"],["Floods","/weather-climate/"],["Heat","/weather-climate/"],["Climate","/weather-climate/climate/"]],
  "crime-justice":[["Crime","/crime-justice/"],["Courts","/crime-justice/courts/"],["Policing","/crime-justice/policing/"],
    ["Prisons","/crime-justice/"],["Major cases","/crime-justice/major-cases/"],["Public corruption","/crime-justice/"]],
  world:[["Americas","/world/americas/"],["Europe","/world/europe/"],["Middle East","/world/middle-east/"],
    ["Africa","/world/africa/"],["Asia","/world/asia/"],["Pacific","/world/"]]
};

export function articlePath(article: PublicArticle) { return `/articles/${article.slug}/`; }
export function discoveryPaths(source = articles) {
  const slugify = (value:string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return [
    ["topics",(article:PublicArticle) => article.topics],
    ["entities",(article:PublicArticle) => article.entities],
    ["locations",(article:PublicArticle) => article.locations],
    ["authors",(article:PublicArticle) => article.authors]
  ].flatMap(([kind,select]) => [...new Set(source.flatMap((article) => (select as (article:PublicArticle)=>string[])(article)))].map((value) => `/${kind}/${slugify(value)}/`));
}
export function sectionArticles(section: string) {
  const source = ["latest","latest-news"].includes(section)
    ? articles
    : articles.filter((article) => article.section === section || article.desk === section);
  return [...source].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(new Date(value));
}
export function articleJsonLd(article: PublicArticle) {
  return {
    "@context":"https://schema.org",
    "@type": article.articleType === "opinion" ? "Article" : "NewsArticle",
    headline:article.headline,description:article.dek,datePublished:article.publishedAt,
    dateModified:article.updatedAt,mainEntityOfPage:article.canonicalUrl,
    author:article.authors.map((name) => ({"@type":"Person",name})),
    publisher:{"@type":"Organization",name:"Boho News",url:"https://bohonews.com"},
    ...(article.leadImage ? {image:new URL(article.leadImage.src,"https://bohonews.com").href} : {})
  };
}
