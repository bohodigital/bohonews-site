import type { APIRoute } from "astro";
const candidateUnpublished = import.meta.env.BOHONEWS_PREVIEW === "1" || import.meta.env.BOHONEWS_ACTIVATION === "1";
export const GET: APIRoute = () => new Response(candidateUnpublished
  ? "User-agent: *\nDisallow: /\n"
  : "User-agent: *\nAllow: /\nSitemap: https://bohonews.com/sitemap.xml\nSitemap: https://bohonews.com/news-sitemap.xml\n",
{headers:{"Content-Type":"text/plain; charset=utf-8"}});
