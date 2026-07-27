import type { APIRoute } from "astro";
const candidatePreview = import.meta.env.BOHONEWS_PREVIEW === "1";
export const GET: APIRoute = () => new Response(candidatePreview
  ? "User-agent: *\nDisallow: /\n"
  : "User-agent: *\nAllow: /\nSitemap: https://bohonews.com/sitemap.xml\nSitemap: https://bohonews.com/news-sitemap.xml\n",
{headers:{"Content-Type":"text/plain; charset=utf-8"}});
