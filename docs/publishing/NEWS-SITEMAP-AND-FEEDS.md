# News sitemap and feeds

`/rss.xml` includes approved articles whose public distribution metadata enables
RSS. `/feeds/<section>.xml` applies the same gate by section.

`/news-sitemap.xml` includes only non-fixture, current, news-sitemap-eligible
articles in the recent-news window. It uses the Google News XML namespace,
publication name/language, original publication timestamp, and headline.

`/sitemap.xml` includes canonical public shell routes plus non-fixture,
indexable, current article routes. Drafts, previews, fixtures, embargoed/killed
packages, retractions, and aliases never enter the promoted dataset and cannot
enter discovery output. `/robots.txt` points to both sitemaps.
