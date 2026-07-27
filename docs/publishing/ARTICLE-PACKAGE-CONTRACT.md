# Public article package contract

Public articles arrive only inside a final `public-news-promotion-package.v2`. The
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
