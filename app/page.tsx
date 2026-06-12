import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync, hasApiKey } from "@/lib/fd";
import { allMatches, predictionsByUser } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { MatchListByDay } from "@/components/MatchListByDay";
import { Logo } from "@/components/Logo";
import { TzToggle } from "@/components/time";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <section className="hero">
        <div className="hero-mark" aria-hidden="true">
          <Logo size={210} />
        </div>
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
      ) : (
        <MatchListByDay
          matches={matches}
          view={view}
          myPredictions={[...myPredictions.values()]}
          counts={Object.fromEntries(counts)}
        />
      )}
    </>
  );
}
