import type {APIRoute} from "astro";
import {oneNationBibliography} from "../../../lib/one-nation-bibliography";

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: "bohonews.investigation-bibliography.v1",
  investigation: "one-nation-astroturf-news-network",
  generated_from: "src/lib/one-nation-bibliography.ts",
  source_count: oneNationBibliography.length,
  sources: oneNationBibliography
}, null, 2), {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300"
  }
});
