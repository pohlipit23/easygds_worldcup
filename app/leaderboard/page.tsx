import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync } from "@/lib/fd";
import { leaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  await maybeSync();

  const entries = leaderboard();
  const podium = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <>
      <div className="dayhead">
        <h2>Standings</h2>
        <span className="mono" style={{ fontSize: 10 }}>
          {entries.length} player{entries.length === 1 ? "" : "s"}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="empty">No players yet.</div>
      ) : (
        <>
          {podium.length > 0 ? (
            <div className="podium-grid">
              {podium.map((e) => (
                <div
                  key={e.userId}
                  className={`podium-card rank-${e.rank}${e.userId === user.id ? " is-me" : ""}`}
                  style={{ animationDelay: `${e.rank * 0.06}s` }}
                >
                  <span className="podium-rank">#{e.rank}</span>
                  <div className="podium-info">
                    <p className="podium-name">{e.name}</p>
                    <p className="podium-meta">
                      {e.exact} exact · {e.tendency} tend
                      {e.jokerPoints > 0 ? ` · +${e.jokerPoints} 2×` : ""}
                    </p>
                  </div>
                  <span className="podium-pts">{e.points}</span>
                </div>
              ))}
            </div>
          ) : null}

          {rest.length > 0 ? (
            <div className="card card-flush" style={{ overflowX: "auto" }}>
              <table className="lb">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Exact</th>
                    <th>Tend</th>
                    <th title="Extra points earned from jokers">2×</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((e) => (
                    <tr key={e.userId} className={e.userId === user.id ? "me" : ""}>
                      <td className="rank">{e.rank}</td>
                      <td className="name">{e.name}</td>
                      <td>{e.exact}</td>
                      <td>{e.tendency}</td>
                      <td>{e.jokerPoints > 0 ? `+${e.jokerPoints}` : "·"}</td>
                      <td className="points">{e.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}

      <p className="muted-note">
        3 pts exact score · 1 pt correct outcome · jokers double a match. Ties broken by exact
        scores, then correct outcomes, then joker points.
      </p>
    </>
  );
}
