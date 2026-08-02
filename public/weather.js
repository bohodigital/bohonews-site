(() => {
  const API = "/api/weather/v1";
  const state = { units: localStorage.getItem("bohonews-weather-units") || "C", forecast: null };
  const el = (id) => document.getElementById(id);
  const clear = (node) => { while (node.firstChild) node.firstChild.remove(); };
  const node = (tag, className, text) => { const value = document.createElement(tag); if (className) value.className = className; if (text !== undefined) value.textContent = text; return value; };
  const date = (value, options) => value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : "—";
  const temp = (value) => {
    if (!value || !Number.isFinite(Number(value.value))) return "—";
    const celsius = value.unit === "C" ? Number(value.value) : (Number(value.value) - 32) * 5 / 9;
    return `${Math.round(state.units === "F" ? celsius * 9 / 5 + 32 : celsius)}°${state.units}`;
  };
  const speed = (value) => {
    if (!value || !Number.isFinite(Number(value.value))) return "—";
    const meters = value.unit === "m/s" ? Number(value.value) : Number(value.value) * .44704;
    return state.units === "F" ? `${Math.round(meters * 2.23694)} mph` : `${Math.round(meters * 3.6)} km/h`;
  };
  const amount = (value) => {
    if (!value || !Number.isFinite(Number(value.value))) return null;
    const mm = value.unit === "mm" ? Number(value.value) : Number(value.value);
    return state.units === "F" ? mm / 25.4 : mm;
  };
  const svgNode = (tag, attrs = {}) => { const value = document.createElementNS("http://www.w3.org/2000/svg", tag); Object.entries(attrs).forEach(([key, item]) => value.setAttribute(key, String(item))); return value; };
  function drawChart(rootId, values, options) {
    const root = el(rootId); clear(root);
    const width = 720, height = 220, left = 45, right = 14, top = 18, bottom = 35;
    const usable = values.filter((item) => Number.isFinite(item.value));
    if (!usable.length) { root.append(node("p", "weather-chart__empty", "This source does not publish this measurement.")); return; }
    const minRaw = options.zero ? 0 : Math.min(...usable.map((item) => item.value));
    const maxRaw = Math.max(...usable.map((item) => item.value));
    const padding = options.zero ? 0 : Math.max(1, (maxRaw - minRaw) * .15);
    const min = options.zero ? 0 : Math.floor(minRaw - padding);
    const max = Math.max(min + 1, options.ceiling || 0, Math.ceil(maxRaw + padding));
    const x = (index) => left + index * (width - left - right) / Math.max(1, values.length - 1);
    const y = (value) => top + (max - value) * (height - top - bottom) / (max - min);
    const svg = svgNode("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": options.label, preserveAspectRatio: "none" });
    const title = svgNode("title"); title.textContent = options.label; svg.append(title);
    [0, .5, 1].forEach((step) => {
      const value = max - (max - min) * step; const py = y(value);
      svg.append(svgNode("line", { x1: left, x2: width - right, y1: py, y2: py, class: "weather-chart__grid" }));
      const label = svgNode("text", { x: left - 7, y: py + 4, "text-anchor": "end", class: "weather-chart__axis" }); label.textContent = `${Math.round(value * 10) / 10}${options.unit}`; svg.append(label);
    });
    values.forEach((item, index) => {
      if (index % 6 !== 0) return;
      const label = svgNode("text", { x: x(index), y: height - 9, "text-anchor": index === 0 ? "start" : "middle", class: "weather-chart__axis" }); label.textContent = date(item.time, { hour: "numeric" }); svg.append(label);
    });
    if (options.bars) {
      const barWidth = Math.max(2, (width - left - right) / values.length - 2);
      values.forEach((item, index) => { if (Number.isFinite(item.value)) svg.append(svgNode("rect", { x: x(index) - barWidth / 2, y: y(item.value), width: barWidth, height: Math.max(1, y(0) - y(item.value)), rx: 2, class: options.className })); });
    } else {
      const points = values.map((item, index) => Number.isFinite(item.value) ? `${x(index)},${y(item.value)}` : null).filter(Boolean).join(" ");
      svg.append(svgNode("polyline", { points, class: options.className }));
      usable.forEach((item) => svg.append(svgNode("circle", { cx: x(item.index), cy: y(item.value), r: 3, class: `${options.className} weather-chart__point` })));
    }
    root.append(svg);
  }
  function renderCharts(periods) {
    const hours = periods.slice(0, 24);
    const temperature = hours.map((period, index) => ({ index, time: period.startTime, value: Number(period.temperature.value) * (state.units === "F" ? 9 / 5 : 1) + (state.units === "F" ? 32 : 0) }));
    const chance = hours.map((period, index) => ({ index, time: period.startTime, value: period.precipitationProbability !== null && period.precipitationProbability !== undefined && Number.isFinite(Number(period.precipitationProbability)) ? Number(period.precipitationProbability) : null }));
    const amounts = hours.map((period, index) => ({ index, time: period.startTime, value: amount(period.precipitationAmount) }));
    drawChart("weather-temp-chart", temperature, { label: `Hourly temperature in degrees ${state.units}`, unit: `°${state.units}`, className: "weather-chart__temperature" });
    drawChart("weather-chance-chart", chance, { label: "Hourly probability of precipitation in percent", unit: "%", zero: true, ceiling: 100, bars: true, className: "weather-chart__chance" });
    drawChart("weather-amount-chart", amounts, { label: `Expected hourly precipitation in ${state.units === "F" ? "inches" : "millimeters"}`, unit: state.units === "F" ? "in" : "mm", zero: true, bars: true, className: "weather-chart__amount" });
    const temps = temperature.map((item) => item.value).filter(Number.isFinite);
    el("weather-temp-summary").textContent = `${Math.round(Math.min(...temps))}° to ${Math.round(Math.max(...temps))}°${state.units}`;
    const chances = chance.map((item) => item.value).filter(Number.isFinite); el("weather-chance-summary").textContent = chances.length ? `Peak ${Math.round(Math.max(...chances))}%` : "Not published";
    const total = amounts.map((item) => item.value).filter(Number.isFinite).reduce((sum, value) => sum + value, 0); el("weather-amount-summary").textContent = amounts.some((item) => Number.isFinite(item.value)) ? `${total.toFixed(state.units === "F" ? 2 : 1)} ${state.units === "F" ? "in" : "mm"} total` : "Not published";
  }
  async function get(path) {
    const response = await fetch(path, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "Weather request failed");
    return payload;
  }
  function render() {
    const forecast = state.forecast;
    if (!forecast) return;
    const current = forecast.current;
    el("weather-current").hidden = !current;
    if (current) {
      el("weather-current-title").textContent = forecast.location.label;
      el("weather-summary").textContent = current.summary;
      el("weather-temperature").textContent = temp(current.temperature);
      el("weather-wind").textContent = speed(current.windSpeed);
      el("weather-humidity").textContent = current.humidity === null ? "Not reported" : `${Math.round(current.humidity)}%`;
      el("weather-precipitation").textContent = current.precipitationProbability === null ? "Not reported" : `${Math.round(current.precipitationProbability)}%`;
      el("weather-updated").textContent = date(forecast.generatedAt, { hour: "numeric", minute: "2-digit" });
    }
    el("weather-unit-toggle").textContent = state.units === "C" ? "Show °F" : "Show °C";
    const alertRoot = el("weather-alerts"); clear(alertRoot);
    el("weather-alerts-section").hidden = !forecast.alerts.length;
    forecast.alerts.forEach((alert) => {
      const card = node("article", "weather-alert");
      card.append(node("p", "weather-alert__level", [alert.severity, alert.urgency].filter(Boolean).join(" · ") || "Weather alert"), node("h3", "", alert.event), node("p", "", alert.headline));
      if (alert.endsAt) card.append(node("p", "weather-alert__time", `Until ${date(alert.endsAt, { weekday: "short", hour: "numeric", minute: "2-digit" })}`));
      alertRoot.append(card);
    });
    const hourlyRoot = el("weather-hourly"); clear(hourlyRoot);
    forecast.hourly.slice(0, 24).forEach((period) => {
      const card = node("article", "weather-hour-card");
      card.append(node("time", "", date(period.startTime, { hour: "numeric" })), node("strong", "", temp(period.temperature)), node("span", "", period.summary), node("small", "", period.precipitationProbability === null ? "" : `${Math.round(period.precipitationProbability)}% precip.`));
      hourlyRoot.append(card);
    });
    const dailyRoot = el("weather-daily"); clear(dailyRoot);
    forecast.daily.forEach((period) => {
      const card = node("article", "weather-day-card");
      card.append(node("h3", "", date(period.startTime, { weekday: "long" })), node("p", "weather-day-card__temperature", temp(period.temperature)), node("p", "", period.summary), node("p", "weather-day-card__meta", `${period.precipitationProbability === null ? "Precipitation unavailable" : `${Math.round(period.precipitationProbability)}% precipitation`} · Wind ${speed(period.windSpeed)}`));
      dailyRoot.append(card);
    });
    renderCharts(forecast.hourly);
    el("weather-source").textContent = forecast.provenance.map((item) => `${item.attribution} · fetched ${date(item.fetchedAt, { dateStyle: "medium", timeStyle: "short" })}`).join("; ");
    el("weather-status").textContent = `Showing ${forecast.location.precision === "approximate" ? "an approximate" : "your selected"} forecast for ${forecast.location.label}.`;
  }
  async function load(location) {
    el("weather-status").textContent = "Loading forecast…";
    const params = new URLSearchParams({ lat: location.latitude, lon: location.longitude, precision: location.precision || "selected", contract: "1.1.1" });
    if (location.countryCode) params.set("country", location.countryCode);
    if (location.timezone) params.set("timezone", location.timezone);
    if (location.label) params.set("label", location.label);
    state.forecast = await get(`${API}/forecast?${params}`);
    render();
    window.dispatchEvent(new CustomEvent("boho:weather-location", { detail: { ...state.forecast.location, countryCode: location.countryCode || state.forecast.location.countryCode } }));
  }
  el("weather-unit-toggle").addEventListener("click", () => { state.units = state.units === "C" ? "F" : "C"; localStorage.setItem("bohonews-weather-units", state.units); render(); });
  el("weather-location-search").addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = el("weather-location-query").value.trim();
    const root = el("weather-location-results"); clear(root);
    if (!query) return;
    try {
      const payload = await get(`${API}/locations/search?q=${encodeURIComponent(query)}`);
      if (!payload.results.length) root.append(node("p", "", "No matching preview locations. Try a major city."));
      payload.results.forEach((place) => {
        const button = node("button", "", `${place.name}, ${place.region || place.countryCode}`); button.type = "button";
        button.addEventListener("click", async () => { clear(root); el("weather-location-kind").textContent = `${place.name}, ${place.region || place.countryCode} · selected location`; try { await load({ ...place, label: `${place.name}, ${place.region || place.countryCode}`, precision: "selected" }); } catch (error) { el("weather-status").textContent = error.message; } });
        root.append(button);
      });
    } catch (error) { root.append(node("p", "", error.message)); }
  });
  el("weather-device-location").addEventListener("click", () => {
    if (!navigator.geolocation) return void (el("weather-status").textContent = "This browser does not provide device location.");
    el("weather-status").textContent = "Waiting for device location permission…";
    navigator.geolocation.getCurrentPosition(
      async (position) => { el("weather-location-kind").textContent = "Device location · used only for this forecast"; try { await load({ latitude: position.coords.latitude, longitude: position.coords.longitude, precision: "device", label: "Device location" }); } catch (error) { el("weather-status").textContent = error.message; } },
      () => { el("weather-status").textContent = "Device location was not shared. Your approximate forecast is unchanged."; },
      { enableHighAccuracy: false, maximumAge: 900000, timeout: 10000 }
    );
  });
  (async () => {
    try {
      const result = await get(`${API}/context`); const location = result.location;
      el("weather-location-kind").textContent = `${location.city || "Approximate location"}${location.regionCode ? `, ${location.regionCode}` : ""} · approximate from network location`;
      await load({ ...location, label: [location.city, location.regionCode || location.region].filter(Boolean).join(", ") });
    } catch (error) { el("weather-status").textContent = error.message; }
  })();
})();
