import type { APIRoute } from "astro";
import { articles, candidatePreviewEnabled, promotionGeneratedAt } from "../lib/news";
export const GET: APIRoute = () => {
  const cutoff = Date.parse(promotionGeneratedAt) - (48 * 60 * 60 * 1000);
  const body = (candidatePreviewEnabled ? [] : articles)
    .filter((a) => !a.fixture && a.distribution.newsSitemap && a.retractionState === "current" && a.publishedAt && Date.parse(a.publishedAt) >= cutoff)
    .map((a) => `<url><loc>${a.canonicalUrl}</loc><news:news><news:publication><news:name>Boho News</news:name><news:language>en</news:language></news:publication><news:publication_date>${a.publishedAt}</news:publication_date><news:title>${a.headline.replaceAll("&","&amp;").replaceAll("<","&lt;")}</news:title></news:news></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${body}</urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8"}});
};
