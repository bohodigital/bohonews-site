import { defineConfig } from "astro/config";

const finalizationFastpath = process.env.BOHONEWS_FINALIZATION_FASTPATH === "1";

export default defineConfig({
  output: "static",
  site: "https://bohonews.com",
  publicDir: finalizationFastpath
    ? "./tmp/mcp-finalization-empty-public"
    : "./public",
  outDir: finalizationFastpath
    ? "./tmp/mcp-finalization-generated"
    : "./dist",
  build: {
    format: "directory",
    emptyOutDir: true
  }
});
