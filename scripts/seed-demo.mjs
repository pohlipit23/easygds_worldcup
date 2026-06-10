// Seeds DEMO data so you can try the app before wiring the real API:
// a handful of group matches (some finished, some upcoming), a knockout
// skeleton for the bracket, and three demo players with bets.
// Demo matches use negative ids and are deleted automatically on the first
// successful football-data.org sync. Demo users are real users — delete the
// data/ directory to start completely fresh.
//
// Usage: node scripts/seed-demo.mjs

import Database from "better-sqlite3";
import { scryptSync, randomBytes } from "crypto";
import path from "path";
import fs from "fs";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "worldcup.db"));
db.pragma("journal_mode = WAL");

// Minimal schema bootstrap (same as lib/db.ts)
db.exec(fs.readFileSync(new URL("./schema-check.sql", import.meta.url), "utf8"));

function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

const now = Date.now();
const h = 3600_000;
// Round demo kickoffs to the full hour so they look like real fixtures.
const iso = (t) => {
  const d = new Date(t);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

const teams = {
  MEX: "Mexico", USA: "USA", CAN: "Canada", GER: "Germany",
  FRA: "France", BRA: "Brazil", ARG: "Argentina", ESP: "Spain",
  ENG: "England", POR: "Portugal", NED: "Netherlands", JPN: "Japan",
};
const flags = {
  MEX: "mx", USA: "us", CAN: "ca", GER: "de", FRA: "fr", BRA: "br",
  ARG: "ar", ESP: "es", ENG: "gb-eng", POR: "pt", NED: "nl", JPN: "jp",
};
const crest = (tla) => (tla ? `https://flagcdn.com/w160/${flags[tla]}.png` : null);

const matches = [
  // finished yesterday
  { id: -1, stage: "GROUP_STAGE", grp: "Group A", kickoff: iso(now - 26 * h), home: "MEX", away: "GER", hs: 1, as: 1, status: "FINISHED", winner: "DRAW" },
  { id: -2, stage: "GROUP_STAGE", grp: "Group B", kickoff: iso(now - 22 * h), home: "FRA", away: "JPN", hs: 2, as: 0, status: "FINISHED", winner: "HOME_TEAM" },
  { id: -3, stage: "GROUP_STAGE", grp: "Group C", kickoff: iso(now - 20 * h), home: "BRA", away: "NED", hs: 3, as: 1, status: "FINISHED", winner: "HOME_TEAM" },
  // upcoming
  { id: -4, stage: "GROUP_STAGE", grp: "Group A", kickoff: iso(now + 3 * h), home: "USA", away: "CAN", status: "TIMED" },
  { id: -5, stage: "GROUP_STAGE", grp: "Group B", kickoff: iso(now + 6 * h), home: "ARG", away: "ESP", status: "TIMED" },
  { id: -6, stage: "GROUP_STAGE", grp: "Group C", kickoff: iso(now + 27 * h), home: "ENG", away: "POR", status: "TIMED" },
  { id: -7, stage: "GROUP_STAGE", grp: "Group A", kickoff: iso(now + 50 * h), home: "MEX", away: "USA", status: "TIMED" },
];

// knockout skeleton so the bracket has shape (TBD teams)
let kid = -100;
const ko = [];
const koStages = [
  ["LAST_32", 16, 8],
  ["LAST_16", 8, 12],
  ["QUARTER_FINALS", 4, 16],
  ["SEMI_FINALS", 2, 20],
  ["THIRD_PLACE", 1, 24],
  ["FINAL", 1, 25],
];
for (const [stage, count, dayOffset] of koStages) {
  for (let i = 0; i < count; i++) {
    ko.push({ id: kid--, stage, grp: null, kickoff: iso(now + (dayOffset * 24 + (i % 4) * 3) * h), status: "TIMED" });
  }
}

// One decided R32 demo pairing so the bracket shows real teams on one card
ko[0].home = "ARG";
ko[0].away = "MEX";

const insertMatch = db.prepare(`
  INSERT OR REPLACE INTO matches (id, stage, grp, matchday, kickoff, home_team, away_team,
    home_tla, away_tla, home_crest, away_crest, status, home_score, away_score, winner,
    venue, venue_tz)
  VALUES (@id, @stage, @grp, NULL, @kickoff, @home_team, @away_team, @home_tla, @away_tla,
    @home_crest, @away_crest, @status, @hs, @as, @winner, @venue, @venue_tz)
`);

const demoVenues = [
  ["Estadio Azteca, Mexico City", "America/Mexico_City"],
  ["MetLife Stadium, New York", "America/New_York"],
  ["SoFi Stadium, Los Angeles", "America/Los_Angeles"],
  ["BC Place, Vancouver", "America/Vancouver"],
];
let v = 0;
for (const m of [...matches, ...ko]) {
  const [venue, venueTz] = demoVenues[v++ % demoVenues.length];
  insertMatch.run({
    id: m.id, stage: m.stage, grp: m.grp ?? null, kickoff: m.kickoff,
    home_team: m.home ? teams[m.home] : null, away_team: m.away ? teams[m.away] : null,
    home_tla: m.home ?? null, away_tla: m.away ?? null,
    home_crest: m.home ? crest(m.home) : null, away_crest: m.away ? crest(m.away) : null,
    status: m.status, hs: m.hs ?? null, as: m.as ?? null, winner: m.winner ?? null,
    venue, venue_tz: venueTz,
  });
}

const demoUsers = [
  ["Demo Anna", "1111"],
  ["Demo Ben", "2222"],
  ["Demo Carla", "3333"],
];
const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, pin_hash) VALUES (?, ?)");
for (const [name, pin] of demoUsers) insertUser.run(name, hashPin(pin));

const userIds = db.prepare("SELECT id FROM users WHERE name LIKE 'Demo %'").all().map((r) => r.id);
const insertPred = db.prepare(
  "INSERT OR IGNORE INTO predictions (user_id, match_id, home_score, away_score, joker) VALUES (?, ?, ?, ?, ?)"
);
const picks = [
  [[1, 1, 1], [2, 0, 0], [2, 1, 0]], // Anna: exact+joker, exact, tendency
  [[2, 1, 0], [1, 0, 1], [3, 1, 0]], // Ben
  [[0, 1, 0], [2, 2, 0], [1, 2, 1]], // Carla
];
userIds.forEach((uid, u) => {
  [-1, -2, -3].forEach((mid, m) => {
    const [hs, as, joker] = picks[u][m];
    insertPred.run(uid, mid, hs, as, joker);
  });
});

console.log("Demo data seeded.");
console.log("Demo logins: 'Demo Anna' PIN 1111, 'Demo Ben' PIN 2222, 'Demo Carla' PIN 3333.");
console.log("Demo matches vanish on the first real API sync; sign up normally for your own account.");
