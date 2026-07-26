import type { APIRoute } from "astro";
import { articles, discoveryPaths, sections } from "../lib/news";
const base = "https://bohonews.com";
export const GET: APIRoute = () => {
  const publicArticles = articles.filter((a) => !a.fixture && a.search.index && a.retractionState === "current");
  const paths = ["/","/search/","/about/","/corrections/","/editorial-standards/","/contact/","/privacy/","/terms/",...sections.map(([id]) => `/${id}/`),...discoveryPaths(publicArticles),...publicArticles.map((a) => `/articles/${a.slug}/`)];
  const body = [...new Set(paths)].sort().map((path) => `<url><loc>${base}${path}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8"}});
};
