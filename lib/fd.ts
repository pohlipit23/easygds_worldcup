import { getDb, getMeta, setMeta } from "./db";
import { resolveVenueTz } from "./venues";

// football-data.org v4 sync for the FIFA World Cup (competition code WC).
// The free tier covers the World Cup; set FOOTBALL_DATA_API_KEY in the env.
// score.fullTime in v4 is the score after 90/120 minutes (shootout goals are
// NOT included) and score.winner is the team that advances, penalties
// included — which matches our settlement rules exactly.

const API = "https://api.football-data.org/v4/competitions/WC/matches";

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  venue?: string | null;
  homeTeam: { name: string | null; shortName: string | null; tla: string | null; crest: string | null };
  awayTeam: { name: string | null; shortName: string | null; tla: string | null; crest: string | null };
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
  };
};

export function hasApiKey(): boolean {
  return !!process.env.FOOTBALL_DATA_API_KEY;
}

export async function syncMatches(): Promise<{ ok: boolean; count?: number; error?: string }> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return { ok: false, error: "FOOTBALL_DATA_API_KEY is not set" };

  let res: Response;
  try {
    res = await fetch(API, {
      headers: { "X-Auth-Token": key },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, error: `Fetch failed: ${e instanceof Error ? e.message : e}` };
  }
  if (!res.ok) return { ok: false, error: `football-data.org responded ${res.status}` };

  const data = (await res.json()) as { matches?: FdMatch[] };
  const matches = data.matches ?? [];
  if (matches.length === 0) return { ok: false, error: "API returned no matches" };

  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO matches (id, stage, grp, matchday, kickoff, home_team, away_team,
                         home_tla, away_tla, home_crest, away_crest, status,
                         home_score, away_score, winner, duration, venue, venue_tz)
    VALUES (@id, @stage, @grp, @matchday, @kickoff, @home_team, @away_team,
            @home_tla, @away_tla, @home_crest, @away_crest, @status,
            @home_score, @away_score, @winner, @duration, @venue, @venue_tz)
    ON CONFLICT(id) DO UPDATE SET
      stage = excluded.stage, grp = excluded.grp, matchday = excluded.matchday,
      kickoff = excluded.kickoff,
      home_team = excluded.home_team, away_team = excluded.away_team,
      home_tla = excluded.home_tla, away_tla = excluded.away_tla,
      home_crest = excluded.home_crest, away_crest = excluded.away_crest,
      status = excluded.status,
      home_score = excluded.home_score, away_score = excluded.away_score,
      winner = excluded.winner, duration = excluded.duration,
      venue = excluded.venue, venue_tz = excluded.venue_tz
    WHERE matches.manual_override = 0
  `);

  const tx = db.transaction((rows: FdMatch[]) => {
    for (const m of rows) {
      upsert.run({
        id: m.id,
        stage: m.stage,
        grp: m.group ? m.group.replace(/^GROUP_/, "Group ") : null,
        matchday: m.matchday,
        kickoff: m.utcDate,
        home_team: m.homeTeam?.shortName ?? m.homeTeam?.name ?? null,
        away_team: m.awayTeam?.shortName ?? m.awayTeam?.name ?? null,
        home_tla: m.homeTeam?.tla ?? null,
        away_tla: m.awayTeam?.tla ?? null,
        home_crest: m.homeTeam?.crest ?? null,
        away_crest: m.awayTeam?.crest ?? null,
        status: m.status,
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        winner: m.score?.winner ?? null,
        duration: m.score?.duration ?? null,
        venue: m.venue ?? null,
        venue_tz: resolveVenueTz(m.venue),
      });
    }
    // Demo/manually seeded matches use negative ids; drop them once real data exists.
    db.prepare("DELETE FROM matches WHERE id < 0").run();
  });
  tx(matches);
  setMeta("last_sync", new Date().toISOString());
  return { ok: true, count: matches.length };
}

const SYNC_INTERVAL_MS = 3 * 60 * 1000;

/** Sync at most every 3 minutes, and only when a match could be live or recently ended. */
export async function maybeSync(): Promise<void> {
  if (!hasApiKey()) return;
  const last = getMeta("last_sync");
  if (last && Date.now() - new Date(last).getTime() < SYNC_INTERVAL_MS) return;
  // Skip when nothing is in a "live or imminent" window (kickoff -6h .. +4h)
  const db = getDb();
  const active = db
    .prepare(
      `SELECT COUNT(*) AS c FROM matches
       WHERE kickoff BETWEEN datetime('now', '-4 hours') AND datetime('now', '+6 hours')
          OR status IN ('IN_PLAY','PAUSED')`
    )
    .get() as { c: number };
  const neverSynced = !last;
  if (!neverSynced && active.c === 0) {
    // Still refresh occasionally (hourly) to pick up schedule changes.
    if (Date.now() - new Date(last!).getTime() < 60 * 60 * 1000) return;
  }
  try {
    await syncMatches();
  } catch {
    // Non-fatal: pages render from the existing DB state.
  }
}
