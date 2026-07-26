# Site architecture

Boho News is a static Astro site built from one versioned public promotion
package. The package is compiler-owned and contains only approved public-safe
records; the public build has no private repository or database dependency.

Implemented routes include the homepage, latest and eight section indexes,
article pages, six policy placeholders, search, RSS and section feeds, ordinary
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
`BOHONEWS_INCLUDE_FIXTURES=1` replaces those records with three synthetic,
noindex, non-distributed records for private layout testing only.

Pagefind 1.5.2 is pinned. Supported release builders run it after Astro. Bohopi's
16 KiB ARM64 kernel cannot execute the current native binary, so that builder
emits a deterministic local fallback index that preserves working local search.
No client framework is hydrated.

The global header includes TradingView's free branded Ticker Tape web
component. The component loads as an ES module from the provider's current
widget CDN, uses broad market indicators rather than an account watchlist,
inherits the site's light/dark color scheme, respects reduced-motion
preferences, and retains visible TradingView attribution. The CSP permits only
the widget module/datafeed host and TradingView's documented widget telemetry
endpoint. TradingView's provider disclosure is summarized on `/privacy/`.
