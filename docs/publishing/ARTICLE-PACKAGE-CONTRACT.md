# Public article package contract

Production articles arrive inside a final
`public-news-promotion-package.v2.1.1`. The package may continue to carry
legacy Batch 1 release records at 2.0, while new MCP releases use 2.1.1. The
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

Every final article is bound to a hashed production release record. New 2.1.1
records contain the provider, safe account/project reference, activation
immutable URL, provider-recorded activation time, canonical first-public time,
article inventory, activation-evidence hash, and predecessor reference. They do
not contain their own containing commit SHA or final-deployment fields.
Candidate packages have no final timestamps or release binding and are rejected
by the public repository.

The private compiler rejects unknown input fields and strips private notes,
confidence discussions, raw payloads, credentials, contacts, legal advice,
embargo state, kill state, and fixture markers. The public validator independently
checks contract identity, counts, duplicate IDs/slugs, release digest binding,
structured media binding, forbidden fields, and fixture exclusion before every
build.

The disconnected preview lane accepts a release-unbound 2.1.1 candidate only with
`BOHONEWS_PREVIEW=1`. It renders exact candidate copy and media without
publication timestamps, removes candidates from discovery feeds/search, adds
noindex/nofollow/no-store controls, suppresses analytics and executable
third-party integrations, and emits a candidate marker. The ordinary
production validator rejects that package.

New final 2.1.1 releases use `bohonews-finalizer.v2.1.1`. Candidate-to-final
article changes are limited to `publishedAt`, `updatedAt`, `releaseId`, and the
time on an already-approved public change-log entry. Package, manifest,
release-record, marker, and indexability derivations are also allowed; all
substantive copy, sources, claims, routes, and media must remain identical.

Marker 1.1 contains exactly the schema version, release ID, package digest,
public-content inventory digest, canonical first-public time, finalizer version,
and marker hash. The inventory hashes the final package file, release-manifest
file, and all promoted media bytes in path order. It excludes the marker, Git
metadata, build output, archives, temporary files, and runtime evidence, so
marker changes cannot create a digest cycle. Final commit SHAs and final
deployment evidence are private completion evidence and never enter public
output.
