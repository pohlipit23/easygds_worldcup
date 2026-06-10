import type { MatchRow, PredictionRow } from "./db";

// Game rules (decided 2026-06-10):
// - 3 pts exact score, 1 pt correct tendency, 0 otherwise.
// - Knockouts: you must pick a winner (no draw predictions). The scoreline is
//   settled on the result after 90/120 minutes; the "tendency" point goes to
//   whoever picked the team that advances, penalties included.
// - Jokers double the points of the match they are placed on. Budget: 3 in the
//   group stage, then 1 per knockout round (third-place play-off and final
//   share one "Final round" joker).
// - Predictions are immutable once confirmed and lock at kickoff.

export const STAGE_ORDER = [
  "GROUP_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

export type JokerPhase = "GROUP" | "LAST_32" | "LAST_16" | "QF" | "SF" | "FINAL";

export const JOKER_PHASES: { phase: JokerPhase; label: string; budget: number }[] = [
  { phase: "GROUP", label: "Group stage", budget: 3 },
  { phase: "LAST_32", label: "Round of 32", budget: 1 },
  { phase: "LAST_16", label: "Round of 16", budget: 1 },
  { phase: "QF", label: "Quarter-finals", budget: 1 },
  { phase: "SF", label: "Semi-finals", budget: 1 },
  { phase: "FINAL", label: "Final round", budget: 1 },
];

export function jokerPhaseOf(stage: string): JokerPhase {
  switch (stage) {
    case "GROUP_STAGE":
      return "GROUP";
    case "LAST_32":
      return "LAST_32";
    case "LAST_16":
      return "LAST_16";
    case "QUARTER_FINALS":
      return "QF";
    case "SEMI_FINALS":
      return "SF";
    default:
      return "FINAL"; // SEMI handled above; THIRD_PLACE + FINAL share one joker
  }
}

export function jokerBudget(phase: JokerPhase): number {
  return JOKER_PHASES.find((p) => p.phase === phase)!.budget;
}

export function isKnockout(stage: string): boolean {
  return stage !== "GROUP_STAGE";
}

export function isLocked(match: Pick<MatchRow, "kickoff" | "status">, now = new Date()): boolean {
  return new Date(match.kickoff).getTime() <= now.getTime() || match.status === "IN_PLAY" || match.status === "PAUSED" || match.status === "FINISHED";
}

export function isFinished(match: Pick<MatchRow, "status">): boolean {
  return match.status === "FINISHED";
}

function tendency(home: number, away: number): -1 | 0 | 1 {
  return home > away ? 1 : home < away ? -1 : 0;
}

/**
 * Points for a single prediction, joker already applied.
 * Returns null when the match has no result yet.
 */
export function pointsFor(
  match: Pick<MatchRow, "stage" | "status" | "home_score" | "away_score" | "winner">,
  pred: Pick<PredictionRow, "home_score" | "away_score" | "joker">
): { base: number; total: number; exact: boolean; tendency: boolean } | null {
  if (match.status !== "FINISHED" || match.home_score == null || match.away_score == null) {
    return null;
  }
  const exact = pred.home_score === match.home_score && pred.away_score === match.away_score;
  let tendencyHit: boolean;
  if (isKnockout(match.stage)) {
    // winner: HOME_TEAM | AWAY_TEAM (penalties included). Predictions can't be draws.
    const predWinner = pred.home_score > pred.away_score ? "HOME_TEAM" : "AWAY_TEAM";
    tendencyHit = match.winner != null && match.winner === predWinner;
  } else {
    tendencyHit =
      tendency(pred.home_score, pred.away_score) === tendency(match.home_score, match.away_score);
  }
  const base = exact ? 3 : tendencyHit ? 1 : 0;
  return { base, total: pred.joker ? base * 2 : base, exact, tendency: !exact && tendencyHit };
}

export function predictionValid(
  match: Pick<MatchRow, "stage" | "home_team" | "away_team">,
  home: number,
  away: number
): string | null {
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    return "Scores must be whole numbers between 0 and 20.";
  }
  if (!match.home_team || !match.away_team) {
    return "Teams for this match are not decided yet.";
  }
  if (isKnockout(match.stage) && home === away) {
    return "Knockout matches need a winner — no draws. Pick the team you think advances (penalties count).";
  }
  return null;
}
