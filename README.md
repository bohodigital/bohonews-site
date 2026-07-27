# Boho News public site

This repository contains the public website and publishing frontend for Boho News at `bohonews.com`.

It is the public delivery surface for publishable article packages, citations, rights-cleared media, policy pages, and generated public artifacts. Private newsroom engineering, internal planning, source-adapter development, and editorial operations belong in the private `bohonews-project` repository.

## Implemented architecture

- Static-first Astro
- Minimal client JavaScript
- Free branded TradingView market ticker with no account dependency
- Cloudflare Pages-compatible static output
- Governed article, source, media-rights, and approval records
- site-wide and section RSS, ordinary and news sitemaps, local search, and
  `NewsArticle`/`Article` structured data
- Accessible, mobile-first presentation
- Broad general-interest newsroom shell with modular homepage treatments
- System, light, and dark visual themes with local preference persistence
- Subject, format, and contextual subdesk routes from the approved visual
  storyboard
- Privacy-restrained self-hosted Umami analytics limited to the Boho News apex
  and `www` hosts, with Do Not Track and query-string exclusion enabled

The Handoff 1 infrastructure, public newsroom shell, and first governed article
release are implemented. Batch 1 contains eight source-backed articles whose
public timestamps are bound to a verified Cloudflare Pages production
activation record.

The site also implements the Boho News MCP v2 consumer: promotion/release 2.1,
disconnected noindex preview builds, evidence-backed final release records, and
the final public release marker. `bohonews.article.v1` remains retired. The
initial v2 production operation is create-only and remains gated until the
governed release runner and create canary pass.

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

Every publishable media asset requires a media-rights record. Every article
package must preserve source provenance, approval state, public corrections,
and the release evidence establishing its visible publication history.

The compiler-owned input is
`src/publishing/public-news-promotion-package.v2.1.json`; its companion release
manifest is `public-news-release.v2.1.json`. Legacy v2 files are readable only
during a verified migration and are rejected when both generations exist. The production package contains zero
fixtures and exposes public change-log entries only when a reader-relevant
change has occurred.

Cloudflare Pages build command: `npm run build`. Output directory: `dist`.

## Governance and licensing

This repository is governed by the central Local1 constitutions and `bohonews.project` v1.0.0. The canonical project constitution is maintained in the Pi-hosted Local1 Hub; the private project repository contains a verified mirror.

No open-source license has been selected. All rights are reserved pending a separate owner-approved licensing decision.
