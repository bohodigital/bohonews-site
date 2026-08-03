import * as L from "leaflet";

const API = "/api/weather/v1";
type Location = { latitude: number; longitude: number; label?: string; countryCode?: string | null };
type RadarManifest = { frames: string[]; tileTemplate: string; attribution: string };
type ForecastFrame = { id: string; startHour: number; endHour: number; label: string };
type ForecastManifest = { frames: ForecastFrame[]; tileTemplate: string; attribution: string; interpretation: string };
type Mode = "observed" | "forecast";

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
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-radar-mode]")];
  const legend = root.querySelector<HTMLElement>("[data-radar-legend]");
  const legendLow = root.querySelector<HTMLElement>("[data-radar-legend-low]");
  const legendHigh = root.querySelector<HTMLElement>("[data-radar-legend-high]");
  if (!mapNode || !slider || !play || !time || !note || !alerts || modeButtons.length !== 2 || !legend || !legendLow || !legendHigh) return;
  const frameSlider = slider;
  const playButton = play;
  const frameTime = time;
  const statusNote = note;
  const warningToggle = alerts;
  const mapLegend = legend;
  const mapLegendLow = legendLow;
  const mapLegendHigh = legendHigh;

  let location: Location = { latitude: 41.9, longitude: -87.65, countryCode: "US" };
  let manifest: RadarManifest | null = null;
  let forecastManifest: ForecastManifest | null = null;
  let weatherLayer: L.TileLayer | null = null;
  let mode: Mode = "observed";
  let index = 0;
  let timer = 0;
  const map = L.map(mapNode, { minZoom: 2, maxZoom: 12, zoomControl: true, attributionControl: true, preferCanvas: true }).setView(
    [location.latitude, location.longitude],
    root.classList.contains("weather-radar--compact") ? 6 : 5
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

  function frames() { return mode === "observed" ? (manifest?.frames || []) : (forecastManifest?.frames || []); }
  function hasConusCoverage() { return location.latitude >= 20 && location.latitude <= 55 && location.longitude >= -130 && location.longitude <= -60; }
  function availableNote() {
    return mode === "observed"
      ? "Observed NOAA MRMS reflectivity. Choose forecast precipitation to look ahead."
      : forecastManifest?.interpretation || "Official NOAA forecast precipitation. This is not observed radar.";
  }
  function tile(frame: string | ForecastFrame) {
    return mode === "observed"
      ? manifest!.tileTemplate.replace("{time}", encodeURIComponent(String(frame)))
      : forecastManifest!.tileTemplate.replace("{frame}", (frame as ForecastFrame).id);
  }
  function layerAttribution() { return mode === "observed" ? manifest!.attribution : forecastManifest!.attribution; }
  function installLayer() {
    if (weatherLayer) weatherLayer.removeFrom(map);
    const items = frames();
    if (!items.length) return;
    weatherLayer = L.tileLayer(tile(items[index]), { attribution: layerAttribution(), maxZoom: mode === "observed" ? 15 : 12, opacity: mode === "observed" ? .72 : .68, updateWhenIdle: false });
    if (hasConusCoverage()) weatherLayer.addTo(map);
  }
  function renderFrame(next: number) {
    const items = frames();
    if (!items.length || !weatherLayer) return;
    index = Math.max(0, Math.min(next, items.length - 1));
    frameSlider.value = String(index);
    const frame = items[index];
    weatherLayer.setUrl(tile(frame), false);
    if (mode === "observed") {
      frameTime.dateTime = String(frame);
      frameTime.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(String(frame)));
    } else {
      frameTime.removeAttribute("datetime");
      frameTime.textContent = `Forecast ${(frame as ForecastFrame).label}`;
    }
  }
  function stop() { window.clearInterval(timer); timer = 0; playButton.textContent = mode === "observed" ? "Play radar" : "Play forecast"; playButton.setAttribute("aria-pressed", "false"); }
  function togglePlay() {
    if (timer) return stop();
    playButton.textContent = mode === "observed" ? "Pause radar" : "Pause forecast"; playButton.setAttribute("aria-pressed", "true");
    timer = window.setInterval(() => renderFrame(index >= frames().length - 1 ? 0 : index + 1), mode === "observed" ? 650 : 950);
  }
  function setMode(next: Mode) {
    if (next === mode) return;
    mode = next; stop(); index = mode === "observed" ? Math.max(0, frames().length - 1) : 0;
    frameSlider.max = String(Math.max(0, frames().length - 1));
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.radarMode === mode)));
    warningToggle.closest("label")?.toggleAttribute("hidden", mode === "forecast");
    if (mode === "observed") {
      mapLegend.setAttribute("aria-label", "Radar reflectivity legend"); mapLegendLow.textContent = "Light"; mapLegendHigh.textContent = "Intense";
      statusNote.textContent = availableNote();
    } else {
      mapLegend.setAttribute("aria-label", "Forecast precipitation amount legend"); mapLegendLow.textContent = "Lower"; mapLegendHigh.textContent = "Higher";
      statusNote.textContent = availableNote();
    }
    installLayer(); renderFrame(index);
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
    map.flyTo([next.latitude, next.longitude], next.countryCode === "US" ? 6 : 4, { duration: .7 });
    const inConus = hasConusCoverage();
    if (weatherLayer) {
      if (inConus && !map.hasLayer(weatherLayer)) weatherLayer.addTo(map);
      if (!inConus && map.hasLayer(weatherLayer)) weatherLayer.removeFrom(map);
    }
    statusNote.textContent = inConus ? availableNote() : "NOAA radar and this forecast-precipitation layer currently cover the continental United States; the forecast and graphs remain global.";
    if (inConus) void loadWarnings();
    else warningLayer.clearLayers();
  }

  frameSlider.addEventListener("input", () => { stop(); renderFrame(Number(frameSlider.value)); });
  playButton.addEventListener("click", togglePlay);
  warningToggle.addEventListener("change", () => showWarnings(warningToggle.checked));
  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.radarMode as Mode)));
  window.addEventListener("boho:weather-location", (event) => applyLocation((event as CustomEvent<Location>).detail));
  window.addEventListener("pagehide", stop, { once: true });

  try {
    [manifest, forecastManifest] = await Promise.all([
      json<RadarManifest>(`${API}/radar/manifest`),
      json<ForecastManifest>(`${API}/forecast/precipitation/manifest`)
    ]);
    frameSlider.max = String(Math.max(0, manifest.frames.length - 1));
    index = Math.max(0, manifest.frames.length - 1);
    if (manifest.frames.length) {
      installLayer();
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
