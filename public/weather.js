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
    el("weather-source").textContent = forecast.provenance.map((item) => `${item.attribution} · fetched ${date(item.fetchedAt, { dateStyle: "medium", timeStyle: "short" })}`).join("; ");
    el("weather-status").textContent = `Showing ${forecast.location.precision === "approximate" ? "an approximate" : "your selected"} forecast for ${forecast.location.label}.`;
  }
  async function load(location) {
    el("weather-status").textContent = "Loading forecast…";
    const params = new URLSearchParams({ lat: location.latitude, lon: location.longitude, precision: location.precision || "selected" });
    if (location.countryCode) params.set("country", location.countryCode);
    if (location.timezone) params.set("timezone", location.timezone);
    if (location.label) params.set("label", location.label);
    state.forecast = await get(`${API}/forecast?${params}`);
    render();
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
