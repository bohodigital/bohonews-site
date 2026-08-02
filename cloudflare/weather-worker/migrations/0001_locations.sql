CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_search TEXT NOT NULL,
  region TEXT,
  country_code TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timezone TEXT,
  population INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS locations_name_search_population
ON locations (name_search, population DESC);
