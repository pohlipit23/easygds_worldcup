"use client";

import { useMemo } from "react";
import type { MatchRow, PredictionRow } from "@/lib/db";
import { dayKeyInTz } from "@/lib/format";
import { MatchCard } from "./MatchCard";
import { Kickoff, kickoffTimeZone, useMounted, useTzMode } from "./time";

function groupKey(match: MatchRow, mode: ReturnType<typeof useTzMode>, mounted: boolean): string {
  const tz = kickoffTimeZone(mode, match.venue_tz, mounted);
  const day = dayKeyInTz(match.kickoff, tz);
  // In stadium mode, keep separate sections per venue timezone.
  return mode === "venue" ? `${day}|${tz ?? "UTC"}` : day;
}

function isTodaySection(
  dayMatches: MatchRow[],
  sectionDay: string,
  mode: ReturnType<typeof useTzMode>,
  mounted: boolean
): boolean {
  const ref = dayMatches[0];
  const tz = kickoffTimeZone(mode, ref.venue_tz, mounted);
  return sectionDay === dayKeyInTz(new Date().toISOString(), tz);
}

export function MatchListByDay({
  matches,
  view,
  myPredictions,
  counts,
}: {
  matches: MatchRow[];
  view: "upcoming" | "results" | "all";
  myPredictions: PredictionRow[];
  counts: Record<number, number>;
}) {
  const mode = useTzMode();
  const mounted = useMounted();
  const predictions = useMemo(
    () => new Map(myPredictions.map((p) => [p.match_id, p])),
    [myPredictions]
  );

  const visible = useMemo(() => {
    let list = matches;
    if (view === "upcoming") {
      const nowIso = new Date().toISOString();
      list = matches.filter((m) => {
        if (m.status === "FINISHED") return false;
        const tz = kickoffTimeZone(mode, m.venue_tz, mounted);
        const matchDay = dayKeyInTz(m.kickoff, tz);
        const today = dayKeyInTz(nowIso, tz);
        return matchDay >= today;
      });
    } else if (view === "results") {
      list = matches.filter((m) => m.status === "FINISHED").reverse();
    }
    return list;
  }, [matches, view, mode, mounted]);

  const byDay = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of visible) {
      const k = groupKey(m, mode, mounted);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.entries()].sort(([, a], [, b]) =>
      a[0].kickoff.localeCompare(b[0].kickoff) || a[0].id - b[0].id
    );
  }, [visible, mode, mounted]);

  if (visible.length === 0) {
    return <div className="empty">Nothing here yet.</div>;
  }

  return (
    <>
      {byDay.map(([k, dayMatches]) => {
        const sectionDay = k.split("|")[0];
        const today = isTodaySection(dayMatches, sectionDay, mode, mounted);
        return (
          <section key={k}>
            <div className="dayhead">
              <h2>
                {today ? (
                  "Today"
                ) : (
                  <Kickoff
                    iso={dayMatches[0].kickoff}
                    venueTz={dayMatches[0].venue_tz}
                    kind="day"
                  />
                )}
              </h2>
              <span className="mono" style={{ fontSize: 10 }}>
                {dayMatches.length} match{dayMatches.length === 1 ? "" : "es"}
              </span>
            </div>
            <div className="matchlist">
              {dayMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  myPrediction={predictions.get(m.id)}
                  betCount={counts[m.id] ?? 0}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
