(() => {
  const API = "/api/weather/v1";
  const storedUnits = localStorage.getItem("bohonews-weather-units");
  const state = { units: storedUnits === "F" ? "F" : "C", forecast: null, cursor: 0, chartCursors: [] };
  const el = (id) => document.getElementById(id);
  const clear = (root) => { while (root.firstChild) root.firstChild.remove(); };
  const node = (tag, className, text) => { const value = document.createElement(tag); if (className) value.className = className; if (text !== undefined) value.textContent = text; return value; };
  const time = (value, options) => value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : "—";
  const number = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const cToDisplay = (value) => value === null ? null : state.units === "F" ? value * 9 / 5 + 32 : value;
  const mmToDisplay = (value) => value === null ? null : state.units === "F" ? value / 25.4 : value;
  const msToDisplay = (value) => value === null ? null : state.units === "F" ? value * 2.23694 : value * 3.6;
  const valueOrDash = (value, formatter) => value === null ? "—" : formatter(value);
  async function get(path) { const response = await fetch(path, { headers: { Accept: "application/json" } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message || "Weather request failed"); return payload; }
  const svgNode = (tag, attrs = {}) => { const value = document.createElementNS("http://www.w3.org/2000/svg", tag); Object.entries(attrs).forEach(([key, item]) => value.setAttribute(key, String(item))); return value; };

  function chart(id, series, label, options = {}) {
    const root = el(id); clear(root); const width = 760, height = 250, left = 48, right = 16, top = 24, bottom = 34;
    const values = series.flatMap((item) => item.values).filter((value) => value !== null);
    if (!values.length) return root.append(node("p", "weather-chart__empty", "This source does not publish this diagnostic."));
    const rawMin = options.zeroBaseline ? 0 : Math.min(...values); const rawMax = Math.max(rawMin + .1, ...values); const padding = options.zeroBaseline ? 0 : Math.max((rawMax - rawMin) * .1, .5);
    const min = options.fixedMin ?? rawMin - padding; const max = options.fixedMax ?? rawMax + padding;
    const firstMs = new Date(series[0].times[0]).getTime(); const lastMs = new Date(series[0].times[series[0].times.length - 1]).getTime();
    const x = (i) => left + (new Date(series[0].times[i]).getTime() - firstMs) * (width - left - right) / Math.max(1, lastMs - firstMs); const y = (v) => top + (max - v) * (height - top - bottom) / (max - min);
    const svg = svgNode("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label, preserveAspectRatio: "none" }); const title = svgNode("title"); title.textContent = label; svg.append(title);
    [0, .5, 1].forEach((step) => { const value = max - (max - min) * step; const py = y(value); svg.append(svgNode("line", { x1: left, x2: width - right, y1: py, y2: py, class: "weather-chart__grid" })); const text = svgNode("text", { x: left - 8, y: py + 4, "text-anchor": "end", class: "weather-chart__axis" }); text.textContent = `${Math.round(value * 10) / 10}`; svg.append(text); });
    series[0].times.forEach((stamp, index, times) => { const day = new Date(stamp).toDateString(); if (index && new Date(times[index - 1]).toDateString() === day) return; const text = svgNode("text", { x: x(index), y: height - 8, class: "weather-chart__axis", "text-anchor": index ? "middle" : "start" }); text.textContent = time(stamp, { weekday: "short" }); svg.append(text); });
    series.forEach((item, seriesIndex) => {
      let run = [];
      const flush = () => { if (run.length) svg.append(svgNode("polyline", { points: run.join(" "), class: `nerd-chart__line nerd-chart__line--${seriesIndex + 1}` })); run = []; };
      item.values.forEach((value, index) => { if (value === null) return flush(); run.push(`${x(index)},${y(value)}`); }); flush();
    });
    const cursorLine = svgNode("line", { y1: top, y2: height - bottom, class: "nerd-chart__cursor", "aria-hidden": "true" }); svg.append(cursorLine);
    const points = series.map((_, index) => { const point = svgNode("circle", { r: 4, class: `nerd-chart__point nerd-chart__point--${index + 1}`, "aria-hidden": "true" }); svg.append(point); return point; });
    state.chartCursors.push((index) => { const px = x(index); cursorLine.setAttribute("x1", px); cursorLine.setAttribute("x2", px); series.forEach((item, seriesIndex) => { const value = item.values[index]; points[seriesIndex].toggleAttribute("hidden", value === null); if (value !== null) { points[seriesIndex].setAttribute("cx", px); points[seriesIndex].setAttribute("cy", y(value)); } }); });
    const legend = node("div", "nerd-chart__legend"); series.forEach((item, index) => { const entry = node("span", `nerd-chart__key nerd-chart__key--${index + 1}`, `${item.name} (${item.unit})`); legend.append(entry); }); root.append(svg, legend);
  }

  function metric(label, value, note) { const card = node("article", "nerd-kpi"); card.append(node("p", "eyebrow", label), node("strong", "", value), node("small", "", note)); return card; }
  function detail(root, label, value) { const item = node("div", "nerd-time-detail"); item.append(node("dt", "", label), node("dd", "", value)); root.append(item); }
  function renderCursor() {
    const periods = state.forecast?.hourly || []; if (!periods.length) return;
    state.cursor = Math.max(0, Math.min(state.cursor, periods.length - 1)); const item = periods[state.cursor];
    const slider = el("nerd-time-slider"); slider.max = String(periods.length - 1); slider.value = String(state.cursor); slider.disabled = false;
    el("nerd-time-label").textContent = time(item.startTime, { weekday: "long", month: "short", day: "numeric", hour: "numeric", timeZoneName: "short" });
    const root = el("nerd-time-details"); clear(root);
    detail(root, "Temperature", valueOrDash(cToDisplay(number(item.temperature?.value)), (value) => `${Math.round(value)}°${state.units}`));
    detail(root, "Dew point", valueOrDash(cToDisplay(number(item.dewPoint?.value)), (value) => `${Math.round(value)}°${state.units}`));
    detail(root, "Precip. chance", valueOrDash(number(item.precipitationProbability), (value) => `${Math.round(value)}%`));
    detail(root, "Expected precip.", valueOrDash(mmToDisplay(number(item.precipitationAmount?.value)), (value) => `${value.toFixed(state.units === "F" ? 2 : 1)} ${state.units === "F" ? "in" : "mm"}`));
    detail(root, "Humidity", valueOrDash(number(item.humidity), (value) => `${Math.round(value)}%`));
    detail(root, "Cloud cover", valueOrDash(number(item.cloudCover), (value) => `${Math.round(value)}%`));
    detail(root, "Wind", valueOrDash(msToDisplay(number(item.windSpeed?.value)), (value) => `${Math.round(value)} ${state.units === "F" ? "mph" : "km/h"}`));
    detail(root, "Pressure", valueOrDash(number(item.atmosphericPressure?.value), (value) => `${Math.round(value / 100)} hPa`));
    state.chartCursors.forEach((update) => update(state.cursor));
  }

  function render() {
    const forecast = state.forecast; if (!forecast) return; const periods = forecast.hourly;
    el("nerd-unit-toggle").textContent = state.units === "C" ? "Show °F / imperial" : "Show °C / metric";
    el("nerd-location-title").textContent = forecast.location.label;
    el("nerd-status").textContent = `${forecast.location.precision} coordinates · ${periods.length} forecast periods · generated ${time(forecast.generatedAt, { dateStyle: "medium", timeStyle: "short" })}`;
    const kpis = el("nerd-kpis"); clear(kpis); kpis.setAttribute("aria-busy", "false"); const precipTotal = periods.slice(0, 24).reduce((sum, item) => sum + (number(item.precipitationAmount?.value) || 0), 0); const peakChance = Math.max(0, ...periods.slice(0, 24).map((item) => number(item.precipitationProbability) || 0));
    const spanDays = periods.length > 1 ? (new Date(periods[periods.length - 1].endTime).getTime() - new Date(periods[0].startTime).getTime()) / 86400000 : 0; const currentTemperature = cToDisplay(number(forecast.current?.temperature?.value));
    kpis.append(metric("Current", valueOrDash(currentTemperature, (value) => `${Math.round(value)}°${state.units}`), forecast.current?.summary || "Unavailable"), metric("24h precip.", `${mmToDisplay(precipTotal).toFixed(state.units === "F" ? 2 : 1)} ${state.units === "F" ? "in" : "mm"}`, `Peak chance ${Math.round(peakChance)}%`), metric("Active alerts", String(forecast.alerts.length), forecast.alerts.length ? forecast.alerts[0].event : "None at this point"), metric("Forecast span", `${Math.max(1, Math.round(spanDays))} days`, forecast.provenance[0]?.sourceName || "Source unavailable"));
    const times = periods.map((item) => item.startTime); state.chartCursors = [];
    chart("nerd-thermal-chart", [{ name: "Temperature", unit: `°${state.units}`, times, values: periods.map((item) => cToDisplay(number(item.temperature?.value))) }, { name: "Dew point", unit: `°${state.units}`, times, values: periods.map((item) => cToDisplay(number(item.dewPoint?.value))) }], "Full-range temperature and dew-point forecast");
    chart("nerd-precip-chance-chart", [{ name: "Chance", unit: "%", times, values: periods.map((item) => number(item.precipitationProbability)) }], "Full-range precipitation probability forecast", { zeroBaseline: true, fixedMin: 0, fixedMax: 100 });
    chart("nerd-precip-amount-chart", [{ name: "Expected amount", unit: state.units === "F" ? "in" : "mm", times, values: periods.map((item) => mmToDisplay(number(item.precipitationAmount?.value))) }], "Full-range expected precipitation amount forecast", { zeroBaseline: true });
    chart("nerd-moisture-chart", [{ name: "Humidity", unit: "%", times, values: periods.map((item) => number(item.humidity)) }, { name: "Cloud cover", unit: "%", times, values: periods.map((item) => number(item.cloudCover)) }], "Full-range humidity and cloud-cover forecast", { fixedMin: 0, fixedMax: 100 });
    chart("nerd-wind-chart", [{ name: "Wind", unit: state.units === "F" ? "mph" : "km/h", times, values: periods.map((item) => msToDisplay(number(item.windSpeed?.value))) }], "Full-range sustained wind-speed forecast", { zeroBaseline: true });
    chart("nerd-pressure-chart", [{ name: "Pressure", unit: "hPa", times, values: periods.map((item) => { const value = number(item.atmosphericPressure?.value); return value === null ? null : value / 100; }) }], "Full-range mean sea-level pressure forecast");
    renderCursor();
    el("nerd-source").textContent = forecast.provenance.map((item) => `${item.attribution} · fetched ${time(item.fetchedAt, { dateStyle: "medium", timeStyle: "short" })}`).join("; ");
    window.dispatchEvent(new CustomEvent("boho:weather-location", { detail: forecast.location }));
  }

  async function load(location) {
    el("nerd-status").textContent = "Loading forecast diagnostics…"; el("nerd-kpis").setAttribute("aria-busy", "true");
    const params = new URLSearchParams({ lat: location.latitude, lon: location.longitude, precision: location.precision || "selected", contract: "1.2.0" }); if (location.countryCode) params.set("country", location.countryCode); if (location.label) params.set("label", location.label);
    try { state.forecast = await get(`${API}/forecast?${params}`); state.cursor = 0; render(); } catch (error) { el("nerd-status").textContent = error instanceof Error ? error.message : "Forecast diagnostics are temporarily unavailable."; el("nerd-kpis").setAttribute("aria-busy", "false"); }
  }
  el("nerd-time-slider").addEventListener("input", (event) => { state.cursor = Number(event.currentTarget.value); renderCursor(); });
  el("nerd-unit-toggle").addEventListener("click", () => { state.units = state.units === "C" ? "F" : "C"; localStorage.setItem("bohonews-weather-units", state.units); render(); });
  el("nerd-search").addEventListener("submit", async (event) => { event.preventDefault(); const root = el("nerd-results"); clear(root); const query = el("nerd-query").value.trim(); if (!query) return; try { const payload = await get(`${API}/locations/search?q=${encodeURIComponent(query)}`); payload.results.forEach((place) => { const button = node("button", "", `${place.name}, ${place.region || place.countryCode}`); button.type = "button"; button.addEventListener("click", () => { clear(root); void load({ ...place, label: `${place.name}, ${place.region || place.countryCode}`, precision: "selected" }); }); root.append(button); }); if (!payload.results.length) root.append(node("p", "", "No matching preview locations.")); } catch (error) { root.append(node("p", "", error instanceof Error ? error.message : "Location search is temporarily unavailable.")); } });
  (async () => { try { const result = await get(`${API}/context`); await load({ ...result.location, label: [result.location.city, result.location.regionCode || result.location.region].filter(Boolean).join(", ") }); } catch (error) { el("nerd-status").textContent = error instanceof Error ? error.message : "Weather context is temporarily unavailable."; el("nerd-kpis").setAttribute("aria-busy", "false"); } })();
})();
