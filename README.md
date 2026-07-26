# Boho News public site

This repository contains the public website and publishing frontend for Boho News at `bohonews.com`.

It is the public delivery surface for publishable article packages, citations, rights-cleared media, policy pages, and generated public artifacts. Private newsroom engineering, internal planning, source-adapter development, and editorial operations belong in the private `bohonews-project` repository.

## Implemented architecture

- Static-first Astro
- Minimal client JavaScript
- Cloudflare Pages-compatible static output
- Governed article, source, media-rights, and approval records
- site-wide and section RSS, ordinary and news sitemaps, local search, and
  `NewsArticle`/`Article` structured data
- Accessible, mobile-first presentation
- Broad general-interest newsroom shell with modular homepage treatments
- System, light, and dark visual themes with local preference persistence
- Subject, format, and contextual subdesk routes from the approved visual
  storyboard

The Handoff 1 infrastructure is implemented, but no real article has been
promoted and the repository is not authorized for production deployment or
public launch.

## Local development

```sh
npm ci
npm run check
npm test
npm run build
npm run build:fixtures # non-production, noindex synthetic preview only
npm run dev
```

## Public/private boundary

Only material approved for public release belongs here. Do not commit secrets, credentials, confidential source identities, unpublished investigations, raw licensed wire content, private editorial deliberations, raw email, legal advice, donor private data, runtime databases, unredacted sensitive records, or private financial records.

Every publishable media asset requires a media-rights record. Every future article package must preserve source provenance, approval state, corrections, and revisions.

The compiler-owned input is
`src/publishing/public-news-promotion-package.v1.json`; its companion release manifest
is `public-news-release.v1.json`. The production package contains zero fixtures.

Cloudflare Pages build command: `npm run build`. Output directory: `dist`.

## Governance and licensing

This repository is governed by the central Local1 constitutions and `bohonews.project` v1.0.0. The canonical project constitution is maintained in the Pi-hosted Local1 Hub; the private project repository contains a verified mirror.

No open-source license has been selected. All rights are reserved pending a separate owner-approved licensing decision.
