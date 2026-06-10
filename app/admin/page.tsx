import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { hasApiKey } from "@/lib/fd";
import { getDb, getMeta, type MatchRow } from "@/lib/db";
import { SyncButton, AdminResultForm, ResetPinForm } from "@/components/AdminPanel";
import { fmtDay, fmtTime } from "@/lib/format";
import { isKnockout, STAGE_LABELS } from "@/lib/rules";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) redirect("/");

  const lastSync = getMeta("last_sync");
  const db = getDb();
  const stats = {
    users: (db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c,
    matches: (db.prepare("SELECT COUNT(*) c FROM matches").get() as { c: number }).c,
    predictions: (db.prepare("SELECT COUNT(*) c FROM predictions").get() as { c: number }).c,
  };

  const players = db
    .prepare("SELECT id, name, is_admin FROM users ORDER BY name COLLATE NOCASE")
    .all() as { id: number; name: string; is_admin: number }[];

  // Matches that have started recently, are live, or recently finished — the
  // ones an admin might need to correct or enter manually.
  const editable = db
    .prepare(
      `SELECT * FROM matches
       WHERE home_team IS NOT NULL
         AND kickoff <= datetime('now')
         AND kickoff >= datetime('now', '-4 days')
       ORDER BY kickoff DESC LIMIT 20`
    )
    .all() as MatchRow[];

  return (
    <>
      <div className="dayhead">
        <h2>Admin</h2>
      </div>

      <div className="card">
        <div className="statrow">
          <span>Players</span>
          <span className="pts">{stats.users}</span>
        </div>
        <div className="statrow">
          <span>Fixtures loaded</span>
          <span className="pts">{stats.matches}</span>
        </div>
        <div className="statrow">
          <span>Bets placed</span>
          <span className="pts">{stats.predictions}</span>
        </div>
        <div className="statrow">
          <span>football-data.org API key</span>
          <span className={`chip ${hasApiKey() ? "chip-ok" : ""}`}>
            {hasApiKey() ? "configured" : "missing"}
          </span>
        </div>
        <div className="statrow">
          <span>Last sync</span>
          <span className="mono" style={{ fontSize: 11 }}>
            {lastSync ? `${fmtDay(lastSync)} ${fmtTime(lastSync)}` : "never"}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SyncButton />
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
        Results also sync automatically every few minutes around kick-off times. Manual entries
        below are marked as overrides and won&apos;t be overwritten by the sync.
      </p>

      <div className="dayhead">
        <h2 style={{ fontSize: 16 }}>Enter or correct results</h2>
      </div>
      {editable.length === 0 ? (
        <div className="empty">No started matches in the last 4 days.</div>
      ) : (
        <div className="matchlist">
          {editable.map((m) => (
            <div className="card" key={m.id}>
              <div className="match-top">
                <span className="chip">{m.grp ?? STAGE_LABELS[m.stage] ?? m.stage}</span>
                <span className="mono" style={{ fontSize: 10 }}>
                  {fmtDay(m.kickoff)} {fmtTime(m.kickoff)} · {m.status}
                  {m.manual_override ? " · override" : ""}
                </span>
              </div>
              <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 14.5 }}>
                {m.home_team} vs {m.away_team}
              </p>
              <AdminResultForm
                matchId={m.id}
                knockout={isKnockout(m.stage)}
                homeTeam={m.home_team ?? "Home"}
                awayTeam={m.away_team ?? "Away"}
                currentHome={m.home_score}
                currentAway={m.away_score}
                currentWinner={m.winner}
              />
            </div>
          ))}
        </div>
      )}

      <div className="dayhead">
        <h2 style={{ fontSize: 16 }}>Players — reset a forgotten PIN</h2>
      </div>
      <div className="matchlist">
        {players.map((p) => (
          <div className="card" key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontWeight: 600 }}>
              {p.name}
              {p.is_admin ? <span className="chip chip-accent" style={{ marginLeft: 8 }}>admin</span> : null}
            </span>
            <ResetPinForm userId={p.id} name={p.name} />
          </div>
        ))}
      </div>
    </>
  );
}
