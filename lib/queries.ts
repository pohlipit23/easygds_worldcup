import { getDb, type MatchRow, type PredictionRow } from "./db";
import { pointsFor, jokerPhaseOf, jokerBudget, JOKER_PHASES, type JokerPhase } from "./rules";

export function allMatches(): MatchRow[] {
  return getDb().prepare("SELECT * FROM matches ORDER BY kickoff, id").all() as MatchRow[];
}

export function getMatch(id: number): MatchRow | undefined {
  return getDb().prepare("SELECT * FROM matches WHERE id = ?").get(id) as MatchRow | undefined;
}

export function predictionsByUser(userId: number): Map<number, PredictionRow> {
  const rows = getDb()
    .prepare("SELECT * FROM predictions WHERE user_id = ?")
    .all(userId) as PredictionRow[];
  return new Map(rows.map((r) => [r.match_id, r]));
}

export function predictionsForMatch(matchId: number): (PredictionRow & { name: string })[] {
  return getDb()
    .prepare(
      `SELECT p.*, u.name FROM predictions p JOIN users u ON u.id = p.user_id
       WHERE p.match_id = ? ORDER BY u.name COLLATE NOCASE`
    )
    .all(matchId) as (PredictionRow & { name: string })[];
}

export function predictionCount(matchId: number): number {
  const r = getDb()
    .prepare("SELECT COUNT(*) AS c FROM predictions WHERE match_id = ?")
    .get(matchId) as { c: number };
  return r.c;
}

export type JokerStatus = { phase: JokerPhase; label: string; budget: number; used: number };

export function jokerStatus(userId: number): JokerStatus[] {
  const rows = getDb()
    .prepare(
      `SELECT m.stage AS stage, COUNT(*) AS c FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE p.user_id = ? AND p.joker = 1 GROUP BY m.stage`
    )
    .all(userId) as { stage: string; c: number }[];
  const used = new Map<JokerPhase, number>();
  for (const r of rows) {
    const phase = jokerPhaseOf(r.stage);
    used.set(phase, (used.get(phase) ?? 0) + r.c);
  }
  return JOKER_PHASES.map((p) => ({ ...p, used: used.get(p.phase) ?? 0 }));
}

export function jokersLeft(userId: number, stage: string): number {
  const phase = jokerPhaseOf(stage);
  const status = jokerStatus(userId).find((s) => s.phase === phase)!;
  return Math.max(0, jokerBudget(phase) - status.used);
}

export type LeaderboardEntry = {
  userId: number;
  name: string;
  points: number;
  exact: number;
  tendency: number;
  jokerPoints: number;
  predictions: number;
  rank: number;
};

export function leaderboard(): LeaderboardEntry[] {
  const db = getDb();
  const users = db.prepare("SELECT id, name FROM users ORDER BY name COLLATE NOCASE").all() as {
    id: number;
    name: string;
  }[];
  const rows = db
    .prepare(
      `SELECT p.*, m.stage, m.status, m.home_score AS mh, m.away_score AS ma, m.winner
       FROM predictions p JOIN matches m ON m.id = p.match_id
       WHERE m.status = 'FINISHED'`
    )
    .all() as (PredictionRow & {
    stage: string;
    status: string;
    mh: number | null;
    ma: number | null;
    winner: string | null;
  })[];

  const byUser = new Map<number, { points: number; exact: number; tendency: number; jokerPoints: number }>();
  for (const r of rows) {
    const res = pointsFor(
      { stage: r.stage, status: r.status, home_score: r.mh, away_score: r.ma, winner: r.winner },
      r
    );
    if (!res) continue;
    const agg = byUser.get(r.user_id) ?? { points: 0, exact: 0, tendency: 0, jokerPoints: 0 };
    agg.points += res.total;
    if (res.exact) agg.exact++;
    if (res.tendency) agg.tendency++;
    if (r.joker) agg.jokerPoints += res.total - res.base;
    byUser.set(r.user_id, agg);
  }

  const counts = db
    .prepare("SELECT user_id, COUNT(*) AS c FROM predictions GROUP BY user_id")
    .all() as { user_id: number; c: number }[];
  const countMap = new Map(counts.map((c) => [c.user_id, c.c]));

  const entries: LeaderboardEntry[] = users.map((u) => {
    const agg = byUser.get(u.id) ?? { points: 0, exact: 0, tendency: 0, jokerPoints: 0 };
    return { userId: u.id, name: u.name, ...agg, predictions: countMap.get(u.id) ?? 0, rank: 0 };
  });

  // Tiebreak: points → exact scores → correct tendencies → joker points
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.tendency - a.tendency ||
      b.jokerPoints - a.jokerPoints ||
      a.name.localeCompare(b.name)
  );
  let rank = 0;
  let prevKey = "";
  entries.forEach((e, i) => {
    const key = `${e.points}|${e.exact}|${e.tendency}|${e.jokerPoints}`;
    if (key !== prevKey) {
      rank = i + 1;
      prevKey = key;
    }
    e.rank = rank;
  });
  return entries;
}

export type GroupStanding = {
  team: string;
  tla: string | null;
  crest: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
};

export function groupStandings(): Map<string, GroupStanding[]> {
  const matches = getDb()
    .prepare("SELECT * FROM matches WHERE stage = 'GROUP_STAGE' ORDER BY grp, kickoff")
    .all() as MatchRow[];
  const groups = new Map<string, Map<string, GroupStanding>>();
  for (const m of matches) {
    if (!m.grp || !m.home_team || !m.away_team) continue;
    if (!groups.has(m.grp)) groups.set(m.grp, new Map());
    const g = groups.get(m.grp)!;
    for (const [team, tla, crest] of [
      [m.home_team, m.home_tla, m.home_crest],
      [m.away_team, m.away_tla, m.away_crest],
    ] as const) {
      if (!g.has(team)) {
        g.set(team, { team, tla, crest, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 });
      }
    }
    if (m.status === "FINISHED" && m.home_score != null && m.away_score != null) {
      const home = g.get(m.home_team)!;
      const away = g.get(m.away_team)!;
      home.played++;
      away.played++;
      home.gf += m.home_score;
      home.ga += m.away_score;
      away.gf += m.away_score;
      away.ga += m.home_score;
      if (m.home_score > m.away_score) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (m.home_score < m.away_score) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.points++;
        away.points++;
      }
    }
  }
  const out = new Map<string, GroupStanding[]>();
  for (const [grp, teams] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out.set(
      grp,
      [...teams.values()].sort(
        (a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team)
      )
    );
  }
  return out;
}
