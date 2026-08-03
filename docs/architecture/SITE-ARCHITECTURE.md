# Site architecture

Boho News is a static Astro site built from one versioned public promotion
package. The package is compiler-owned and contains only approved public-safe
records; the public build has no private repository or database dependency.

Implemented routes include the homepage, latest and section indexes,
article pages, eight governed trust pages, search, RSS and section feeds, ordinary
and news sitemaps, robots, and 404. Metadata indexes drive every article and
section presentation. Article pages expose timestamps, bylines, labels,
developing/correction notices, source citations, revisions, and JSON-LD.

The visual shell now implements the broad newsroom architecture described in
`VISUAL-SYSTEM.md`: 20 subject/format indexes, contextual subdesk routes,
two-level navigation, modular homepage and article treatments, and persistent
system/light/dark themes. Legacy Handoff 1 section routes remain available
during the transition.

Production builds currently use the governed Batch 1 promotion: eight articles,
14 media-rights records and 98 responsive real-media derivatives.
The v2 promotion binds all eight articles to their first-public Cloudflare
release and exposes only reader-facing publication history.
`BOHONEWS_INCLUDE_FIXTURES=1` replaces those records with three synthetic,
noindex, non-distributed records for private layout testing only.

Pagefind 1.5.2 is pinned. Supported release builders run it after Astro. Bohopi's
16 KiB ARM64 kernel cannot execute the current native binary, so that builder
emits a deterministic local fallback index that preserves working local search.
No client framework is hydrated.

The weather lane adds two isolated interactive surfaces at `/weather/` and
`/weather/nerd/`. Static HTML remains the baseline; the browser clients request
only the same-origin, versioned `/api/weather/v1` contract. The standard page
provides the local forecast, alerts, three focused time series, and radar. The
nerd dashboard adds a synchronized forecast-hour inspector and separate,
unit-compatible time series for temperature/dew point, precipitation chance,
expected precipitation, humidity/cloud cover, wind, and pressure. It does not
present forecast precipitation as observed radar.

Observed U.S. radar exposes up to two hours of NOAA MRMS frames and uses three
rotating, preloaded map surfaces for continuous crossfades without blank tile
flashes. Playback supports multiple speeds, direct scrubbing, jump-to-latest,
visibility pausing, and reduced-motion preferences. The displayed timestamps
remain the actual NOAA observations; visual blends are never described as new
meteorological samples.

The undeployed `bohonews-weather-edge` Worker serves built assets and handles
that API before asset lookup. It uses rounded Cloudflare request geolocation,
NWS for United States forecasts and alerts, MET Norway for global point
forecasts, NOAA MRMS for observed continental-U.S. radar, and USGS base tiles.
KV holds last-known-good normalized responses, R2 is reserved for immutable
radar assets, and D1 is reserved for the global gazetteer. The Pi is not a
public origin, and provider keys never enter browser code.

The global header includes TradingView's free branded Ticker Tape web
component. The component loads as an ES module from the provider's current
widget CDN, uses broad market indicators rather than an account watchlist,
inherits the site's light/dark color scheme, respects reduced-motion
preferences, and retains visible TradingView attribution. The CSP permits only
the widget module/datafeed host and TradingView's documented widget telemetry
endpoint. TradingView's provider disclosure is summarized on `/privacy/`.
