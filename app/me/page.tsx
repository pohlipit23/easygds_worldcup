import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync } from "@/lib/fd";
import { allMatches, predictionsByUser, jokerStatus, leaderboard } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  await maybeSync();

  const myPredictions = predictionsByUser(user.id);
  const matches = allMatches().filter((m) => myPredictions.has(m.id));
  const jokers = jokerStatus(user.id);
  const me = leaderboard().find((e) => e.userId === user.id);

  return (
    <>
      <div className="dayhead">
        <h2>{user.name}</h2>
      </div>

      {me ? (
        <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <p className="mono" style={{ margin: 0, fontSize: 10 }}>Rank</p>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "var(--font-jbmono)" }}>#{me.rank}</p>
          </div>
          <div>
            <p className="mono" style={{ margin: 0, fontSize: 10 }}>Points</p>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "var(--font-jbmono)" }}>{me.points}</p>
          </div>
          <div>
            <p className="mono" style={{ margin: 0, fontSize: 10 }}>Exact</p>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "var(--font-jbmono)" }}>{me.exact}</p>
          </div>
          <div>
            <p className="mono" style={{ margin: 0, fontSize: 10 }}>Bets</p>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "var(--font-jbmono)" }}>{me.predictions}</p>
          </div>
        </div>
      ) : null}

      <div className="dayhead">
        <h2 style={{ fontSize: 16 }}>Jokers</h2>
      </div>
      <div className="card" style={{ padding: "4px 16px" }}>
        {jokers.map((j) => (
          <div key={j.phase} className="statrow">
            <span style={{ fontSize: 14.5 }}>{j.label}</span>
            <span className="jokerdots" aria-label={`${j.budget - j.used} of ${j.budget} left`}>
              {Array.from({ length: j.budget }, (_, i) => (
                <span key={i} className={i < j.used ? "spent" : "avail"} />
              ))}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "10px 0 0" }}>
        A joker doubles that match&apos;s points. Filled dots are available, faded ones are spent.
        Unused group-stage jokers don&apos;t carry over.
      </p>

      <div className="dayhead">
        <h2 style={{ fontSize: 16 }}>My bets ({matches.length})</h2>
      </div>
      {matches.length === 0 ? (
        <div className="empty">You haven&apos;t placed any bets yet.</div>
      ) : (
        <div className="matchlist">
          {matches
            .slice()
            .reverse()
            .map((m) => (
              <MatchCard key={m.id} match={m} myPrediction={myPredictions.get(m.id)} betCount={null} />
            ))}
        </div>
      )}
    </>
  );
}
