(() => {
  const config = document.currentScript;
  if (!config || window.__bohoNewsAnalyticsLoaded) return;

  const hosts = (value) => [...new Set(
    (value || "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  )].sort();

  const umamiHosts = hosts(config.dataset.umamiDomains);
  const gaHosts = hosts(config.dataset.gaPublicHosts);
  const host = window.location.hostname.toLowerCase();
  if (
    umamiHosts.length === 0
    || umamiHosts.length !== gaHosts.length
    || !umamiHosts.every((allowedHost, index) => allowedHost === gaHosts[index])
    || !umamiHosts.includes(host)
  ) return;

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

  suppressed = suppressed
    || navigator.doNotTrack === "1"
    || navigator.msDoNotTrack === "1"
    || window.doNotTrack === "1";

  if (suppressed) {
    document.documentElement.dataset.analyticsSuppressed = "privacy-or-qa";
    return;
  }

  const scriptUrl = config.dataset.umamiScriptUrl;
  const websiteId = config.dataset.umamiWebsiteId;
  const gaId = config.dataset.gaId;
  if (!scriptUrl || !websiteId || !/^G-[A-Z0-9]+$/.test(gaId || "")) return;

  window.__bohoNewsAnalyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const pathname = window.location.pathname || "/";
  const pageLocation = `${window.location.origin}${pathname}`;
  const pageFields = { page_location: pageLocation, page_path: pathname };
  try {
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.protocol === "http:" || referrer.protocol === "https:") {
        pageFields.page_referrer = `${referrer.origin}${referrer.pathname || "/"}`;
      }
    }
  } catch {
    // Ignore malformed or unavailable referrers rather than forwarding them.
  }

  window.gtag("set", { send_page_view: false });
  window.gtag("js", new Date());
  window.gtag("config", gaId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true,
    send_page_view: false
  });
  window.gtag("event", "page_view", pageFields);

  const tracker = document.createElement("script");
  tracker.async = true;
  tracker.src = scriptUrl;
  tracker.setAttribute("data-website-id", websiteId);
  tracker.setAttribute("data-domains", umamiHosts.join(","));
  tracker.setAttribute("data-do-not-track", "true");
  tracker.setAttribute("data-exclude-search", "true");
  tracker.setAttribute("data-exclude-hash", "true");
  document.head.appendChild(tracker);

  const ga = document.createElement("script");
  ga.async = true;
  ga.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  ga.setAttribute("data-ga-loader", "bohonews-v1");
  document.head.appendChild(ga);
})();
