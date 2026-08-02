import * as maplibregl from "maplibre-gl";

const API = "/api/weather/v1";
type Location = { latitude: number; longitude: number; label?: string; countryCode?: string | null };
type RadarManifest = { frames: string[]; tileTemplate: string; attribution: string };

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Weather map request failed");
  return payload;
}

function style() {
  return {
    version: 8 as const,
    sources: {
      usgs: { type: "raster" as const, tiles: [`${API}/map/base/{z}/{x}/{y}`], tileSize: 256, attribution: "USGS The National Map" }
    },
    layers: [{ id: "usgs", type: "raster" as const, source: "usgs", paint: { "raster-saturation": -0.55, "raster-contrast": 0.08, "raster-brightness-max": 0.9 } }]
  };
}

export async function initWeatherRadar(root: HTMLElement) {
  const mapNode = root.querySelector<HTMLElement>("[data-radar-map]");
  const slider = root.querySelector<HTMLInputElement>("[data-radar-frame]");
  const play = root.querySelector<HTMLButtonElement>("[data-radar-play]");
  const time = root.querySelector<HTMLTimeElement>("[data-radar-time]");
  const note = root.querySelector<HTMLElement>("[data-radar-note]");
  const alerts = root.querySelector<HTMLInputElement>("[data-radar-alerts]");
  if (!mapNode || !slider || !play || !time || !note || !alerts) return;
  let location: Location = { latitude: 41.9, longitude: -87.65, countryCode: "US" };
  let manifest: RadarManifest | null = null;
  let index = 0;
  let timer = 0;
  const map = new maplibregl.Map({ container: mapNode, style: style(), center: [location.longitude, location.latitude], zoom: root.classList.contains("weather-radar--compact") ? 5.7 : 5, maxZoom: 12, minZoom: 2, attributionControl: false });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

  function tile(frame: string) { return manifest!.tileTemplate.replace("{time}", encodeURIComponent(frame)); }
  function renderFrame(next: number) {
    if (!manifest?.frames.length || !map.getSource("radar")) return;
    index = Math.max(0, Math.min(next, manifest.frames.length - 1));
    slider!.value = String(index);
    const frame = manifest.frames[index];
    (map.getSource("radar") as maplibregl.RasterTileSource).setTiles([tile(frame)]);
    time!.dateTime = frame;
    time!.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(frame));
  }
  function stop() { window.clearInterval(timer); timer = 0; play!.textContent = "Play radar"; play!.setAttribute("aria-pressed", "false"); }
  function togglePlay() {
    if (timer) return stop();
    play!.textContent = "Pause radar"; play!.setAttribute("aria-pressed", "true");
    timer = window.setInterval(() => renderFrame(index >= (manifest?.frames.length || 1) - 1 ? 0 : index + 1), 650);
  }
  async function loadWarnings() {
    try {
      const collection = await json<GeoJSON.FeatureCollection>(`${API}/warnings?lat=${location.latitude}&lon=${location.longitude}`);
      const source = map.getSource("warnings") as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(collection);
    } catch { note!.textContent = "Radar is live; warning polygons are temporarily unavailable."; }
  }
  function applyLocation(next: Location) {
    location = next;
    map.easeTo({ center: [next.longitude, next.latitude], zoom: next.countryCode === "US" ? 5.7 : 4, duration: 700 });
    const inConus = next.latitude >= 20 && next.latitude <= 55 && next.longitude >= -130 && next.longitude <= -60;
    if (map.getLayer("radar")) map.setLayoutProperty("radar", "visibility", inConus ? "visible" : "none");
    note!.textContent = inConus ? "Observed NOAA MRMS reflectivity. Forecast precipitation is shown separately." : "Observed NOAA radar currently covers the continental United States; the forecast and graphs remain global.";
    if (inConus) void loadWarnings();
    else {
      const source = map.getSource("warnings") as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData({ type: "FeatureCollection", features: [] });
    }
  }
  slider.addEventListener("input", () => { stop(); renderFrame(Number(slider.value)); });
  play.addEventListener("click", togglePlay);
  alerts.addEventListener("change", () => { if (map.getLayer("warnings-fill")) map.setLayoutProperty("warnings-fill", "visibility", alerts.checked ? "visible" : "none"); if (map.getLayer("warnings-line")) map.setLayoutProperty("warnings-line", "visibility", alerts.checked ? "visible" : "none"); });
  window.addEventListener("boho:weather-location", (event) => applyLocation((event as CustomEvent<Location>).detail));
  map.on("load", async () => {
    try {
      manifest = await json<RadarManifest>(`${API}/radar/manifest`);
      slider.max = String(Math.max(0, manifest.frames.length - 1));
      index = Math.max(0, manifest.frames.length - 1);
      if (manifest.frames.length) map.addSource("radar", { type: "raster", tiles: [tile(manifest.frames[index])], tileSize: 256, attribution: manifest.attribution });
      if (manifest.frames.length) map.addLayer({ id: "radar", type: "raster", source: "radar", paint: { "raster-opacity": 0.72, "raster-fade-duration": 0 } });
      map.addSource("warnings", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "warnings-fill", type: "fill", source: "warnings", paint: { "fill-color": ["match", ["get", "severity"], "Extreme", "#7f1d1d", "Severe", "#d62f2f", "#f0aa34"], "fill-opacity": 0.2 } });
      map.addLayer({ id: "warnings-line", type: "line", source: "warnings", paint: { "line-color": "#9f1717", "line-width": 2.5 } });
      renderFrame(index);
      applyLocation(location);
    } catch (error) { note.textContent = error instanceof Error ? error.message : "Radar is temporarily unavailable."; time.textContent = "Radar unavailable"; play.disabled = true; slider.disabled = true; }
  });
}
