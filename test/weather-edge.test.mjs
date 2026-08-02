import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../cloudflare/weather-worker/src/index.mjs", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/weather/index.astro", import.meta.url), "utf8");
const browser = await readFile(new URL("../public/weather.js", import.meta.url), "utf8");
const nerd = await readFile(new URL("../public/weather-nerd.js", import.meta.url), "utf8");
const radar = await readFile(new URL("../src/scripts/weather-radar.ts", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.weather.jsonc", import.meta.url), "utf8");

test("weather edge exposes a privacy-bounded versioned API", () => {
  assert.match(worker, /\/api\/weather\/v1/);
  assert.match(worker, /request\.cf/);
  assert.match(worker, /function round/);
  assert.doesNotMatch(worker, /CF-Connecting-IP|x-forwarded-for/i);
  assert.doesNotMatch(worker, /(?:api[_-]?key|appid|apikey)\s*[:=]\s*["'][^"']+/i);
});
test("worker declares isolated KV, R2, D1 and static asset bindings", () => {
  for (const binding of ["WEATHER_CACHE", "WEATHER_ASSETS", "WEATHER_LOCATIONS", "ASSETS"]) assert.match(wrangler, new RegExp(binding));
  assert.doesNotMatch(wrangler, /account_id|database_id|namespace_id/);
});
test("weather page supports location choice without browser provider calls", () => {
  assert.match(page, /Use precise device location/);
  assert.match(page, /does not store your IP address/);
  assert.match(browser, /\/api\/weather\/v1/);
  assert.doesNotMatch(browser, /api\.weather\.gov|api\.met\.no|openweathermap|weatherapi\.com/);
});
test("phase 4 radar is same-origin, timestamped and source-labeled", () => {
  assert.match(worker, /conus_bref_qcd/);
  assert.match(worker, /radar\/manifest/);
  assert.match(worker, /radar\/tiles/);
  assert.match(worker, /USGS The National Map/);
  assert.match(radar, /\/api\/weather\/v1/);
  assert.doesNotMatch(radar, /opengeo\.ncep|basemap\.nationalmap/);
});
test("phase 5 graphs distinguish forecast probability and expected amount", () => {
  assert.match(browser, /weather-temp-chart/);
  assert.match(browser, /weather-chance-chart/);
  assert.match(browser, /weather-amount-chart/);
  assert.match(nerd, /precipitationAmount/);
  assert.match(nerd, /dewPoint/);
  assert.match(nerd, /cloudCover/);
  assert.match(nerd, /atmosphericPressure/);
  assert.match(nerd, /nerd-precip-chance-chart/);
  assert.match(nerd, /nerd-precip-amount-chart/);
  assert.match(nerd, /nerd-pressure-chart/);
  assert.match(nerd, /renderCursor/);
  assert.doesNotMatch(nerd, /nerd-table/);
});
