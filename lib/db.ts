import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const SCHEMA = `
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
  venue TEXT,
  venue_tz TEXT,
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
`;

declare global {
  // eslint-disable-next-line no-var
  var __wcdb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (globalThis.__wcdb) return globalThis.__wcdb;
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "worldcup.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  // Lightweight migration for DBs created before the venue columns existed.
  for (const col of ["venue TEXT", "venue_tz TEXT"]) {
    try {
      db.exec(`ALTER TABLE matches ADD COLUMN ${col}`);
    } catch {
      // column already exists
    }
  }
  globalThis.__wcdb = db;
  return db;
}

export function getMeta(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setMeta(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

export type MatchRow = {
  id: number;
  stage: string;
  grp: string | null;
  matchday: number | null;
  kickoff: string;
  home_team: string | null;
  away_team: string | null;
  home_tla: string | null;
  away_tla: string | null;
  home_crest: string | null;
  away_crest: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  duration: string | null;
  venue: string | null;
  venue_tz: string | null;
  manual_override: number;
};

export type PredictionRow = {
  user_id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  joker: number;
  created_at: string;
};

export type UserRow = {
  id: number;
  name: string;
  pin_hash: string;
  is_admin: number;
  created_at: string;
};
