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

## Approval-bound finalization fast path

`bohonews-finalization-fastpath.v1.0.0` is an additional, explicit contract for
new batches. It does not change `bohonews-finalizer.v2.1.1` or silently upgrade
an older approval. Before canonical exposure, the release runner performs the
ordinary full checks plus the activation source/artifact validators and seals
the exact activation prepared directory with
`prepare-finalization-fastpath.mjs`. The activation layout binds the approval,
candidate, source archive, source inventory, source marker, every file digest,
and every file statistic. All files must be regular, single-link files; the
layout has fixed 20,000-file, 25 MiB-per-file, and 2 GiB-total safety bounds.

After the finalizer records the exact canonical first-public time, the site
builds only generated Astro, Pagefind, route, feed, sitemap, robots, and search
output under `tmp/mcp-finalization-generated`; it never recopies `public/media`.
While the sealed activation root still has its original name,
`plan-finalization-fastpath.mjs` writes a durable private plan containing the
exact old digest/stat or absence and exact new digest for every replacement and
deletion. The runner then performs one same-filesystem directory rename from
the activation prepared root to the final prepared root. Copying, hardlinking,
or replacing the root fails because its device and inode must be unchanged.

`apply-finalization-fastpath.mjs` accepts each mutable path only in its exact
sealed old state, exact planned new state, or planned absence. It replaces files
through same-directory durable temporary files and atomic renames, deletes
activation-only and stale generated paths, installs the production `_headers`
and `.well-known/bohonews-release.json`, and preserves invariant public files
by their sealed statistics without rereading their bytes. The completion record
is written last. A crash after the root rename, any replacement, any deletion,
or immediately before completion can replay the same plan to the same final
tree digest.

The post-first-public attestation reruns only targeted checks: unchanged code
and installed dependencies, exact finalizer allowlist, exact plan/completion
bindings, release package and marker validation, rendered article routes,
feeds/sitemaps/robots, and invariant stat seals. The MCP materializer creates
the sibling provider `prepared-directory-manifest.v1.json`; the Hub wrapper
validates, hashes, seals, and deploys it and may reuse activation
hashes only for identical sealed path/stat tuples.
