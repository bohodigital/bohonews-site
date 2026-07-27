# News sitemap and feeds

`/rss.xml` includes approved articles whose public distribution metadata enables
RSS. `/feeds/<section>.xml` applies the same gate by section.

`/news-sitemap.xml` includes only non-fixture, current, news-sitemap-eligible
articles in the recent-news window. It uses the Google News XML namespace,
publication name/language, original publication timestamp, and headline.

Visible article history, RSS `pubDate`, news-sitemap publication time, JSON-LD
`datePublished`, Open Graph `article:published_time`, and search metadata all
use the same production-release-derived UTC timestamp. The interface renders
that value in America/Chicago with the correct `CDT` or `CST` abbreviation.

Evidence-backed Release 2.1 uses `canonicalFirstPublicAt` for this value.
`providerActivatedAt` remains separate provider evidence and is never shown as
the publication time. Disconnected candidates are excluded from RSS, section
feeds, ordinary and news sitemaps, and Pagefind.

`/sitemap.xml` includes canonical public shell routes plus non-fixture,
indexable, current article routes. Drafts, previews, fixtures, embargoed/killed
packages, retractions, and aliases never enter the promoted dataset and cannot
enter discovery output. `/robots.txt` points to both sitemaps.
