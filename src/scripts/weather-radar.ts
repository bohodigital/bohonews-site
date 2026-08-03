import * as L from "leaflet";

const API = "/api/weather/v1";
const CLIENT_CONTRACT = "1.3.1";
const OBSERVED_OPACITY = 0.76;
const FORECAST_OPACITY = 0.68;
const CROSSFADE_MS = 280;

type Location = { latitude: number; longitude: number; label?: string; countryCode?: string | null };
type RadarManifest = {
  frames: string[];
  imageTemplate: string;
  attribution: string;
  cadenceSeconds?: number | null;
  historyMinutes?: number | null;
};
type ForecastFrame = { id: string; startHour: number; endHour: number; label: string };
type ForecastManifest = { frames: ForecastFrame[]; imageTemplate: string; attribution: string; interpretation: string };
type Mode = "observed" | "forecast";
type Frame = string | ForecastFrame;
type Surface = { layer: L.ImageOverlay; key: string | null; loading: Promise<void> | null };
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Weather map request failed");
  return payload;
}

function frameKey(frame: Frame) {
  return typeof frame === "string" ? frame : frame.id;
}

function waitForLayer(layer: L.ImageOverlay, timeout = 3500) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallback);
      layer.off("load", finish);
      layer.off("error", finish);
      resolve();
    };
    const fallback = window.setTimeout(finish, timeout);
    layer.once("load", finish);
    layer.once("error", finish);
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
  const timelineLabel = root.querySelector<HTMLElement>(".weather-radar__timeline span")!;
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-radar-mode]")];
  const legend = root.querySelector<HTMLElement>("[data-radar-legend]")!;
  const legendLow = root.querySelector<HTMLElement>("[data-radar-legend-low]")!;
  const legendHigh = root.querySelector<HTMLElement>("[data-radar-legend-high]")!;
  if (!mapNode || !slider || !play || !time || !note || !alerts || !speed || !latest || !state || !age || !timelineLabel || modeButtons.length !== 2 || !legend || !legendLow || !legendHigh) return;

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
  const speedOptions = [520, 300, 180];
  const speedLabels = ["½× speed", "1× speed", "2× speed"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefetched = new Map<string, HTMLImageElement>();

  const map = L.map(mapNode, {
    minZoom: 2,
    maxZoom: 12,
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
    fadeAnimation: true,
    zoomAnimation: true,
    scrollWheelZoom: true,
    wheelDebounceTime: 25,
    wheelPxPerZoomLevel: 90
  }).setView([location.latitude, location.longitude], root.classList.contains("weather-radar--compact") ? 6 : 5);
  L.tileLayer(`${API}/map/base/{z}/{x}/{y}`, { attribution: "USGS The National Map", maxZoom: 16, updateWhenIdle: false, keepBuffer: 4 }).addTo(map);
  map.attributionControl.addAttribution("NOAA / National Weather Service");
  const radarPane = map.createPane("weather-radar-frames");
  radarPane.style.zIndex = "310";
  radarPane.style.pointerEvents = "none";
  const surfaces: Surface[] = [0, 1].map(() => ({
    key: null,
    loading: null,
    layer: L.imageOverlay(TRANSPARENT_PIXEL, map.getBounds(), { pane: "weather-radar-frames", className: "weather-radar-frame", opacity: 0, interactive: false, crossOrigin: true }).addTo(map)
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
    return `${minutes} minutes of observed NOAA MRMS reflectivity, updated about every ${cadence} minutes. Fast buffered playback keeps six upcoming frames ready; crossfaded moments are visual transitions, not additional observations.`;
  }
  function imageRequest(frame: Frame) {
    const rawBounds = map.getBounds();
    const round = (value: number) => Number(value.toFixed(3));
    const bounds = L.latLngBounds(
      [round(Math.max(-85, rawBounds.getSouth())), round(Math.max(-180, rawBounds.getWest()))],
      [round(Math.min(85, rawBounds.getNorth())), round(Math.min(180, rawBounds.getEast()))]
    );
    const size = map.getSize();
    const width = Math.max(64, Math.min(1280, Math.round(size.x / 32) * 32));
    const height = Math.max(64, Math.min(960, Math.round(size.y / 32) * 32));
    const template = mode === "observed" ? manifest!.imageTemplate : forecastManifest!.imageTemplate;
    const base = mode === "observed"
      ? template.replace("{time}", encodeURIComponent(String(frame)))
      : template.replace("{frame}", (frame as ForecastFrame).id);
    const params = new URLSearchParams({
      west: String(bounds.getWest()), south: String(bounds.getSouth()), east: String(bounds.getEast()), north: String(bounds.getNorth()),
      width: String(width), height: String(height)
    });
    const url = `${base}&${params}`;
    return { url, bounds, key: `${frameKey(frame)}:${bounds.toBBoxString()}:${width}x${height}` };
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
    const request = imageRequest(frame);
    const key = request.key;
    if (surface.key === key) {
      if (surface.loading) await surface.loading;
      return;
    }
    surface.key = key;
    surface.layer.setOpacity(0);
    surface.loading = waitForLayer(surface.layer);
    surface.layer.setBounds(request.bounds);
    surface.layer.setUrl(request.url);
    await surface.loading;
    if (surface.key === key) surface.loading = null;
  }
  async function warmAdjacent() {
    const items = frames();
    if (!items.length) return;
    const adjacent = index < items.length - 1 ? index + 1 : 0;
    const key = imageRequest(items[adjacent]).key;
    if (surfaceFor(key) >= 0) return;
    const spare = spareSurface([activeSurface]);
    if (spare >= 0) await loadSurface(spare, items[adjacent]);
  }
  function prefetchAhead(count = 6) {
    const items = frames();
    if (!items.length) return;
    for (let offset = 1; offset <= Math.min(count, items.length - 1); offset += 1) {
      const frame = items[(index + offset) % items.length];
      const request = imageRequest(frame);
      if (surfaceFor(request.key) >= 0 || prefetched.has(request.key)) continue;
      const image = new Image();
      image.decoding = "async";
      image.src = request.url;
      prefetched.set(request.key, image);
      const discard = () => window.setTimeout(() => prefetched.delete(request.key), 30000);
      image.addEventListener("load", discard, { once: true });
      image.addEventListener("error", discard, { once: true });
    }
    while (prefetched.size > 12) prefetched.delete(prefetched.keys().next().value!);
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

    const key = imageRequest(items[index]).key;
    let incoming = surfaceFor(key);
    if (incoming < 0) incoming = spareSurface([activeSurface]);
    if (incoming < 0) incoming = (activeSurface + 1) % surfaces.length;
    await loadSurface(incoming, items[index]);
    if (request !== renderToken) return;

    const outgoing = activeSurface;
    const duration = immediate || reducedMotion.matches ? 0 : CROSSFADE_MS;
    root.style.setProperty("--radar-fade-duration", `${duration}ms`);
    surfaces[incoming].layer.bringToFront();
    surfaces[incoming].layer.setOpacity(targetOpacity());
    if (incoming !== outgoing) surfaces[outgoing].layer.setOpacity(0);
    activeSurface = incoming;
    state.textContent = mode === "observed" ? "Observed" : "Forecast";
    root.dataset.radarLoading = "false";
    if (request === renderToken) {
      void warmAdjacent();
      prefetchAhead();
    }
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
      if (index >= items.length - 1) {
        stop();
        return;
      }
      const next = index + 1;
      await renderFrame(next);
      if (next >= items.length - 1) {
        stop();
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, speedOptions[speedIndex]));
    }
  }
  async function startPlayback(token: number) {
    if (index >= frames().length - 1) await renderFrame(0, true);
    if (playing && token === playToken) await playLoop(token);
  }
  function togglePlay() {
    if (playing) return stop();
    playing = true;
    playToken += 1;
    play.textContent = mode === "observed" ? "Pause radar" : "Pause forecast";
    play.setAttribute("aria-pressed", "true");
    void startPlayback(playToken);
  }
  function syncModeControls() {
    const observed = mode === "observed";
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.radarMode === mode)));
    alerts.closest("label")?.toggleAttribute("hidden", !observed);
    latest.toggleAttribute("hidden", !observed);
    play.textContent = observed ? "Play radar" : "Play forecast";
    timelineLabel.textContent = observed ? "Live radar timeline" : "Forecast accumulation timeline";
    slider.setAttribute("aria-label", observed ? "Live precipitation radar frame" : "Forecast accumulation frame");
    legend.setAttribute("aria-label", observed ? "Radar reflectivity legend" : "Forecast precipitation amount legend");
    legendLow.textContent = observed ? "Light" : "Lower";
    legendHigh.textContent = observed ? "Intense" : "Higher";
  }
  async function setMode(next: Mode) {
    if (next === mode) return;
    stop();
    mode = next;
    index = mode === "observed" ? Math.max(0, frames().length - 1) : 0;
    slider.max = String(Math.max(0, frames().length - 1));
    syncModeControls();
    showWarnings(mode === "observed" && alerts.checked);
    if (mode === "observed") void loadWarnings();
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
    if (inConus && mode === "observed") void loadWarnings();
    else warningLayer.clearLayers();
  }

  slider.addEventListener("input", () => { stop(); void renderFrame(Number(slider.value)); });
  play.addEventListener("click", togglePlay);
  speed.addEventListener("click", () => {
    speedIndex = (speedIndex + 1) % speedOptions.length;
    speed.textContent = speedLabels[speedIndex];
  });
  latest.addEventListener("click", () => { stop(); void renderFrame(frames().length - 1); });
  alerts.addEventListener("change", () => showWarnings(mode === "observed" && alerts.checked));
  modeButtons.forEach((button) => button.addEventListener("click", () => void setMode(button.dataset.radarMode as Mode)));
  window.addEventListener("boho:weather-location", (event) => applyLocation((event as CustomEvent<Location>).detail));
  let viewportTimer = 0;
  map.on("moveend resize", () => {
    window.clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => {
      prefetched.clear();
      surfaces.forEach((surface) => { surface.key = null; surface.loading = null; });
      void renderFrame(index, true);
    }, 120);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  window.addEventListener("pagehide", stop, { once: true });

  try {
    [manifest, forecastManifest] = await Promise.all([
      json<RadarManifest>(`${API}/radar/manifest?client=${CLIENT_CONTRACT}`),
      json<ForecastManifest>(`${API}/forecast/precipitation/manifest?client=${CLIENT_CONTRACT}`)
    ]);
    slider.max = String(Math.max(0, frames().length - 1));
    index = Math.max(0, frames().length - 1);
    syncModeControls();
    showWarnings(alerts.checked);
    note.textContent = availableNote();
    if (frames().length) await renderFrame(index, true);
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
