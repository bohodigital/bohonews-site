# Boho News game stats edge

This undeployed Worker is the same-origin `/api/games/v1` contract for optional
community game totals. It is deliberately aggregate-only:

- sharing is off by default in the browser;
- no account, player ID, device ID, IP field, user agent, location, referrer,
  exact client timestamp, answer, guess, or puzzle state is accepted;
- the request schema allows only game, variant, outcome, and a coarse score
  bucket;
- D1 stores daily counter rows, not individual completion events; and
- displayed totals are qualified as voluntary reported plays, not a secure
  leaderboard.

Cloudflare still processes ordinary request metadata to deliver and secure the
Worker under the site's Privacy Policy. The application does not read that
metadata into game statistics.

## Free-plan budget

This design is intentionally tiny: one Worker request and one D1 row upsert per
voluntarily shared completion; public totals are cacheable for five minutes.
As of August 3, 2026, Cloudflare documents 100,000 free Worker requests per day
and D1 free allowances of 100,000 rows written and 5 million rows read per day,
with 5 GB total storage. Those are external service limits and must be checked
again before production acceptance:

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/pricing/>

At the free-plan ceiling, D1 writes and Worker requests are the relevant
guardrails. The aggregate table grows by score buckets per UTC day, not by
player or play, so storage growth remains small.

## Local validation

```bash
npm run games:check
npm run build
npx wrangler d1 migrations apply GAME_STATS --local --config wrangler.games.jsonc
npx wrangler dev --local --config wrangler.games.jsonc
```

The checked-in Wrangler file intentionally omits deployment IDs. A governed Pi
release must create or bind the production D1 database, apply the migration,
record rollback metadata, and deploy the exact approved site commit. Do not run
an ad-hoc Mac deployment.
