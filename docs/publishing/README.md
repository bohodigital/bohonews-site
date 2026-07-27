# Public publishing surface

The public site consumes the reviewed
`src/publishing/public-news-promotion-package.v2.json` artifact and its
`public-news-release.v2.json` manifest. It does not read the private newsroom
repository at build time.

Articles must be approved, sourced, attributable to a responsible human,
connected to a verified production release, and validated for media rights and
executable content before build. Public publication and update timestamps come
from verified Cloudflare Pages activation records. Internal editorial revision
notes remain private; only reader-relevant updates, corrections,
clarifications, editor's notes, retractions, removals, and supersession events
appear in the public change log.
