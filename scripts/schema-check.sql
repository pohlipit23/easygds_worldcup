CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  pin_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  stage TEXT NOT NULL,
  grp TEXT,
  matchday INTEGER,
  kickoff TEXT NOT NULL,
  home_team TEXT,
  away_team TEXT,
  home_tla TEXT,
  away_tla TEXT,
  home_crest TEXT,
  away_crest TEXT,
  status TEXT NOT NULL DEFAULT 'TIMED',
  home_score INTEGER,
  away_score INTEGER,
  winner TEXT,
  duration TEXT,
  manual_override INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS predictions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  joker INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, match_id)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
