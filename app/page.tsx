import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync, hasApiKey } from "@/lib/fd";
import { allMatches, predictionsByUser, leaderboard } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { dayKey, fmtDay } from "@/lib/format";
import { isLocked } from "@/lib/rules";
import { MatchCard } from "@/components/MatchCard";
import { Logo } from "@/components/Logo";
import { TzToggle } from "@/components/time";

export const dynamic = "force-dynamic";

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  await maybeSync();

  const { view: rawView } = await searchParams;
  const view = rawView === "results" || rawView === "all" ? rawView : "upcoming";

  const matches = allMatches();
  const myPredictions = predictionsByUser(user.id);
  const counts = new Map(
    (getDb().prepare("SELECT match_id, COUNT(*) AS c FROM predictions GROUP BY match_id").all() as {
      match_id: number;
      c: number;
    }[]).map((r) => [r.match_id, r.c])
  );

  const todayKey = dayKey(new Date().toISOString());
  let visible = matches;
  if (view === "upcoming") {
    visible = matches.filter((m) => dayKey(m.kickoff) >= todayKey && m.status !== "FINISHED");
  } else if (view === "results") {
    visible = matches.filter((m) => m.status === "FINISHED").reverse();
  }

  const byDay = new Map<string, typeof matches>();
  for (const m of visible) {
    const k = dayKey(m.kickoff);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(m);
  }

  const openBets = matches.filter(
    (m) => !isLocked(m) && !myPredictions.has(m.id) && m.home_team && m.away_team
  ).length;

  const me = leaderboard().find((e) => e.userId === user.id);
  const myPoints = me?.points ?? 0;

  const now = Date.now();
  const nextMatch = matches
    .filter((m) => m.status !== "FINISHED" && new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];

  const nextKickoff = nextMatch
    ? fmtCountdown(new Date(nextMatch.kickoff).getTime() - now)
    : "—";

  const liveCount = matches.filter(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  ).length;

  let featuredLiveId: number | null = null;

  return (
    <>
      <section className="hero">
        <div className="hero-mark" aria-hidden="true">
          <Logo size={210} />
        </div>
        {liveCount > 0 ? (
          <span className="hero-live-badge chip chip-live">
            {liveCount} live
          </span>
        ) : null}
        <h1>
          World Cup betting. <em>Simplified!</em>
        </h1>
        <p className="hero-meta mono">3 · 1 · 0 points — jokers double</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <TzToggle />
          <Link href="/rules" className="hero-rules mono">
            How it works →
          </Link>
        </div>
      </section>

      <div className="stat-strip">
        <div className="stat-tile">
          <p className="mono">Open bets</p>
          <p className={`stat-value${openBets > 0 ? " accent" : ""}`}>{openBets}</p>
        </div>
        <div className="stat-tile">
          <p className="mono">Your pts</p>
          <p className="stat-value">{myPoints}</p>
        </div>
        <div className="stat-tile">
          <p className="mono">Next kick</p>
          <p className={`stat-value${nextMatch ? " warn" : ""}`}>{nextKickoff}</p>
        </div>
      </div>

      <div className="section-tabs">
        <Link href="/?view=upcoming" className={view === "upcoming" ? "active" : ""}>
          Upcoming
        </Link>
        <Link href="/?view=results" className={view === "results" ? "active" : ""}>
          Results
        </Link>
        <Link href="/?view=all" className={view === "all" ? "active" : ""}>
          All matches
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="empty">
          <p>No fixtures loaded yet.</p>
          {hasApiKey() ? (
            <p>The schedule will appear after the first sync.</p>
          ) : (
            <p className="mono">Set FOOTBALL_DATA_API_KEY and sync from the admin page.</p>
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">Nothing here yet.</div>
      ) : (
        [...byDay.entries()].map(([k, dayMatches]) => (
          <section key={k}>
            <div className="dayhead">
              <h2>{k === todayKey ? "Today" : fmtDay(dayMatches[0].kickoff)}</h2>
              <span className="mono" style={{ fontSize: 10 }}>
                {dayMatches.length} match{dayMatches.length === 1 ? "" : "es"}
              </span>
            </div>
            <div className="matchlist">
              {dayMatches.map((m) => {
                const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
                const featured = isLive && featuredLiveId === null;
                if (featured) featuredLiveId = m.id;
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    myPrediction={myPredictions.get(m.id)}
                    betCount={counts.get(m.id) ?? 0}
                    featured={featured}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
