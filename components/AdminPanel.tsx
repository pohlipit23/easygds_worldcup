"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sync() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/sync", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setMsg(data.ok ? `Synced ${data.count} matches.` : data.error ?? "Sync failed.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button className="btn btn-primary" disabled={busy} onClick={sync}>
        {busy ? "Syncing…" : "Sync fixtures & results now"}
      </button>
      {msg ? <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{msg}</span> : null}
    </div>
  );
}

export function ResetPinForm({ userId, name }: { userId: number; name: string }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "PIN updated." : data.error ?? "Failed.");
    if (res.ok) setPin("");
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="New PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
        style={{ width: 110, padding: "8px 10px" }}
        aria-label={`New PIN for ${name}`}
      />
      <button className="btn" style={{ padding: "8px 14px", fontSize: 13.5 }} disabled={busy || pin.length < 4} onClick={reset}>
        {busy ? "…" : "Reset PIN"}
      </button>
      {msg ? <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{msg}</span> : null}
    </div>
  );
}

export function AdminResultForm({
  matchId,
  knockout,
  homeTeam,
  awayTeam,
  currentHome,
  currentAway,
  currentWinner,
}: {
  matchId: number;
  knockout: boolean;
  homeTeam: string;
  awayTeam: string;
  currentHome: number | null;
  currentAway: number | null;
  currentWinner: string | null;
}) {
  const router = useRouter();
  const [home, setHome] = useState(currentHome ?? 0);
  const [away, setAway] = useState(currentAway ?? 0);
  const [winner, setWinner] = useState<string>(currentWinner ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const needsWinner = knockout && home === away;

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, home, away, winner: needsWinner ? winner : undefined }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Saved." : data.error ?? "Failed.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <input
        type="number"
        min={0}
        value={home}
        onChange={(e) => setHome(Math.max(0, Number(e.target.value) || 0))}
        style={{ width: 64, textAlign: "center" }}
        aria-label={`${homeTeam} goals`}
      />
      <span className="vs">:</span>
      <input
        type="number"
        min={0}
        value={away}
        onChange={(e) => setAway(Math.max(0, Number(e.target.value) || 0))}
        style={{ width: 64, textAlign: "center" }}
        aria-label={`${awayTeam} goals`}
      />
      {needsWinner ? (
        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--line-strong)",
            background: "var(--bg-raised)",
            color: "var(--text)",
            font: "inherit",
          }}
          aria-label="Penalty winner"
        >
          <option value="">Pens winner…</option>
          <option value="HOME_TEAM">{homeTeam}</option>
          <option value="AWAY_TEAM">{awayTeam}</option>
        </select>
      ) : null}
      <button className="btn" disabled={busy || (needsWinner && !winner)} onClick={save}>
        {busy ? "…" : "Save final result"}
      </button>
      {msg ? <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{msg}</span> : null}
    </div>
  );
}
