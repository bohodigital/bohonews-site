# Boho News visual system

The public shell implements the approved Broad Newsroom Visual Storyboard v1.1
as a static-first Astro component system.

## Implemented shell

- two-level desktop navigation and a mobile priority row/menu;
- optional breaking and live presentation states;
- dominant lead, secondary story, latest-wire, section, alert, data, document,
  visual-story, investigation, and newsletter modules;
- broad subject and format routes without making Politics the global frame;
- contextual navigation for Politics, World, Crime & Justice, and Weather &
  Climate;
- shared section and article layouts;
- warm-newsprint light mode and independently tuned charcoal dark mode;
- system/light/dark controls stored only in local browser storage;
- external, blocking theme initialization compatible with the site CSP;
- responsive, reduced-motion, high-zoom-friendly, and print presentations;
- a bespoke 1200×630 social-preview image.

Production remains compiler-driven. Batch 1 populates the homepage, section and
desk indexes, story cards, evidence tables, official-document views and article
pages from eight approved promotion records and their verified real media.
`BOHONEWS_INCLUDE_FIXTURES=1` remains available only for private interface
testing; every fixture page is noindex, non-distributed and explicitly labeled.

CSS-generated maps, charts, documents, and abstract news visuals are interface
fixtures, not editorial evidence or representations of real events. Production
photography and official-document renders require compiler-approved media-rights
records, byte hashes, responsive derivatives, captions, credits and public
asset binding.
