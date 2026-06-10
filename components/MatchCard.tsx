import Link from "next/link";
import type { MatchRow, PredictionRow } from "@/lib/db";
import { isLocked, isFinished, pointsFor, STAGE_LABELS } from "@/lib/rules";
import { TeamBadge } from "./TeamBadge";
import { Kickoff } from "./time";

export function MatchCard({
  match,
  myPrediction,
  betCount,
}: {
  match: MatchRow;
  myPrediction?: PredictionRow;
  betCount: number | null;
}) {
  const locked = isLocked(match);
  const finished = isFinished(match);
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const stageLabel = match.grp ?? STAGE_LABELS[match.stage] ?? match.stage;
  const res = myPrediction ? pointsFor(match, myPrediction) : null;
  const open = !locked && !!match.home_team && !!match.away_team;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`match${live ? " live" : ""}${open && !myPrediction ? " bettable" : ""}`}
    >
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
      <div className="match-foot">
        {myPrediction ? (
          <span className="mybet">
            <svg viewBox="0 0 96 96" width="13" height="13" fill="none" aria-hidden="true">
              <path d="M14 70 L48 14 L82 70" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
            </svg>
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
        ) : open ? (
          <span className="cta-bet">
            <svg viewBox="0 0 96 96" width="12" height="12" fill="none" aria-hidden="true">
              <path d="M14 70 L48 14 L82 70" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
              <path d="M48 14 L48 50" stroke="currentColor" strokeWidth="14" opacity="0.4" />
            </svg>
            Place your bet
          </span>
        ) : (
          <span className="nobet">Teams TBD</span>
        )}
        {betCount != null ? (
          <span className="mono" style={{ fontSize: 10 }}>
            {betCount} bet{betCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
