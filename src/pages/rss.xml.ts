import type { APIRoute } from "astro";
import { articles } from "../lib/news";

function escape(value:string) { return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
export const GET: APIRoute = () => {
  const items = articles.filter((article) => article.distribution.rss && !article.fixture).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map((article) =>
    `<item><title>${escape(article.headline)}</title><link>${article.canonicalUrl}</link><guid isPermaLink="true">${article.canonicalUrl}</guid><pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate><description>${escape(article.dek)}</description></item>`
  ).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Boho News</title><link>https://bohonews.com/</link><description>Latest approved Boho News articles.</description>${items}</channel></rss>`, {headers:{"Content-Type":"application/rss+xml; charset=utf-8"}});
};
