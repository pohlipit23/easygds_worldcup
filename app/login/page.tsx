"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, name, pin }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 380, margin: "0 auto", paddingTop: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Logo size={64} />
        <h1 style={{ fontSize: 28 }}>World Cup 2026</h1>
        <p style={{ margin: 0, fontWeight: 500, color: "var(--text-muted)" }}>
          World Cup betting. <em style={{ color: "var(--accent)", fontStyle: "normal" }}>Simplified!</em>
        </p>
      </div>

      <div className="section-tabs" style={{ justifyContent: "center" }}>
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          Log in
        </button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          required
          minLength={2}
          maxLength={30}
        />
        <input
          type="password"
          placeholder={mode === "signup" ? "Choose a PIN (4–8 digits)" : "PIN"}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          pattern="\d{4,8}"
        />
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>

      {mode === "signup" ? (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 16 }}>
          Pick the name your colleagues know you by — it appears on the leaderboard. Forgot your
          PIN later? Any admin can reset it for you.
        </p>
      ) : null}
    </div>
  );
}
