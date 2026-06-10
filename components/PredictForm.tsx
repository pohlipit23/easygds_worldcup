"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PredictForm({
  matchId,
  homeTeam,
  awayTeam,
  knockout,
  jokersLeft,
  phaseLabel,
  kickoffIso,
}: {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  knockout: boolean;
  jokersLeft: number;
  phaseLabel: string;
  kickoffIso: string;
}) {
  const router = useRouter();
  const [home, setHome] = useState(1);
  const [away, setAway] = useState(0);
  const [joker, setJoker] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    function tick() {
      const ms = new Date(kickoffIso).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("closed");
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setRemaining(h > 48 ? `${Math.floor(h / 24)}d ${h % 24}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [kickoffIso]);

  const draw = home === away;
  const invalid = knockout && draw;

  function step(which: "home" | "away", delta: number) {
    const set = which === "home" ? setHome : setAway;
    const val = which === "home" ? home : away;
    set(Math.max(0, Math.min(20, val + delta)));
  }

  async function place() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, home, away, joker }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not place the bet.");
      setConfirming(false);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="card bet-locked">
      <div className="predict-head">
        <h3>Your prediction</h3>
        <span className="mono" style={{ fontSize: 10 }}>
          closes in {remaining}
        </span>
      </div>

      <div className="predict-grid">
        <div className="predict-team">
          <input
            className="scoreinput"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={home}
            onChange={(e) => setHome(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            aria-label={`${homeTeam} goals`}
          />
          <div className="stepper">
            <button type="button" onClick={() => step("home", -1)} aria-label="minus">
              −
            </button>
            <button type="button" onClick={() => step("home", 1)} aria-label="plus">
              +
            </button>
          </div>
        </div>
        <span className="vs">:</span>
        <div className="predict-team">
          <input
            className="scoreinput"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            aria-label={`${awayTeam} goals`}
          />
          <div className="stepper">
            <button type="button" onClick={() => step("away", -1)} aria-label="minus">
              −
            </button>
            <button type="button" onClick={() => step("away", 1)} aria-label="plus">
              +
            </button>
          </div>
        </div>
      </div>

      {invalid ? (
        <p className="error" style={{ textAlign: "center" }}>
          Knockout match — pick a winner. If it goes to penalties, your winner just needs to advance.
        </p>
      ) : null}

      <div
        className={`jokerrow${joker ? " on" : ""}`}
        style={jokersLeft <= 0 ? { opacity: 0.55 } : undefined}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5 }}>Play a joker — double points</p>
          <p className="mono" style={{ margin: 0, fontSize: 10 }}>
            {jokersLeft} left for {phaseLabel}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={joker}
          className="switch"
          disabled={jokersLeft <= 0}
          onClick={() => setJoker((j) => !j)}
          aria-label="Toggle joker"
        />
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button
        className="btn btn-primary btn-block"
        disabled={invalid || busy}
        onClick={() => setConfirming(true)}
      >
        Place bet
      </button>
      <p className="predict-note">
        Bets are final — no changes once confirmed.
      </p>

      {confirming ? (
        <div className="sheet-backdrop" onClick={() => !busy && setConfirming(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-stripe" />
            <div className="sheet-body">
              <p className="mono" style={{ textAlign: "center", margin: 0 }}>
                Confirm your bet
              </p>
              <p style={{ textAlign: "center", margin: "10px 0 0", fontWeight: 600 }}>
                {homeTeam} vs {awayTeam}
              </p>
              <div className="bigscore">
                {home}–{away}
              </div>
              {joker ? (
                <p style={{ textAlign: "center", margin: "0 0 8px" }}>
                  <span className="chip chip-gold">2× Joker played</span>
                </p>
              ) : null}
              <p className="muted-card" style={{ textAlign: "center" }}>
                This is final. You can&apos;t change or cancel it afterwards
                {joker ? " — and the joker is spent" : ""}.
              </p>
              <div className="sheet-actions">
                <button className="btn btn-block" disabled={busy} onClick={() => setConfirming(false)}>
                  Back
                </button>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={place}>
                  {busy ? "Placing…" : "Confirm bet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
