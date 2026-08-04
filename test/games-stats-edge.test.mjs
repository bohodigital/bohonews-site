import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import worker, { validateCompletion } from "../cloudflare/games-stats-worker/src/index.mjs";

class FakeDatabase {
  rows = new Map();
  prepare(_sql) {
    return {
      bind: (...values) => ({
        run: async () => {
          const key = values.join("|");
          this.rows.set(key, (this.rows.get(key) || 0) + 1);
          return { success: true };
        }
      }),
      all: async () => {
        const results = [];
        for (const [key, count] of this.rows) {
          const [, game, variant, outcome, score_bucket] = key.split("|");
          results.push({ game, variant, outcome, score_bucket, reported_plays: count });
        }
        return { results };
      }
    };
  }
}

const environment = () => ({ GAME_STATS: new FakeDatabase(), ASSETS: { fetch: () => new Response("asset") } });

test("completion contract accepts only coarse current-game results", () => {
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"wordle", variant:"standard", outcome:"won", scoreBucket:"4000-7999" }), null);
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"sudoku", variant:"hard", outcome:"solved", scoreBucket:"8000-15999" }), null);
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"2048", variant:"standard", outcome:"won", scoreBucket:"16000+" }), null);
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"nonogram", variant:"pattern", outcome:"solved", scoreBucket:"8000-15999" }), null);
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"mahjong", variant:"turtle", outcome:"solved", scoreBucket:"8000-15999" }), null);
  assert.equal(validateCompletion({ schemaVersion:"1.0", game:"loopy", variant:"tricky", outcome:"solved", scoreBucket:"8000-15999" }), null);
  assert.match(validateCompletion({ schemaVersion:"1.0", game:"2048", variant:"standard", outcome:"won", scoreBucket:"8192" }), /Unsupported score bucket/);
  assert.match(validateCompletion({ schemaVersion:"1.0", game:"wordle", variant:"standard", outcome:"won", scoreBucket:"4000-7999", playerId:"abc" }), /unsupported field/);
});

test("same-origin completions increment aggregate rows and expose qualified totals", async () => {
  const env = environment();
  const request = new Request("https://bohonews.com/api/games/v1/completions", {
    method:"POST",
    headers:{ Origin:"https://bohonews.com", "Content-Type":"application/json" },
    body:JSON.stringify({ schemaVersion:"1.0", game:"mini", variant:"standard", outcome:"solved", scoreBucket:"8000-15999" })
  });
  const accepted = await worker.fetch(request, env);
  assert.equal(accepted.status, 202);
  assert.equal((await accepted.json()).accepted, true);
  const stats = await worker.fetch(new Request("https://bohonews.com/api/games/v1/stats"), env);
  const payload = await stats.json();
  assert.equal(payload.totalReportedPlays, 1);
  assert.deepEqual(payload.buckets, [{ game:"mini", variant:"standard", outcome:"solved", scoreBucket:"8000-15999", reportedPlays:1 }]);
  assert.match(payload.qualification, /not a cheat-proof leaderboard/);
});

test("cross-origin writes and identifying fields are rejected", async () => {
  const env = environment();
  const crossOrigin = await worker.fetch(new Request("https://bohonews.com/api/games/v1/completions", {
    method:"POST", headers:{ Origin:"https://example.com", "Content-Type":"application/json" }, body:"{}"
  }), env);
  assert.equal(crossOrigin.status, 403);
  const source = await readFile(new URL("../cloudflare/games-stats-worker/src/index.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /CF-Connecting-IP|request\.cf|User-Agent|Referer/);
});

test("Wrangler and D1 schema are deployable without checked-in resource IDs", async () => {
  const [wrangler, migration, client] = await Promise.all([
    readFile(new URL("../wrangler.games.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../cloudflare/games-stats-worker/migrations/0001_game_score_totals.sql", import.meta.url), "utf8"),
    readFile(new URL("../public/game-stats.js", import.meta.url), "utf8")
  ]);
  assert.match(wrangler, /GAME_STATS/);
  assert.match(wrangler, /\/api\/games\/\*/);
  assert.match(wrangler, /cloudflare\/games-stats-worker\/migrations/);
  assert.doesNotMatch(wrangler, /account_id|database_id/);
  assert.match(migration, /PRIMARY KEY \(day, game, variant, outcome, score_bucket\)/);
  assert.doesNotMatch(migration, /player|device|ip_address|user_agent|raw_event/i);
  assert.match(client, /share-stats:v1/);
  assert.match(client, /localStorage\.getItem\(SETTING_KEY\) === "true"/);
});
