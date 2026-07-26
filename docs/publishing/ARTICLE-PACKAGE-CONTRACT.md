# Public article package contract

Public articles arrive only inside `public-news-promotion-package.v1`. The
public shape includes stable identity and slug, headline and dek, article type,
section, topics/entities/locations, author/editor labels, original and updated
timestamps, body, confirmed facts and uncertainty, public citations,
rights-cleared media references, revision history, published corrections,
retraction state, distribution/search/social metadata, related IDs, canonical
URL, and supersession relationships.

The private compiler rejects unknown input fields and strips private notes,
confidence discussions, raw payloads, credentials, contacts, legal advice,
embargo state, kill state, and fixture markers. The public validator independently
checks contract identity, counts, duplicate IDs/slugs, release digest binding,
forbidden fields, and fixture exclusion before every build.
