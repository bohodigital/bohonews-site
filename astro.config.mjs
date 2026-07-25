import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://bohonews.com",
  build: {
    format: "directory"
  }
});
