import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { maybeSync } from "@/lib/fd";
import { allMatches, groupStandings } from "@/lib/queries";
import { isKnockout } from "@/lib/rules";
import { Bracket } from "@/components/Bracket";
import { TeamBadge } from "@/components/TeamBadge";

export const dynamic = "force-dynamic";

export default async function DrawPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  await maybeSync();

  const matches = allMatches();
  const koMatches = matches.filter((m) => isKnockout(m.stage));
  const groups = groupStandings();

  return (
    <div className="shell-wide" style={{ margin: "0 auto" }}>
      <div className="dayhead">
        <h2>The road to the final</h2>
      </div>
      {koMatches.length === 0 && matches.length > 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14.5 }}>
          The bracket fills in as the knockout draw is decided.
        </p>
      ) : null}
      <Bracket matches={koMatches} />

      <div className="dayhead" style={{ marginTop: 28 }}>
        <h2>Groups</h2>
      </div>
      {groups.size === 0 ? (
        <div className="empty">Group tables appear once fixtures are loaded.</div>
      ) : (
        <div className="groups-grid">
          {[...groups.entries()].map(([name, standings]) => (
            <div className="card" key={name} style={{ padding: "10px 14px" }}>
              <p className="mono" style={{ margin: "0 0 6px" }}>
                {name}
              </p>
              <table className="grouptable">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>P</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.team} className={i < 2 ? "q" : ""}>
                      <td className="t" title={s.team}>
                        <span className="team">
                          <TeamBadge crest={s.crest} tla={s.tla} name={s.team} />
                          <span className="name">{s.tla ?? s.team}</span>
                        </span>
                      </td>
                      <td>{s.played}</td>
                      <td>
                        {s.gf - s.ga > 0 ? "+" : ""}
                        {s.gf - s.ga}
                      </td>
                      <td style={{ fontWeight: 700 }}>{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      <p className="mono" style={{ fontSize: 10, marginTop: 10 }}>
        Top two of each group qualify directly · best thirds advance to the round of 32
      </p>
    </div>
  );
}
