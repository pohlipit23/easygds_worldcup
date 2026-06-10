import Link from "next/link";
import type { MatchRow } from "@/lib/db";
import { TeamBadge } from "./TeamBadge";
import { Kickoff } from "./time";

// Knockout draw rendered as a classic bracket: both halves feed from the
// outside columns into the final at the centre. Matches within a stage are
// split half/half between the left and right side in kickoff/id order.

const KO_STAGES = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS"] as const;
const STAGE_SHORT: Record<string, string> = {
  LAST_32: "R32",
  LAST_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  FINAL: "Final",
  THIRD_PLACE: "3rd place",
};
const EXPECTED: Record<string, number> = {
  LAST_32: 16,
  LAST_16: 8,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 2,
};

function sortStage(matches: MatchRow[]): MatchRow[] {
  return [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id);
}

function BkMatch({ match, final }: { match: MatchRow | null; final?: boolean }) {
  if (!match) {
    return (
      <div className="bk-match" style={{ opacity: 0.5 }}>
        <div className="bk-row">
          <span className="badge">·</span>
          <span className="name">TBD</span>
        </div>
        <div className="bk-row">
          <span className="badge">·</span>
          <span className="name">TBD</span>
        </div>
      </div>
    );
  }
  const finished = match.status === "FINISHED";
  const homeWon = finished && match.winner === "HOME_TEAM";
  const awayWon = finished && match.winner === "AWAY_TEAM";
  const body = (
    <>
      <div
        className={`bk-row${homeWon ? " winner" : ""}${awayWon ? " loser" : ""}`}
        title={match.home_team ?? undefined}
      >
        <TeamBadge crest={match.home_crest} tla={match.home_tla} name={match.home_team} />
        <span className="name">{match.home_tla ?? match.home_team ?? "TBD"}</span>
        {finished ? <span className="sc">{match.home_score}</span> : null}
      </div>
      <div
        className={`bk-row${awayWon ? " winner" : ""}${homeWon ? " loser" : ""}`}
        title={match.away_team ?? undefined}
      >
        <TeamBadge crest={match.away_crest} tla={match.away_tla} name={match.away_team} />
        <span className="name">{match.away_tla ?? match.away_team ?? "TBD"}</span>
        {finished ? <span className="sc">{match.away_score}</span> : null}
      </div>
      <div className="bk-meta">
        <span>{STAGE_SHORT[match.stage] ?? ""}</span>
        <span>
          {finished ? "FT" : <Kickoff iso={match.kickoff} venueTz={match.venue_tz} kind="short" />}
        </span>
      </div>
    </>
  );
  return (
    <Link href={`/match/${match.id}`} className={`bk-match${final ? " final-match" : ""}`}>
      {body}
    </Link>
  );
}

function Column({
  matches,
  expected,
  side,
  label,
}: {
  matches: (MatchRow | null)[];
  expected: number;
  side: "left" | "right";
  label: string;
}) {
  const padded: (MatchRow | null)[] = [...matches];
  while (padded.length < expected) padded.push(null);
  return (
    <div className={`bracket-col side-${side}`}>
      <div className="bracket-col-head mono" style={{ fontSize: 10 }}>
        {label}
      </div>
      {padded.map((m, i) => (
        <BkMatch key={m?.id ?? `${label}-${i}`} match={m} />
      ))}
    </div>
  );
}

export function Bracket({ matches }: { matches: MatchRow[] }) {
  const byStage = new Map<string, MatchRow[]>();
  for (const m of matches) {
    if (!byStage.has(m.stage)) byStage.set(m.stage, []);
    byStage.get(m.stage)!.push(m);
  }

  const leftCols: { label: string; matches: (MatchRow | null)[]; expected: number }[] = [];
  const rightCols: typeof leftCols = [];
  for (const stage of KO_STAGES) {
    const sorted = sortStage(byStage.get(stage) ?? []);
    const half = EXPECTED[stage] / 2;
    leftCols.push({ label: STAGE_SHORT[stage], matches: sorted.slice(0, half), expected: half });
    rightCols.unshift({
      label: STAGE_SHORT[stage],
      matches: sorted.slice(half, EXPECTED[stage]),
      expected: half,
    });
  }
  const final = sortStage(byStage.get("FINAL") ?? [])[0] ?? null;
  const thirdPlace = sortStage(byStage.get("THIRD_PLACE") ?? [])[0] ?? null;

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {leftCols.map((c, i) => (
          <Column key={`l${i}`} {...c} side="left" />
        ))}
        <div className="bracket-col bracket-final">
          <div className="trophy">🏆</div>
          <div className="bracket-col-head mono" style={{ fontSize: 10 }}>
            Final
          </div>
          <BkMatch match={final} final />
          {thirdPlace ? (
            <div style={{ marginTop: 18 }}>
              <div className="bracket-col-head mono" style={{ fontSize: 10 }}>
                Third place
              </div>
              <BkMatch match={thirdPlace} />
            </div>
          ) : null}
        </div>
        {rightCols.map((c, i) => (
          <Column key={`r${i}`} {...c} side="right" />
        ))}
      </div>
    </div>
  );
}
