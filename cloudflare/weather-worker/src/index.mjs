const API = "/api/weather/v1";
const VERSION = "1.0.0";
const USER_AGENT = "BohoNewsWeather/0.1 (+https://bohonews.com/contact/)";
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
function nwsPeriod(value) {
  const raw = Number(value.temperature);
  const celsius = value.temperatureUnit === "F" ? (raw - 32) * 5 / 9 : raw;
  const windMatch = String(value.windSpeed || "").match(/(\d+(?:\.\d+)?)/);
  return {
    startTime: new Date(value.startTime).toISOString(), endTime: new Date(value.endTime).toISOString(),
    summary: value.shortForecast || value.detailedForecast || "Forecast unavailable",
    temperature: { value: Number(celsius.toFixed(2)), unit: "C" },
    precipitationProbability: Number.isFinite(Number(value.probabilityOfPrecipitation?.value)) ? Number(value.probabilityOfPrecipitation.value) : null,
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
  if (!props.forecast || !props.forecastHourly) throw new Error("NWS point response did not include forecast endpoints");
  const [dailyRaw, hourlyRaw, alertsRaw] = await Promise.all([upstream(props.forecast), upstream(props.forecastHourly), upstream(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)]);
  const hourly = (hourlyRaw.properties?.periods || []).slice(0, 168).map(nwsPeriod);
  const daily = (dailyRaw.properties?.periods || []).filter((item) => item.isDaytime !== false).slice(0, 14).map(nwsPeriod);
  const current = hourly[0] || daily[0];
  const relative = props.relativeLocation?.properties || {};
  return {
    schemaVersion: VERSION, generatedAt: fetchedAt,
    location: { latitude, longitude, precision, label: [relative.city, relative.state].filter(Boolean).join(", ") || "Selected U.S. location", countryCode: "US", timezone: props.timeZone || null },
    current: current ? { observedAt: current.startTime, summary: current.summary, temperature: current.temperature, windSpeed: current.windSpeed, windDirection: current.windDirection, humidity: null, precipitationProbability: current.precipitationProbability } : null,
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
    precipitationProbability: Number.isFinite(Number(next.details?.probability_of_precipitation)) ? Number(next.details.probability_of_precipitation) : null,
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
  return {
    schemaVersion: VERSION, generatedAt: fetchedAt,
    location: { latitude, longitude, precision, label: hint.label || "Selected location", countryCode: hint.countryCode || null, timezone: hint.timezone || null },
    current: { observedAt: currentPeriod.startTime, summary: currentPeriod.summary, temperature: currentPeriod.temperature, windSpeed: currentPeriod.windSpeed, windDirection: currentPeriod.windDirection, humidity: Number.isFinite(Number(details.relative_humidity)) ? Number(details.relative_humidity) : null, precipitationProbability: currentPeriod.precipitationProbability },
    hourly, daily: hourly.filter((_, index) => index % 24 === 0).slice(0, 10), alerts: [],
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

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const local = context(request);
  if (url.pathname === `${API}/health`) return json({ schemaVersion: VERSION, status: "ok", service: "bohonews-weather-edge", bindings: { kv: Boolean(env.WEATHER_CACHE), r2: Boolean(env.WEATHER_ASSETS), d1: Boolean(env.WEATHER_LOCATIONS) } });
  if (url.pathname === `${API}/context`) return json({ schemaVersion: VERSION, location: local, privacy: { ipStored: false, coordinatesRounded: true, method: request.cf ? "cloudflare-approximate" : "local-default" } });
  if (url.pathname === `${API}/layers`) return json({ schemaVersion: VERSION, layers: [{ id: "forecast", kind: "forecast", coverage: "global", status: "available" }, { id: "alerts", kind: "observed-alerts", coverage: "US", status: "available" }, { id: "radar", kind: "observed-radar", coverage: "US", status: "planned-phase-4" }] }, 200, "public, max-age=300");
  if (url.pathname === `${API}/locations/search`) {
    const query = url.searchParams.get("q") || "";
    return query.length > 100 ? problem(400, "invalid_query", "Location query is too long") : json({ schemaVersion: VERSION, results: await search(env, query) }, 200, "public, max-age=86400");
  }
  if (url.pathname === `${API}/forecast`) {
    const coordinates = point(url.searchParams, local);
    const precision = ["approximate", "selected", "device"].includes(url.searchParams.get("precision")) ? url.searchParams.get("precision") : local.precision;
    const hint = { countryCode: url.searchParams.get("country") || local.countryCode, timezone: url.searchParams.get("timezone") || local.timezone, label: url.searchParams.get("label") || [local.city, local.regionCode || local.region].filter(Boolean).join(", ") };
    const key = `weather:v1:forecast:${coordinates.latitude.toFixed(2)}:${coordinates.longitude.toFixed(2)}`;
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
