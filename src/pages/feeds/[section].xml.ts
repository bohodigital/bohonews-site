import type { APIRoute, GetStaticPaths } from "astro";
import { articles, candidatePreviewEnabled } from "../../lib/news";
export const getStaticPaths = (() => ["politics","white-house","congress","courts","elections","investigations","explainers","opinion"].map((section) => ({params:{section}}))) satisfies GetStaticPaths;
function escape(value:string) { return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
export const GET: APIRoute = ({params}) => {
  const items = (candidatePreviewEnabled ? [] : articles)
    .filter((a) => a.section === params.section && a.distribution.rss && !a.fixture && a.publishedAt)
    .map((a) => `<item><title>${escape(a.headline)}</title><link>${a.canonicalUrl}</link><guid>${a.canonicalUrl}</guid><pubDate>${new Date(a.publishedAt!).toUTCString()}</pubDate></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Boho News: ${escape(params.section ?? "")}</title><link>https://bohonews.com/${params.section}/</link><description>Approved section feed.</description>${items}</channel></rss>`,{headers:{"Content-Type":"application/rss+xml; charset=utf-8"}});
};
