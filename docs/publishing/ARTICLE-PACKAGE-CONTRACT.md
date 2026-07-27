# Public article package contract

Public articles arrive inside a final `public-news-promotion-package.v2` legacy
package or an evidence-backed `public-news-promotion-package.v2.1`. The
public shape includes stable identity and slug, headline and dek, article type,
section and desk, topics/entities/locations, author/editor labels, original and
updated timestamps, exact body copy, structured body blocks, confirmed facts
and uncertainty, public citations,
rights-cleared media references, a public-only change log, published corrections,
retraction state, distribution/search/social metadata, related IDs, canonical
URL, supersession relationships, and the first-public production release ID.

Operational `revisionHistory` remains private. The public change log permits
only reader-facing updates, corrections, clarifications, editor's notes,
retractions, removals, and supersession notices.

Every final article is bound to a hashed production release record containing
the provider, safe account/project reference, immutable deployment URL,
reviewed public commit, provider-recorded activation time, verified routes,
article inventory, and verification time. Candidate packages have no final
timestamps or release binding and are rejected by the public repository.

The private compiler rejects unknown input fields and strips private notes,
confidence discussions, raw payloads, credentials, contacts, legal advice,
embargo state, kill state, and fixture markers. The public validator independently
checks contract identity, counts, duplicate IDs/slugs, release digest binding,
structured media binding, forbidden fields, and fixture exclusion before every
build.

The disconnected preview lane accepts a release-unbound 2.1 candidate only with
`BOHONEWS_PREVIEW=1`. It renders exact candidate copy and media without
publication timestamps, removes candidates from discovery feeds/search, adds
noindex/nofollow/no-store controls, suppresses analytics and executable
third-party integrations, and emits a candidate marker. The ordinary
production validator rejects that package.

New final 2.1 releases use `bohonews-finalizer.v2.1.0`. Candidate-to-final
article changes are limited to `publishedAt`, `updatedAt`, `releaseId`, and the
time on an already-approved public change-log entry. Package, manifest,
release-record, marker, and indexability derivations are also allowed; all
substantive copy, sources, claims, routes, and media must remain identical.
