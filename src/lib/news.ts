import release from "../data/public-news-promotion-package.v1.json";
import { previewFixtures } from "../data/preview-fixtures";

export type Correction = {
  id: string; type: string; notice: string; effectiveAt: string;
};

export type PublicArticle = {
  schemaVersion: string; id: string; slug: string; headline: string; dek: string;
  articleType: string; publicationStatus: string; section: string; topics: string[];
  entities: string[]; locations: string[]; authors: string[]; editor: string;
  publishedAt: string; updatedAt: string; eventId: string; body: string;
  confirmedFactsSummary: string[]; uncertainty: string[];
  citations: Array<{id:string;title:string;publisher:string;url:string;publishedAt:string}>;
  leadImage: null | {src:string;alt?:string;caption?:string;credit?:string;width?:number;height?:number};
  media: unknown[]; revisionHistory: Array<{version:number;at:string;summary:string}>;
  corrections: Correction[]; retractionState: string; distribution: {rss:boolean;newsSitemap:boolean};
  social: {title?:string;description?:string;image?:string}; search: {index:boolean};
  relatedArticleIds: string[]; canonicalUrl: string;
  supersedesArticleId: string|null; supersededByArticleId: string|null;
  fixture?: boolean;
};

const promoted = release.articles as PublicArticle[];
export const fixturesEnabled = import.meta.env.BOHONEWS_INCLUDE_FIXTURES === "1";
export const articles: PublicArticle[] = fixturesEnabled ? previewFixtures : promoted;
export const sections = [
  ["latest-news","Latest News"],["politics","Politics"],["white-house","White House"],
  ["congress","Congress"],["courts","Courts"],["elections","Elections"],
  ["investigations","Investigations"],["explainers","Explainers"],["opinion","Opinion"]
] as const;

export function articlePath(article: PublicArticle) { return `/articles/${article.slug}/`; }
export function sectionArticles(section: string) {
  const source = section === "latest-news" ? articles : articles.filter((article) => article.section === section);
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
