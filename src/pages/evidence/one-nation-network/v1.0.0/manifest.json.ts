import type { APIRoute } from "astro";
import release from "../../../../lib/one-nation-evidence-release.json";

export const GET: APIRoute = () => new Response(JSON.stringify(release,null,2),{
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=31536000, immutable"
  }
});
