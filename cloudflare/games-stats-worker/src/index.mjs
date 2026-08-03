const API = "/api/games/v1";
const VERSION = "1.0";
const MAX_BODY_BYTES = 1024;
const ALLOWED_KEYS = new Set(["schemaVersion", "game", "variant", "outcome", "scoreBucket"]);
const CONTRACTS = {
  wordle: { variants: new Set(["standard"]), outcomes: new Set(["won", "lost"]), scores: new Set(["1", "2", "3", "4", "5", "6", "X"]) },
  mini: { variants: new Set(["standard"]), outcomes: new Set(["solved"]), scores: new Set(["complete"]) },
  sudoku: { variants: new Set(["easy", "medium", "hard", "expert"]), outcomes: new Set(["solved"]), scores: new Set(["complete"]) },
  "2048": { variants: new Set(["standard"]), outcomes: new Set(["won", "lost"]), scores: new Set(["<512", "512", "1024", "2048", "4096+"]) }
};

function json(value, status = 200, cache = "no-store") {
  return new Response(`${JSON.stringify(value)}\n`, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function problem(status, code, message) {
  return json({ schemaVersion: VERSION, error: { code, message } }, status);
}

function validateCompletion(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Completion must be a JSON object";
  if (Object.keys(value).some((key) => !ALLOWED_KEYS.has(key))) return "Completion contains an unsupported field";
  if (value.schemaVersion !== VERSION) return "Unsupported schema version";
  const contract = CONTRACTS[value.game];
  if (!contract) return "Unsupported game";
  if (!contract.variants.has(value.variant)) return "Unsupported game variant";
  if (!contract.outcomes.has(value.outcome)) return "Unsupported outcome";
  if (!contract.scores.has(value.scoreBucket)) return "Unsupported score bucket";
  if (value.game === "wordle" && value.outcome === "won" && value.scoreBucket === "X") return "A winning Wordle score must be between 1 and 6";
  if (value.game === "wordle" && value.outcome === "lost" && value.scoreBucket !== "X") return "A lost Wordle score must be X";
  return null;
}

async function readCompletion(request) {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new RangeError("Content-Type must be application/json");
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new RangeError("Completion body is too large");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) throw new RangeError("Completion body is too large");
  try { return JSON.parse(body); }
  catch { throw new RangeError("Completion body must contain valid JSON"); }
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return origin === new URL(request.url).origin;
}

async function recordCompletion(request, env) {
  if (!sameOrigin(request)) return problem(403, "cross_origin_denied", "Game results must come from this site");
  if (!env.GAME_STATS) return problem(503, "stats_unavailable", "Community score collection is not configured");
  const completion = await readCompletion(request);
  const validationError = validateCompletion(completion);
  if (validationError) return problem(400, "invalid_completion", validationError);
  const day = new Date().toISOString().slice(0, 10);
  await env.GAME_STATS.prepare(`
    INSERT INTO game_score_totals (day, game, variant, outcome, score_bucket, reported_plays)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT (day, game, variant, outcome, score_bucket)
    DO UPDATE SET reported_plays = reported_plays + 1
  `).bind(day, completion.game, completion.variant, completion.outcome, completion.scoreBucket).run();
  return json({ schemaVersion: VERSION, accepted: true }, 202);
}

async function communityStats(env) {
  if (!env.GAME_STATS) return problem(503, "stats_unavailable", "Community score collection is not configured");
  const result = await env.GAME_STATS.prepare(`
    SELECT game, variant, outcome, score_bucket, SUM(reported_plays) AS reported_plays
    FROM game_score_totals
    GROUP BY game, variant, outcome, score_bucket
    ORDER BY game, variant, outcome, score_bucket
  `).all();
  const buckets = (result.results || []).map((row) => ({ game: row.game, variant: row.variant, outcome: row.outcome, scoreBucket: row.score_bucket, reportedPlays: Number(row.reported_plays || 0) }));
  const totals = new Map();
  for (const bucket of buckets) totals.set(bucket.game, (totals.get(bucket.game) || 0) + bucket.reportedPlays);
  const games = [...totals].map(([game, reportedPlays]) => ({ game, reportedPlays }));
  return json({
    schemaVersion: VERSION,
    totalReportedPlays: games.reduce((sum, game) => sum + game.reportedPlays, 0),
    games,
    buckets,
    qualification: "Reported community plays are voluntary and are not a cheat-proof leaderboard."
  }, 200, "public, max-age=300, stale-while-revalidate=900");
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (url.pathname === `${API}/health` && ["GET", "HEAD"].includes(request.method)) {
    return json({ schemaVersion: VERSION, status: "ok", service: "bohonews-games-stats", aggregateOnly: true, databaseConfigured: Boolean(env.GAME_STATS) });
  }
  if (url.pathname === `${API}/stats` && ["GET", "HEAD"].includes(request.method)) return communityStats(env);
  if (url.pathname === `${API}/completions` && request.method === "POST") return recordCompletion(request, env);
  if (url.pathname.startsWith(API)) return problem(404, "not_found", "Game stats endpoint not found");
  return env.ASSETS.fetch(request);
}

export { validateCompletion };
export default {
  async fetch(request, env) {
    try {
      const response = await handleApi(request, env);
      return request.method === "HEAD" ? new Response(null, response) : response;
    } catch (error) {
      if (error instanceof RangeError) return problem(400, "invalid_request", error.message);
      console.error("games-stats-error", error instanceof Error ? error.message : "unknown");
      return problem(503, "stats_temporarily_unavailable", "Community score collection is temporarily unavailable");
    }
  }
};
