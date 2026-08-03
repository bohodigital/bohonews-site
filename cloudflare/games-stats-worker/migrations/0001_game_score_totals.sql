CREATE TABLE IF NOT EXISTS game_score_totals (
  day TEXT NOT NULL,
  game TEXT NOT NULL,
  variant TEXT NOT NULL,
  outcome TEXT NOT NULL,
  score_bucket TEXT NOT NULL,
  reported_plays INTEGER NOT NULL DEFAULT 0 CHECK (reported_plays >= 0),
  PRIMARY KEY (day, game, variant, outcome, score_bucket)
) WITHOUT ROWID;
