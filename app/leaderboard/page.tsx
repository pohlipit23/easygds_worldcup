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
        <div className="card" style={{ padding: "4px 12px", overflowX: "auto" }}>
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
              {entries.map((e) => (
                <tr key={e.userId} className={e.userId === user.id ? "me" : ""}>
                  <td className={`rank${e.rank <= 3 ? " podium" : ""}`}>{e.rank}</td>
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
      )}
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 12 }}>
        3 pts exact score · 1 pt correct outcome · jokers double a match. Ties broken by exact
        scores, then correct outcomes, then joker points.
      </p>
    </>
  );
}
