import Link from "next/link";
import type { MatchRow, PredictionRow } from "@/lib/db";
import { isLocked, isFinished, pointsFor, STAGE_LABELS } from "@/lib/rules";
import { TeamBadge } from "./TeamBadge";
import { Kickoff } from "./time";

function ChevronIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M14 70 L48 14 L82 70" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
    </svg>
  );
}

export function MatchCard({
  match,
  myPrediction,
  betCount,
  featured,
}: {
  match: MatchRow;
  myPrediction?: PredictionRow;
  betCount: number | null;
  featured?: boolean;
}) {
  const locked = isLocked(match);
  const finished = isFinished(match);
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const stageLabel = match.grp ?? STAGE_LABELS[match.stage] ?? match.stage;
  const res = myPrediction ? pointsFor(match, myPrediction) : null;

  const open = !locked && !!match.home_team && !!match.away_team;
  const showCta = open && !myPrediction;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`match${live ? " live" : ""}${open && !myPrediction ? " bettable" : ""}${showCta ? " has-cta" : ""}${featured ? " featured" : ""}`}
    >
      <div className="match-body">
        <div className="match-top">
          <span className="chip">{stageLabel}</span>
          {match.id < 0 ? <span className="chip chip-demo">Demo</span> : null}
          {live ? (
            <span className="chip chip-live">Live</span>
          ) : finished ? (
            <span className="chip">FT</span>
          ) : locked ? (
            <span className="chip">Closed</span>
          ) : null}
        </div>
        <div className="match-grid">
          <div className="team" title={match.home_team ?? undefined}>
            <TeamBadge crest={match.home_crest} tla={match.home_tla} name={match.home_team} />
            <span className="name">{match.home_tla ?? match.home_team ?? "TBD"}</span>
          </div>
          <div className={`scorebox${finished || live ? "" : " open"}`}>
            {finished || live ? (
              `${match.home_score ?? 0}–${match.away_score ?? 0}`
            ) : (
              <Kickoff iso={match.kickoff} venueTz={match.venue_tz} kind="time" />
            )}
          </div>
          <div className="team away" title={match.away_team ?? undefined}>
            <TeamBadge crest={match.away_crest} tla={match.away_tla} name={match.away_team} />
            <span className="name">{match.away_tla ?? match.away_team ?? "TBD"}</span>
          </div>
        </div>
        {!showCta ? (
          <div className="match-foot">
            {myPrediction ? (
              <span className="mybet">
                <ChevronIcon size={13} />
                Your bet
                <strong>
                  {myPrediction.home_score}–{myPrediction.away_score}
                </strong>
                {myPrediction.joker ? <span className="chip chip-gold">2×</span> : null}
                {res ? (
                  <strong className="pts" style={{ color: res.total > 0 ? "var(--ok)" : "var(--warn)" }}>
                    +{res.total}
                  </strong>
                ) : null}
              </span>
            ) : locked ? (
              <span className="nobet">No bet placed</span>
            ) : (
              <span className="nobet">Teams TBD</span>
            )}
            {betCount != null ? (
              <span className="mono" style={{ fontSize: 10 }}>
                {betCount} bet{betCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="match-foot">
            {betCount != null ? (
              <span className="mono" style={{ fontSize: 10 }}>
                {betCount} bet{betCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
      {showCta ? (
        <span className="match-cta-bar">
          <ChevronIcon />
          Place your bet
        </span>
      ) : null}
    </Link>
  );
}
