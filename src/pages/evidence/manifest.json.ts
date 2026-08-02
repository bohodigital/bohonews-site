import type { APIRoute } from "astro";
import evidenceAssets from "../../lib/evidence-assets.json";

export const GET: APIRoute = () => new Response(JSON.stringify({
  schemaVersion: "1.0.0",
  assetCount: evidenceAssets.length,
  assets: evidenceAssets
},null,2),{
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300"
  }
});
