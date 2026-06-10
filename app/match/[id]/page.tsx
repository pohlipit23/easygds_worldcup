import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync } from "@/lib/fd";
import { getMatch, predictionsForMatch, predictionCount, jokersLeft, predictionsByUser } from "@/lib/queries";
import { isLocked, isFinished, isKnockout, pointsFor, STAGE_LABELS, jokerPhaseOf, JOKER_PHASES } from "@/lib/rules";
import { TeamBadge } from "@/components/TeamBadge";
import { PredictForm } from "@/components/PredictForm";
import { Kickoff, TzToggle } from "@/components/time";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  await maybeSync();

  const { id } = await params;
  const match = getMatch(Number(id));
  if (!match) notFound();

  const locked = isLocked(match);
  const finished = isFinished(match);
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const myPrediction = predictionsByUser(user.id).get(match.id);
  const stageLabel = match.grp ?? STAGE_LABELS[match.stage] ?? match.stage;
  const ko = isKnockout(match.stage);
  const phaseLabel = JOKER_PHASES.find((p) => p.phase === jokerPhaseOf(match.stage))!.label;

  return (
    <>
      <div className="page-chips">
        <span className="chip">{stageLabel}</span>
        {match.id < 0 ? <span className="chip chip-demo">Demo</span> : null}
        <span className="chip">
          <Kickoff iso={match.kickoff} venueTz={match.venue_tz} kind="daytime" withLabel />
        </span>
        {match.venue ? <span className="chip">{match.venue}</span> : null}
        {live ? <span className="chip chip-live">Live</span> : null}
        {finished ? <span className="chip">Full time</span> : null}
        {!locked ? <span className="chip chip-ok">Bets open until kick-off</span> : null}
        <TzToggle compact />
      </div>

      <div className="card match-hero">
        <div className="match-grid">
          <div className="predict-team">
            <TeamBadge crest={match.home_crest} tla={match.home_tla} name={match.home_team} />
            <span className="team-code">{match.home_tla ?? "TBD"}</span>
            <span className="mono" style={{ fontSize: 10 }}>
              {match.home_team ?? "to be decided"}
            </span>
          </div>
          <div className={`scorebox lg${finished || live ? "" : " open"}`}>
            {finished || live ? `${match.home_score ?? 0}–${match.away_score ?? 0}` : "vs"}
          </div>
          <div className="predict-team">
            <TeamBadge crest={match.away_crest} tla={match.away_tla} name={match.away_team} />
            <span className="team-code">{match.away_tla ?? "TBD"}</span>
            <span className="mono" style={{ fontSize: 10 }}>
              {match.away_team ?? "to be decided"}
            </span>
          </div>
        </div>
        {finished && ko && match.home_score === match.away_score ? (
          <p className="mono" style={{ textAlign: "center", marginTop: 8 }}>
            {match.winner === "HOME_TEAM" ? match.home_team : match.away_team} advanced on penalties
          </p>
        ) : null}
      </div>

      {myPrediction ? (
        <div className="card bet-locked">
          <div className="bet-locked-head">
            <div>
              <p className="mono" style={{ margin: 0 }}>
                My bet · locked
              </p>
              <p className="bet-locked-score">
                {myPrediction.home_score}–{myPrediction.away_score}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {myPrediction.joker ? <span className="chip chip-gold">2× Joker</span> : null}
              {(() => {
                const res = pointsFor(match, myPrediction);
                return res ? (
                  <p
                    className="pts bet-locked-pts"
                    style={{ color: res.total > 0 ? "var(--ok)" : "var(--warn)" }}
                  >
                    +{res.total} pts
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      ) : !locked && match.home_team && match.away_team ? (
        <PredictForm
          matchId={match.id}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          knockout={ko}
          jokersLeft={jokersLeft(user.id, match.stage)}
          phaseLabel={phaseLabel}
          kickoffIso={match.kickoff}
        />
      ) : !locked ? (
        <div className="empty">Betting opens once both teams are decided.</div>
      ) : (
        <div className="card bet-locked muted-card">
          You didn&apos;t place a bet on this match.
        </div>
      )}

      <section className="bets-section">
        <div className="dayhead">
          <h2>Everyone&apos;s bets</h2>
          <span className="mono" style={{ fontSize: 10 }}>
            {predictionCount(match.id)} placed
          </span>
        </div>
        {locked || myPrediction ? (
          <AllBets matchId={match.id} match={match} myUserId={user.id} />
        ) : (
          <div className="card muted-card">
            Hidden until you&apos;ve placed your own bet (or the match kicks off) — no peeking
            before you commit.
          </div>
        )}
      </section>
    </>
  );
}

function AllBets({
  matchId,
  match,
  myUserId,
}: {
  matchId: number;
  match: NonNullable<ReturnType<typeof getMatch>>;
  myUserId: number;
}) {
  const bets = predictionsForMatch(matchId);
  if (bets.length === 0) {
    return <div className="card muted-card">Nobody bet on this one.</div>;
  }
  return (
    <div className="card card-flush">
      {bets.map((b) => {
        const res = pointsFor(match, b);
        return (
          <div key={b.user_id} className="statrow">
            <span className={`bet-row-name${b.user_id === myUserId ? " me" : ""}`}>
              {b.name}
              {b.user_id === myUserId ? " (you)" : ""}
            </span>
            <span className="bet-row-score">
              {b.joker ? <span className="chip chip-gold">2×</span> : null}
              <span style={{ fontFamily: "var(--font-jbmono)", fontWeight: 700 }}>
                {b.home_score}–{b.away_score}
              </span>
              {res ? (
                <span
                  className="pts bet-row-pts"
                  style={{ color: res.total > 0 ? "var(--ok)" : "var(--warn)" }}
                >
                  +{res.total}
                </span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
