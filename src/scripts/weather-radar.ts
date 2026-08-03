import * as L from "leaflet";

const API = "/api/weather/v1";
const OBSERVED_OPACITY = 0.76;
const FORECAST_OPACITY = 0.68;
const CROSSFADE_MS = 420;

type Location = { latitude: number; longitude: number; label?: string; countryCode?: string | null };
type RadarManifest = {
  frames: string[];
  tileTemplate: string;
  attribution: string;
  cadenceSeconds?: number | null;
  historyMinutes?: number | null;
};
type ForecastFrame = { id: string; startHour: number; endHour: number; label: string };
type ForecastManifest = { frames: ForecastFrame[]; tileTemplate: string; attribution: string; interpretation: string };
type Mode = "observed" | "forecast";
type Frame = string | ForecastFrame;
type Surface = { layer: L.TileLayer; key: string | null; loading: Promise<void> | null };

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Weather map request failed");
  return payload;
}

function frameKey(frame: Frame) {
  return typeof frame === "string" ? frame : frame.id;
}

function waitForLayer(layer: L.TileLayer, timeout = 1200) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallback);
      layer.off("load", finish);
      resolve();
    };
    const fallback = window.setTimeout(finish, timeout);
    layer.once("load", finish);
  });
}

export async function initWeatherRadar(root: HTMLElement) {
  const mapNode = root.querySelector<HTMLElement>("[data-radar-map]")!;
  const slider = root.querySelector<HTMLInputElement>("[data-radar-frame]")!;
  const play = root.querySelector<HTMLButtonElement>("[data-radar-play]")!;
  const time = root.querySelector<HTMLTimeElement>("[data-radar-time]")!;
  const note = root.querySelector<HTMLElement>("[data-radar-note]")!;
  const alerts = root.querySelector<HTMLInputElement>("[data-radar-alerts]")!;
  const speed = root.querySelector<HTMLButtonElement>("[data-radar-speed]")!;
  const latest = root.querySelector<HTMLButtonElement>("[data-radar-latest]")!;
  const state = root.querySelector<HTMLElement>("[data-radar-state]")!;
  const age = root.querySelector<HTMLElement>("[data-radar-age]")!;
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-radar-mode]")];
  const legend = root.querySelector<HTMLElement>("[data-radar-legend]")!;
  const legendLow = root.querySelector<HTMLElement>("[data-radar-legend-low]")!;
  const legendHigh = root.querySelector<HTMLElement>("[data-radar-legend-high]")!;
  if (!mapNode || !slider || !play || !time || !note || !alerts || !speed || !latest || !state || !age || modeButtons.length !== 2 || !legend || !legendLow || !legendHigh) return;

  let location: Location = { latitude: 41.9, longitude: -87.65, countryCode: "US" };
  let manifest: RadarManifest | null = null;
  let forecastManifest: ForecastManifest | null = null;
  let mode: Mode = "observed";
  let index = 0;
  let activeSurface = 0;
  let playToken = 0;
  let renderToken = 0;
  let speedIndex = 1;
  let playing = false;
  const speedOptions = [1000, 650, 360];
  const speedLabels = ["½× speed", "1× speed", "2× speed"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const map = L.map(mapNode, {
    minZoom: 2,
    maxZoom: 12,
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
    fadeAnimation: true,
    zoomAnimation: false,
    scrollWheelZoom: false
  }).setView([location.latitude, location.longitude], root.classList.contains("weather-radar--compact") ? 6 : 5);
  L.tileLayer(`${API}/map/base/{z}/{x}/{y}`, { attribution: "USGS The National Map", maxZoom: 16, updateWhenIdle: false, keepBuffer: 4 }).addTo(map);
  ["weather-radar-a", "weather-radar-b", "weather-radar-c"].forEach((name, position) => {
    const pane = map.createPane(name);
    pane.style.zIndex = String(310 + position);
    pane.style.pointerEvents = "none";
  });
  const surfaces: Surface[] = ["weather-radar-a", "weather-radar-b", "weather-radar-c"].map((pane) => ({
    key: null,
    loading: null,
    layer: L.tileLayer("", { pane, attribution: "NOAA / National Weather Service", maxZoom: 15, opacity: 0, updateWhenIdle: false, updateWhenZooming: false, keepBuffer: 4, crossOrigin: true }).addTo(map)
  }));
  const warningLayer = L.geoJSON(undefined, {
    pane: "overlayPane",
    style: (feature) => ({
      color: "#9f1717",
      fillColor: feature?.properties?.severity === "Extreme" ? "#7f1d1d" : feature?.properties?.severity === "Severe" ? "#d62f2f" : "#f0aa34",
      fillOpacity: 0.2,
      weight: 2.5
    })
  }).addTo(map);

  function frames(): Frame[] {
    return mode === "observed" ? (manifest?.frames || []) : (forecastManifest?.frames || []);
  }
  function hasConusCoverage() {
    return location.latitude >= 20 && location.latitude <= 55 && location.longitude >= -130 && location.longitude <= -60;
  }
  function availableNote() {
    if (mode === "forecast") return forecastManifest?.interpretation || "Official NOAA forecast precipitation. This is not observed radar.";
    const minutes = manifest?.historyMinutes ? Math.round(manifest.historyMinutes) : 120;
    const cadence = manifest?.cadenceSeconds ? Math.round(manifest.cadenceSeconds / 60) : 2;
    return `${minutes} minutes of observed NOAA MRMS reflectivity, updated about every ${cadence} minutes. Frames are crossfaded for smooth playback; blended moments are visual transitions, not additional observations.`;
  }
  function tile(frame: Frame) {
    return mode === "observed"
      ? manifest!.tileTemplate.replace("{time}", encodeURIComponent(String(frame)))
      : forecastManifest!.tileTemplate.replace("{frame}", (frame as ForecastFrame).id);
  }
  function attribution() {
    return mode === "observed" ? manifest!.attribution : forecastManifest!.attribution;
  }
  function targetOpacity() {
    return mode === "observed" ? OBSERVED_OPACITY : FORECAST_OPACITY;
  }
  function labelFrame(frame: Frame) {
    if (mode === "forecast") return `Forecast ${(frame as ForecastFrame).label}`;
    return new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(String(frame)));
  }
  function updateFrameText(frame: Frame) {
    const label = labelFrame(frame);
    if (mode === "observed") {
      time.dateTime = String(frame);
      const minutesOld = Math.max(0, Math.round((Date.now() - new Date(String(frame)).getTime()) / 60000));
      age.textContent = index === frames().length - 1 ? `${minutesOld <= 2 ? "Latest" : `${minutesOld} min ago`}` : `${minutesOld} min ago`;
    } else {
      time.removeAttribute("datetime");
      age.textContent = "NOAA WPC outlook";
    }
    time.textContent = label;
    slider.setAttribute("aria-valuetext", label);
  }
  function surfaceFor(key: string) {
    return surfaces.findIndex((surface) => surface.key === key);
  }
  function spareSurface(excluding: number[] = []) {
    const idle = surfaces.findIndex((surface, position) => !excluding.includes(position) && !surface.loading);
    return idle >= 0 ? idle : surfaces.findIndex((_, position) => !excluding.includes(position));
  }
  async function loadSurface(position: number, frame: Frame) {
    const surface = surfaces[position];
    const key = frameKey(frame);
    if (surface.key === key) {
      if (surface.loading) await surface.loading;
      return;
    }
    const url = tile(frame);
    surface.key = key;
    surface.layer.setOpacity(0);
    surface.layer.options.attribution = attribution();
    surface.loading = waitForLayer(surface.layer);
    surface.layer.setUrl(url, false);
    await surface.loading;
    if (surface.key === key) surface.loading = null;
  }
  async function warmAdjacent() {
    const items = frames();
    if (!items.length) return;
    const adjacent = index < items.length - 1 ? index + 1 : 0;
    const key = frameKey(items[adjacent]);
    if (surfaceFor(key) >= 0) return;
    const spare = spareSurface([activeSurface]);
    if (spare >= 0) await loadSurface(spare, items[adjacent]);
  }
  async function renderFrame(next: number, immediate = false) {
    const items = frames();
    if (!items.length) return;
    const request = ++renderToken;
    index = Math.max(0, Math.min(next, items.length - 1));
    slider.value = String(index);
    updateFrameText(items[index]);
    state.textContent = "Loading";
    root.dataset.radarLoading = "true";

    const key = frameKey(items[index]);
    let incoming = surfaceFor(key);
    if (incoming < 0) incoming = spareSurface([activeSurface]);
    if (incoming < 0) incoming = (activeSurface + 1) % surfaces.length;
    await loadSurface(incoming, items[index]);
    if (request !== renderToken) return;

    const outgoing = activeSurface;
    const duration = immediate || reducedMotion.matches ? 0 : CROSSFADE_MS;
    root.style.setProperty("--radar-fade-duration", `${duration}ms`);
    surfaces[incoming].layer.setOpacity(targetOpacity());
    if (incoming !== outgoing) surfaces[outgoing].layer.setOpacity(0);
    activeSurface = incoming;
    state.textContent = mode === "observed" ? "Observed" : "Forecast";
    root.dataset.radarLoading = "false";
    if (duration) await new Promise((resolve) => window.setTimeout(resolve, duration));
    if (request === renderToken) void warmAdjacent();
  }
  function stop() {
    playing = false;
    playToken += 1;
    play.textContent = mode === "observed" ? "Play radar" : "Play forecast";
    play.setAttribute("aria-pressed", "false");
  }
  async function playLoop(token: number) {
    while (playing && token === playToken) {
      const items = frames();
      const isLast = index >= items.length - 1;
      const next = isLast ? 0 : index + 1;
      if (isLast) await new Promise((resolve) => window.setTimeout(resolve, 850));
      if (!playing || token !== playToken) return;
      await renderFrame(next);
      await new Promise((resolve) => window.setTimeout(resolve, speedOptions[speedIndex]));
    }
  }
  function togglePlay() {
    if (playing) return stop();
    playing = true;
    playToken += 1;
    play.textContent = mode === "observed" ? "Pause radar" : "Pause forecast";
    play.setAttribute("aria-pressed", "true");
    void playLoop(playToken);
  }
  async function setMode(next: Mode) {
    if (next === mode) return;
    stop();
    mode = next;
    index = mode === "observed" ? Math.max(0, frames().length - 1) : 0;
    slider.max = String(Math.max(0, frames().length - 1));
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.radarMode === mode)));
    alerts.closest("label")?.toggleAttribute("hidden", mode === "forecast");
    latest.toggleAttribute("hidden", mode === "forecast");
    if (mode === "observed") {
      legend.setAttribute("aria-label", "Radar reflectivity legend");
      legendLow.textContent = "Light";
      legendHigh.textContent = "Intense";
    } else {
      legend.setAttribute("aria-label", "Forecast precipitation amount legend");
      legendLow.textContent = "Lower";
      legendHigh.textContent = "Higher";
    }
    note.textContent = availableNote();
    surfaces.forEach((surface) => { surface.key = null; surface.loading = null; surface.layer.setOpacity(0); });
    await renderFrame(index, true);
  }
  async function loadWarnings() {
    try {
      const collection = await json<GeoJSON.GeoJsonObject>(`${API}/warnings?lat=${location.latitude}&lon=${location.longitude}`);
      warningLayer.clearLayers().addData(collection);
    } catch {
      note.textContent = "Radar is live; warning polygons are temporarily unavailable.";
    }
  }
  function showWarnings(show: boolean) {
    if (show && !map.hasLayer(warningLayer)) warningLayer.addTo(map);
    if (!show && map.hasLayer(warningLayer)) warningLayer.removeFrom(map);
  }
  function applyLocation(next: Location) {
    location = next;
    map.setView([next.latitude, next.longitude], next.countryCode === "US" ? 6 : 4, { animate: false });
    const inConus = hasConusCoverage();
    surfaces.forEach(({ layer }) => {
      if (inConus && !map.hasLayer(layer)) layer.addTo(map);
      if (!inConus && map.hasLayer(layer)) layer.removeFrom(map);
    });
    note.textContent = inConus ? availableNote() : "NOAA radar and this forecast-precipitation layer currently cover the continental United States; the forecast and graphs remain global.";
    if (inConus) void loadWarnings();
    else warningLayer.clearLayers();
  }

  slider.addEventListener("input", () => { stop(); void renderFrame(Number(slider.value)); });
  play.addEventListener("click", togglePlay);
  speed.addEventListener("click", () => {
    speedIndex = (speedIndex + 1) % speedOptions.length;
    speed.textContent = speedLabels[speedIndex];
  });
  latest.addEventListener("click", () => { stop(); void renderFrame(frames().length - 1); });
  alerts.addEventListener("change", () => showWarnings(alerts.checked));
  modeButtons.forEach((button) => button.addEventListener("click", () => void setMode(button.dataset.radarMode as Mode)));
  window.addEventListener("boho:weather-location", (event) => applyLocation((event as CustomEvent<Location>).detail));
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  window.addEventListener("pagehide", stop, { once: true });

  try {
    [manifest, forecastManifest] = await Promise.all([
      json<RadarManifest>(`${API}/radar/manifest`),
      json<ForecastManifest>(`${API}/forecast/precipitation/manifest`)
    ]);
    slider.max = String(Math.max(0, manifest.frames.length - 1));
    index = Math.max(0, manifest.frames.length - 1);
    note.textContent = availableNote();
    if (manifest.frames.length) await renderFrame(index, true);
    applyLocation(location);
    window.setTimeout(() => map.invalidateSize(), 0);
  } catch (error) {
    note.textContent = error instanceof Error ? error.message : "Radar is temporarily unavailable.";
    time.textContent = "Radar unavailable";
    state.textContent = "Unavailable";
    play.disabled = true;
    slider.disabled = true;
    speed.disabled = true;
    latest.disabled = true;
  }
}
