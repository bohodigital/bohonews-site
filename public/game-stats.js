(function () {
  "use strict";

  const SETTING_KEY = "boho-games:share-stats:v1";
  const API = "/api/games/v1";
  const controls = Array.from(document.querySelectorAll("[data-game-stats-opt-in]"));
  const summaries = Array.from(document.querySelectorAll("[data-community-stats]"));

  function isEnabled() {
    try { return localStorage.getItem(SETTING_KEY) === "true"; }
    catch { return false; }
  }

  function setEnabled(enabled) {
    try { localStorage.setItem(SETTING_KEY, String(Boolean(enabled))); }
    catch { /* Browser storage is optional. */ }
    controls.forEach((control) => { control.checked = Boolean(enabled); });
  }

  function setSummary(message) {
    summaries.forEach((summary) => { summary.textContent = message; });
  }

  async function submit(result) {
    if (!isEnabled()) return false;
    try {
      const response = await fetch(`${API}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaVersion: "1.0", ...result }),
        credentials: "same-origin",
        referrerPolicy: "no-referrer",
        keepalive: true
      });
      if (!response.ok) return false;
      const payload = await response.json();
      if (payload.accepted !== true) return false;
      await refresh();
      return true;
    } catch {
      return false;
    }
  }

  async function refresh() {
    try {
      const response = await fetch(`${API}/stats`, {
        credentials: "same-origin",
        referrerPolicy: "no-referrer"
      });
      if (!response.ok) throw new Error("stats unavailable");
      const payload = await response.json();
      const total = Number(payload.totalReportedPlays || 0);
      setSummary(`${total.toLocaleString()} reported community ${total === 1 ? "play" : "plays"}.`);
    } catch {
      setSummary("Community totals will appear when the score service is enabled.");
    }
  }

  controls.forEach((control) => {
    control.checked = isEnabled();
    control.addEventListener("change", () => setEnabled(control.checked));
  });

  window.BohoGameStats = Object.freeze({ isEnabled, setEnabled, submit, refresh });
  refresh();
}());
