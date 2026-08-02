const API = "/api/weather/v1";
const VERSION = "1.1.1";
const USER_AGENT = "BohoNewsWeather/0.1 (+https://bohonews.com/contact/)";
const RADAR_CAPABILITIES = "https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?request=GetCapabilities&service=WMS&version=1.3.0";
const RADAR_WMS = "https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows";
const USGS_TILES = "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile";
const DEFAULT_LOCATION = { latitude: 41.9, longitude: -87.65, city: "Chicago", region: "Illinois", regionCode: "IL", countryCode: "US", timezone: "America/Chicago", precision: "approximate" };
const PLACES = [
  ["Chicago", "Illinois", "US", 41.8781, -87.6298, "America/Chicago"],
  ["New York", "New York", "US", 40.7128, -74.006, "America/New_York"],
  ["Los Angeles", "California", "US", 34.0522, -118.2437, "America/Los_Angeles"],
  ["Miami", "Florida", "US", 25.7617, -80.1918, "America/New_York"],
  ["Toronto", "Ontario", "CA", 43.6532, -79.3832, "America/Toronto"],
  ["London", "England", "GB", 51.5072, -0.1276, "Europe/London"],
  ["Paris", "Ile-de-France", "FR", 48.8566, 2.3522, "Europe/Paris"],
  ["Tokyo", "Tokyo", "JP", 35.6762, 139.6503, "Asia/Tokyo"],
  ["Sydney", "New South Wales", "AU", -33.8688, 151.2093, "Australia/Sydney"],
  ["Mexico City", "Mexico City", "MX", 19.4326, -99.1332, "America/Mexico_City"],
  ["Sao Paulo", "Sao Paulo", "BR", -23.5505, -46.6333, "America/Sao_Paulo"],
  ["Cape Town", "Western Cape", "ZA", -33.9249, 18.4241, "Africa/Johannesburg"]
];

function json(value, status = 200, cache = "no-store") {
  return new Response(`${JSON.stringify(value)}\n`, { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}
function problem(status, code, message) { return json({ schemaVersion: VERSION, error: { code, message } }, status); }
function round(value) { return Number((Math.round(value / 0.05) * 0.05).toFixed(4)); }
function point(params, fallback) {
  const latitude = Number(params.get("lat") ?? fallback.latitude);
  const longitude = Number(params.get("lon") ?? fallback.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError("Coordinates must contain valid latitude and longitude values");
  return { latitude: round(latitude), longitude: round(longitude) };
}
function context(request) {
  const cf = request.cf || {};
  const latitude = Number(cf.latitude);
  const longitude = Number(cf.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return DEFAULT_LOCATION;
  return { latitude: round(latitude), longitude: round(longitude), city: cf.city || "Approximate location", region: cf.region || null, regionCode: cf.regionCode || null, countryCode: cf.country || null, timezone: cf.timezone || null, precision: "approximate" };
}
async function upstream(url, accept = "application/geo+json") {
  const response = await fetch(url, { headers: { Accept: accept, "User-Agent": USER_AGENT }, cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error(`Upstream weather service returned HTTP ${response.status}`);
  return response.json();
}
async function upstreamResponse(url, accept) {
  const response = await fetch(url, { headers: { Accept: accept, "User-Agent": USER_AGENT }, cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error(`Upstream weather service returned HTTP ${response.status}`);
  return response;
}
async function cached(request, env, ctx, key, producer) {
  const cacheRequest = new Request(new URL(`/__weather_cache__/${encodeURIComponent(key)}`, request.url));
  const edgeHit = await caches.default.match(cacheRequest);
  if (edgeHit) return edgeHit;
  const kvHit = env.WEATHER_CACHE && await env.WEATHER_CACHE.get(key, "text");
  if (kvHit) {
    const response = new Response(kvHit, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=900, stale-while-revalidate=3600", "X-Weather-Cache": "kv" } });
    ctx.waitUntil(caches.default.put(cacheRequest, response.clone()));
    return response;
  }
  const body = `${JSON.stringify(await producer())}\n`;
  const response = new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=900, stale-while-revalidate=3600", "X-Weather-Cache": "miss" } });
  ctx.waitUntil(caches.default.put(cacheRequest, response.clone()));
  if (env.WEATHER_CACHE) ctx.waitUntil(env.WEATHER_CACHE.put(key, body, { expirationTtl: 7200 }));
  return response;
}

const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
function parseDuration(value) {
  const match = String(value || "").match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);
  if (!match) return 0;
  return ((Number(match[1] || 0) * 24 + Number(match[2] || 0)) * 60 + Number(match[3] || 0)) * 60000;
}
function gridValueAt(property, timestamp) {
  const instant = new Date(timestamp).getTime();
  for (const item of property?.values || []) {
    const [start, duration] = String(item.validTime || "").split("/");
    const startMs = new Date(start).getTime();
    if (Number.isFinite(startMs) && instant >= startMs && instant < startMs + parseDuration(duration)) {
      if (item.value === null || item.value === undefined || item.value === "") return null;
      const value = Number(item.value);
      return Number.isFinite(value) ? value : null;
    }
  }
  return null;
}
function measure(value, unit) { return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? { value: Number(value), unit } : null; }
function nwsPeriod(value, grid = null) {
  const raw = Number(value.temperature);
  const celsius = value.temperatureUnit === "F" ? (raw - 32) * 5 / 9 : raw;
  const windMatch = String(value.windSpeed || "").match(/(\d+(?:\.\d+)?)/);
  return {
    startTime: new Date(value.startTime).toISOString(), endTime: new Date(value.endTime).toISOString(),
    summary: value.shortForecast || value.detailedForecast || "Forecast unavailable",
    temperature: { value: Number(celsius.toFixed(2)), unit: "C" },
    precipitationProbability: value.probabilityOfPrecipitation?.value !== null && value.probabilityOfPrecipitation?.value !== undefined && Number.isFinite(Number(value.probabilityOfPrecipitation.value)) ? Number(value.probabilityOfPrecipitation.value) : gridValueAt(grid?.probabilityOfPrecipitation, value.startTime),
    precipitationAmount: measure(gridValueAt(grid?.quantitativePrecipitation, value.startTime), "mm"),
    humidity: gridValueAt(grid?.relativeHumidity, value.startTime),
    dewPoint: measure(gridValueAt(grid?.dewpoint, value.startTime), "C"),
    cloudCover: gridValueAt(grid?.skyCover, value.startTime),
    atmosphericPressure: (() => { const pressure = gridValueAt(grid?.pressure, value.startTime); return pressure !== null && pressure > 50000 ? measure(pressure, "Pa") : null; })(),
    windSpeed: windMatch ? { value: Number((Number(windMatch[1]) * 0.44704).toFixed(2)), unit: "m/s" } : null,
    windDirection: directions.indexOf(value.windDirection) < 0 ? null : directions.indexOf(value.windDirection) * 22.5
  };
}
function normalizeAlerts(payload) {
  return (payload.features || []).slice(0, 100).map(({ id, properties: value = {} }) => ({
    id: String(id || value.id || "unknown-alert"), event: value.event || "Weather alert", headline: value.headline || value.event || "Weather alert",
    severity: value.severity || null, urgency: value.urgency || null, certainty: value.certainty || null,
    effectiveAt: value.effective ? new Date(value.effective).toISOString() : null,
    endsAt: value.ends || value.expires ? new Date(value.ends || value.expires).toISOString() : null,
    instruction: value.instruction || null
  }));
}
async function nwsForecast(latitude, longitude, precision) {
  const fetchedAt = new Date().toISOString();
  const base = await upstream(`https://api.weather.gov/points/${latitude},${longitude}`);
  const props = base.properties || {};
  if (!props.forecast || !props.forecastHourly || !props.forecastGridData) throw new Error("NWS point response did not include forecast endpoints");
  const [dailyRaw, hourlyRaw, gridRaw, alertsRaw] = await Promise.all([upstream(props.forecast), upstream(props.forecastHourly), upstream(props.forecastGridData), upstream(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)]);
  const grid = gridRaw.properties || {};
  const hourly = (hourlyRaw.properties?.periods || []).slice(0, 168).map((item) => nwsPeriod(item, grid));
  const daily = (dailyRaw.properties?.periods || []).filter((item) => item.isDaytime !== false).slice(0, 14).map((item) => nwsPeriod(item, grid));
  const current = hourly[0] || daily[0];
  const relative = props.relativeLocation?.properties || {};
  return {
    schemaVersion: VERSION, generatedAt: fetchedAt,
    location: { latitude, longitude, precision, label: [relative.city, relative.state].filter(Boolean).join(", ") || "Selected U.S. location", countryCode: "US", timezone: props.timeZone || null },
    current: current ? { observedAt: current.startTime, summary: current.summary, temperature: current.temperature, windSpeed: current.windSpeed, windDirection: current.windDirection, humidity: current.humidity, precipitationProbability: current.precipitationProbability } : null,
    hourly, daily, alerts: normalizeAlerts(alertsRaw),
    provenance: [{ sourceId: "nws-api", sourceName: "National Weather Service", sourceUrl: "https://api.weather.gov/", fetchedAt, validAt: current?.startTime || null, attribution: "National Weather Service", freshness: "fresh" }]
  };
}
function metPeriod(item, nextItem) {
  const details = item.data?.instant?.details || {};
  const next = item.data?.next_1_hours || item.data?.next_6_hours || {};
  return {
    startTime: new Date(item.time).toISOString(), endTime: new Date(nextItem?.time || new Date(new Date(item.time).getTime() + 3600000)).toISOString(),
    summary: String(next.summary?.symbol_code || "forecast").replaceAll("_", " "),
    temperature: { value: Number(details.air_temperature), unit: "C" },
    precipitationProbability: next.details?.probability_of_precipitation !== null && next.details?.probability_of_precipitation !== undefined && Number.isFinite(Number(next.details.probability_of_precipitation)) ? Number(next.details.probability_of_precipitation) : null,
    precipitationAmount: measure(next.details?.precipitation_amount, "mm"),
    humidity: Number.isFinite(Number(details.relative_humidity)) ? Number(details.relative_humidity) : null,
    dewPoint: measure(details.dew_point_temperature, "C"),
    cloudCover: Number.isFinite(Number(details.cloud_area_fraction)) ? Number(details.cloud_area_fraction) : null,
    atmosphericPressure: measure(Number(details.air_pressure_at_sea_level) * 100, "Pa"),
    windSpeed: Number.isFinite(Number(details.wind_speed)) ? { value: Number(details.wind_speed), unit: "m/s" } : null,
    windDirection: Number.isFinite(Number(details.wind_from_direction)) ? Number(details.wind_from_direction) : null
  };
}
async function metForecast(latitude, longitude, precision, hint) {
  const fetchedAt = new Date().toISOString();
  const payload = await upstream(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`, "application/json");
  const series = payload.properties?.timeseries || [];
  const hourly = series.slice(0, 168).map((item, index) => metPeriod(item, series[index + 1]));
  if (!hourly.length || !Number.isFinite(hourly[0].temperature.value)) throw new Error("MET Norway response contained no usable forecast");
  const currentPeriod = hourly[0];
  const details = series[0].data?.instant?.details || {};
  const dailyByDate = new Map();
  for (const period of hourly) {
    const key = period.startTime.slice(0, 10);
    const distanceFromNoon = Math.abs(new Date(period.startTime).getUTCHours() - 12);
    if (!dailyByDate.has(key) || distanceFromNoon < dailyByDate.get(key).distanceFromNoon) dailyByDate.set(key, { period, distanceFromNoon });
  }
  return {
    schemaVersion: VERSION, generatedAt: fetchedAt,
    location: { latitude, longitude, precision, label: hint.label || "Selected location", countryCode: hint.countryCode || null, timezone: hint.timezone || null },
    current: { observedAt: currentPeriod.startTime, summary: currentPeriod.summary, temperature: currentPeriod.temperature, windSpeed: currentPeriod.windSpeed, windDirection: currentPeriod.windDirection, humidity: Number.isFinite(Number(details.relative_humidity)) ? Number(details.relative_humidity) : null, precipitationProbability: currentPeriod.precipitationProbability },
    hourly, daily: [...dailyByDate.values()].slice(0, 10).map((item) => item.period), alerts: [],
    provenance: [{ sourceId: "met-norway-locationforecast", sourceName: "MET Norway", sourceUrl: "https://api.met.no/weatherapi/locationforecast/2.0/", fetchedAt, validAt: currentPeriod.startTime, attribution: "Data from MET Norway (CC BY 4.0)", freshness: "fresh" }]
  };
}
async function produceForecast(latitude, longitude, precision, hint) {
  if (hint.countryCode === "US") return nwsForecast(latitude, longitude, precision);
  try { return await nwsForecast(latitude, longitude, precision); }
  catch (error) {
    if (!/HTTP (404|500|502|503|504)|did not include/.test(error.message)) throw error;
    return metForecast(latitude, longitude, precision, hint);
  }
}
async function search(env, query) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  if (env.WEATHER_LOCATIONS) {
    try {
      const result = await env.WEATHER_LOCATIONS.prepare("SELECT name, region, country_code AS countryCode, latitude, longitude, timezone FROM locations WHERE name_search LIKE ? ORDER BY population DESC LIMIT 8").bind(`${term}%`).all();
      if (result.results?.length) return result.results;
    } catch { /* The local preview works before the optional gazetteer import. */ }
  }
  return PLACES.filter(([name, region, country]) => `${name} ${region} ${country}`.toLowerCase().includes(term)).slice(0, 8).map(([name, region, countryCode, latitude, longitude, timezone]) => ({ name, region, countryCode, latitude, longitude, timezone }));
}

function radarFrames(xml) {
  const match = xml.match(/<Dimension[^>]+name=["']time["'][^>]*>([^<]+)<\/Dimension>/i);
  if (!match) throw new Error("NOAA radar capabilities did not include time frames");
  return match[1].split(",").map((value) => new Date(value.trim()).toISOString()).filter((value) => value !== "Invalid Date").slice(-24);
}
function tileBounds(z, x, y) {
  const half = 20037508.342789244;
  const span = half * 2 / (2 ** z);
  const minX = -half + x * span;
  const maxX = minX + span;
  const maxY = half - y * span;
  return [minX, maxY - span, maxX, maxY].map((value) => value.toFixed(4)).join(",");
}
async function radarManifest(request, ctx) {
  const key = new Request(new URL("/__weather_cache__/radar-manifest", request.url));
  const hit = await caches.default.match(key);
  if (hit) return hit;
  const xml = await (await upstreamResponse(RADAR_CAPABILITIES, "application/xml")).text();
  const frames = radarFrames(xml);
  const response = json({ schemaVersion: VERSION, kind: "observed-radar", coverage: "CONUS", product: "MRMS quality-controlled base reflectivity", frames, tileTemplate: `${API}/radar/tiles/{z}/{x}/{y}.png?time={time}`, attribution: "NOAA / National Weather Service MRMS", sourceUrl: "https://opengeo.ncep.noaa.gov/geoserver/www/index.html" }, 200, "public, max-age=90, stale-while-revalidate=300");
  ctx.waitUntil(caches.default.put(key, response.clone()));
  return response;
}
async function proxyTile(request, ctx, upstreamUrl, cacheSeconds, attribution) {
  const cachedTile = await caches.default.match(request);
  if (cachedTile) return cachedTile;
  const upstreamTile = await upstreamResponse(upstreamUrl, "image/png,image/jpeg;q=0.8");
  const headers = new Headers(upstreamTile.headers);
  headers.set("Cache-Control", `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`);
  headers.set("X-Weather-Attribution", attribution);
  headers.set("X-Content-Type-Options", "nosniff");
  const response = new Response(upstreamTile.body, { status: 200, headers });
  ctx.waitUntil(caches.default.put(request, response.clone()));
  return response;
}
async function radarTile(request, ctx, match) {
  const z = Number(match[1]); const x = Number(match[2]); const y = Number(match[3]);
  if (![z, x, y].every(Number.isInteger) || z < 0 || z > 15 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return problem(400, "invalid_tile", "Radar tile coordinates are invalid");
  const time = new URL(request.url).searchParams.get("time");
  if (!time || Number.isNaN(Date.parse(time))) return problem(400, "invalid_time", "Radar tiles require a valid frame timestamp");
  const params = new URLSearchParams({ service: "WMS", version: "1.1.1", request: "GetMap", layers: "conus_bref_qcd", styles: "radar_reflectivity", bbox: tileBounds(z, x, y), width: "256", height: "256", srs: "EPSG:3857", format: "image/png", transparent: "true", time: new Date(time).toISOString() });
  return proxyTile(request, ctx, `${RADAR_WMS}?${params}`, 3600, "NOAA / National Weather Service MRMS");
}
async function baseTile(request, ctx, match) {
  const z = Number(match[1]); const x = Number(match[2]); const y = Number(match[3]);
  if (![z, x, y].every(Number.isInteger) || z < 0 || z > 16 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return problem(400, "invalid_tile", "Base-map tile coordinates are invalid");
  return proxyTile(request, ctx, `${USGS_TILES}/${z}/${y}/${x}`, 86400, "USGS The National Map");
}
function warningCollection(payload) {
  return { type: "FeatureCollection", features: (payload.features || []).slice(0, 100).filter((feature) => feature.geometry).map((feature) => ({ type: "Feature", id: String(feature.id || feature.properties?.id || "alert"), geometry: feature.geometry, properties: { event: feature.properties?.event || "Weather alert", headline: feature.properties?.headline || feature.properties?.event || "Weather alert", severity: feature.properties?.severity || null, urgency: feature.properties?.urgency || null, endsAt: feature.properties?.ends || feature.properties?.expires || null } })) };
}

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const local = context(request);
  if (url.pathname === `${API}/health`) return json({ schemaVersion: VERSION, status: "ok", service: "bohonews-weather-edge", bindings: { kv: Boolean(env.WEATHER_CACHE), r2: Boolean(env.WEATHER_ASSETS), d1: Boolean(env.WEATHER_LOCATIONS) } });
  if (url.pathname === `${API}/context`) return json({ schemaVersion: VERSION, location: local, privacy: { ipStored: false, coordinatesRounded: true, method: request.cf ? "cloudflare-approximate" : "local-default" } });
  if (url.pathname === `${API}/layers`) return json({ schemaVersion: VERSION, layers: [{ id: "forecast", kind: "forecast", coverage: "global", status: "available" }, { id: "alerts", kind: "observed-alerts", coverage: "US", status: "available" }, { id: "radar", kind: "observed-radar", coverage: "CONUS", status: "available" }] }, 200, "public, max-age=300");
  if (url.pathname === `${API}/radar/manifest`) return radarManifest(request, ctx);
  const radarMatch = url.pathname.match(new RegExp(`^${API}/radar/tiles/(\\d+)/(\\d+)/(\\d+)\\.png$`));
  if (radarMatch) return radarTile(request, ctx, radarMatch);
  const baseMatch = url.pathname.match(new RegExp(`^${API}/map/base/(\\d+)/(\\d+)/(\\d+)$`));
  if (baseMatch) return baseTile(request, ctx, baseMatch);
  if (url.pathname === `${API}/warnings`) {
    const coordinates = point(url.searchParams, local);
    const payload = await upstream(`https://api.weather.gov/alerts/active?point=${coordinates.latitude},${coordinates.longitude}`);
    return json({ schemaVersion: VERSION, ...warningCollection(payload), attribution: "National Weather Service" }, 200, "public, max-age=120, stale-while-revalidate=600");
  }
  if (url.pathname === `${API}/locations/search`) {
    const query = url.searchParams.get("q") || "";
    return query.length > 100 ? problem(400, "invalid_query", "Location query is too long") : json({ schemaVersion: VERSION, results: await search(env, query) }, 200, "public, max-age=86400");
  }
  if (url.pathname === `${API}/forecast`) {
    const coordinates = point(url.searchParams, local);
    const precision = ["approximate", "selected", "device"].includes(url.searchParams.get("precision")) ? url.searchParams.get("precision") : local.precision;
    const hint = { countryCode: url.searchParams.get("country") || local.countryCode, timezone: url.searchParams.get("timezone") || local.timezone, label: url.searchParams.get("label") || [local.city, local.regionCode || local.region].filter(Boolean).join(", ") };
    const key = `weather:${VERSION}:forecast:${coordinates.latitude.toFixed(2)}:${coordinates.longitude.toFixed(2)}`;
    return cached(request, env, ctx, key, () => produceForecast(coordinates.latitude, coordinates.longitude, precision, hint));
  }
  return problem(404, "not_found", "Weather endpoint not found");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/weather/")) return env.ASSETS.fetch(request);
    if (!["GET", "HEAD"].includes(request.method)) return problem(405, "method_not_allowed", "Only GET and HEAD are supported");
    try {
      const response = await handleApi(request, env, ctx);
      return request.method === "HEAD" ? new Response(null, response) : response;
    } catch (error) {
      if (error instanceof RangeError) return problem(400, "invalid_coordinates", error.message);
      console.error("weather-edge-error", error instanceof Error ? error.message : "unknown");
      return problem(503, "weather_temporarily_unavailable", "Weather data is temporarily unavailable. Please try again shortly.");
    }
  }
};
