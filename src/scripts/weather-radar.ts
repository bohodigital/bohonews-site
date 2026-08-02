import * as L from "leaflet";

const API = "/api/weather/v1";
type Location = { latitude: number; longitude: number; label?: string; countryCode?: string | null };
type RadarManifest = { frames: string[]; tileTemplate: string; attribution: string };

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Weather map request failed");
  return payload;
}

export async function initWeatherRadar(root: HTMLElement) {
  const mapNode = root.querySelector<HTMLElement>("[data-radar-map]");
  const slider = root.querySelector<HTMLInputElement>("[data-radar-frame]");
  const play = root.querySelector<HTMLButtonElement>("[data-radar-play]");
  const time = root.querySelector<HTMLTimeElement>("[data-radar-time]");
  const note = root.querySelector<HTMLElement>("[data-radar-note]");
  const alerts = root.querySelector<HTMLInputElement>("[data-radar-alerts]");
  if (!mapNode || !slider || !play || !time || !note || !alerts) return;
  const frameSlider = slider;
  const playButton = play;
  const frameTime = time;
  const statusNote = note;

  let location: Location = { latitude: 41.9, longitude: -87.65, countryCode: "US" };
  let manifest: RadarManifest | null = null;
  let radarLayer: L.TileLayer | null = null;
  let index = 0;
  let timer = 0;
  const map = L.map(mapNode, { minZoom: 2, maxZoom: 12, zoomControl: true, attributionControl: true, preferCanvas: true }).setView(
    [location.latitude, location.longitude],
    root.classList.contains("weather-radar--compact") ? 5.7 : 5
  );
  L.tileLayer(`${API}/map/base/{z}/{x}/{y}`, { attribution: "USGS The National Map", maxZoom: 16 }).addTo(map);
  const warningLayer = L.geoJSON(undefined, {
    style: (feature) => ({
      color: "#9f1717",
      fillColor: feature?.properties?.severity === "Extreme" ? "#7f1d1d" : feature?.properties?.severity === "Severe" ? "#d62f2f" : "#f0aa34",
      fillOpacity: .2,
      weight: 2.5
    })
  }).addTo(map);

  function tile(frame: string) { return manifest!.tileTemplate.replace("{time}", encodeURIComponent(frame)); }
  function renderFrame(next: number) {
    if (!manifest?.frames.length || !radarLayer) return;
    index = Math.max(0, Math.min(next, manifest.frames.length - 1));
    frameSlider.value = String(index);
    const frame = manifest.frames[index];
    radarLayer.setUrl(tile(frame), false);
    frameTime.dateTime = frame;
    frameTime.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(frame));
  }
  function stop() { window.clearInterval(timer); timer = 0; playButton.textContent = "Play radar"; playButton.setAttribute("aria-pressed", "false"); }
  function togglePlay() {
    if (timer) return stop();
    playButton.textContent = "Pause radar"; playButton.setAttribute("aria-pressed", "true");
    timer = window.setInterval(() => renderFrame(index >= (manifest?.frames.length || 1) - 1 ? 0 : index + 1), 650);
  }
  async function loadWarnings() {
    try {
      const collection = await json<GeoJSON.GeoJsonObject>(`${API}/warnings?lat=${location.latitude}&lon=${location.longitude}`);
      warningLayer.clearLayers().addData(collection);
    } catch { statusNote.textContent = "Radar is live; warning polygons are temporarily unavailable."; }
  }
  function showWarnings(show: boolean) {
    if (show && !map.hasLayer(warningLayer)) warningLayer.addTo(map);
    if (!show && map.hasLayer(warningLayer)) warningLayer.removeFrom(map);
  }
  function applyLocation(next: Location) {
    location = next;
    map.flyTo([next.latitude, next.longitude], next.countryCode === "US" ? 5.7 : 4, { duration: .7 });
    const inConus = next.latitude >= 20 && next.latitude <= 55 && next.longitude >= -130 && next.longitude <= -60;
    if (radarLayer) {
      if (inConus && !map.hasLayer(radarLayer)) radarLayer.addTo(map);
      if (!inConus && map.hasLayer(radarLayer)) radarLayer.removeFrom(map);
    }
    statusNote.textContent = inConus ? "Observed NOAA MRMS reflectivity. Forecast precipitation is shown separately." : "Observed NOAA radar currently covers the continental United States; the forecast and graphs remain global.";
    if (inConus) void loadWarnings();
    else warningLayer.clearLayers();
  }

  frameSlider.addEventListener("input", () => { stop(); renderFrame(Number(frameSlider.value)); });
  playButton.addEventListener("click", togglePlay);
  alerts.addEventListener("change", () => showWarnings(alerts.checked));
  window.addEventListener("boho:weather-location", (event) => applyLocation((event as CustomEvent<Location>).detail));
  window.addEventListener("pagehide", stop, { once: true });

  try {
    manifest = await json<RadarManifest>(`${API}/radar/manifest`);
    frameSlider.max = String(Math.max(0, manifest.frames.length - 1));
    index = Math.max(0, manifest.frames.length - 1);
    if (manifest.frames.length) {
      radarLayer = L.tileLayer(tile(manifest.frames[index]), { attribution: manifest.attribution, maxZoom: 15, opacity: .72, updateWhenIdle: false }).addTo(map);
      renderFrame(index);
    }
    applyLocation(location);
    window.setTimeout(() => map.invalidateSize(), 0);
  } catch (error) {
    statusNote.textContent = error instanceof Error ? error.message : "Radar is temporarily unavailable.";
    frameTime.textContent = "Radar unavailable";
    playButton.disabled = true;
    frameSlider.disabled = true;
  }
}
