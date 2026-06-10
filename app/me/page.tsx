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
        <div className="card stats-bar">
          <div>
            <p className="mono stat-label">Rank</p>
            <p className="stat-big">#{me.rank}</p>
          </div>
          <div>
            <p className="mono stat-label">Points</p>
            <p className="stat-big">{me.points}</p>
          </div>
          <div>
            <p className="mono stat-label">Exact</p>
            <p className="stat-big">{me.exact}</p>
          </div>
          <div>
            <p className="mono stat-label">Bets</p>
            <p className="stat-big">{me.predictions}</p>
          </div>
        </div>
      ) : null}

      <div className="dayhead sm">
        <h2>Jokers</h2>
      </div>
      <div className="card card-flush">
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
      <p className="muted-note" style={{ marginTop: 10 }}>
        A joker doubles that match&apos;s points. Filled dots are available, faded ones are spent.
        Unused group-stage jokers don&apos;t carry over.
      </p>

      <div className="dayhead sm">
        <h2>My bets ({matches.length})</h2>
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
