(() => {
  const config = document.currentScript;
  if (!config) return;

  const marker = "boho_qa";
  let suppressed = navigator.webdriver === true;

  try {
    const markerValue = new URLSearchParams(window.location.search).get(marker);
    if (markerValue === "1") sessionStorage.setItem(marker, "1");
    if (markerValue === "0") sessionStorage.removeItem(marker);
    suppressed = suppressed || sessionStorage.getItem(marker) === "1";
  } catch {
    suppressed =
      suppressed || new URLSearchParams(window.location.search).get(marker) === "1";
  }

  if (suppressed) {
    document.documentElement.dataset.analyticsSuppressed = "boho-qa";
    return;
  }

  const allowedHosts = (config.dataset.umamiDomains || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (!allowedHosts.includes(window.location.hostname.toLowerCase())) return;

  const scriptUrl = config.dataset.umamiScriptUrl;
  const websiteId = config.dataset.umamiWebsiteId;
  if (!scriptUrl || !websiteId) return;

  const tracker = document.createElement("script");
  tracker.async = true;
  tracker.src = scriptUrl;
  tracker.setAttribute("data-website-id", websiteId);
  tracker.setAttribute("data-domains", allowedHosts.join(","));
  tracker.setAttribute("data-do-not-track", "true");
  tracker.setAttribute("data-exclude-search", "true");
  document.head.appendChild(tracker);
})();
