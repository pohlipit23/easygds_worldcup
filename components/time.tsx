"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Kickoff times are rendered client-side in either the viewer's timezone
// ("Your time") or the stadium's local timezone ("Stadium"). The preference
// lives in localStorage and every <Kickoff> on the page updates instantly.

type TzMode = "local" | "venue";
const KEY = "tzmode";
const EVENT = "tzmode-change";

function getMode(): TzMode {
  if (typeof window === "undefined") return "local";
  return localStorage.getItem(KEY) === "venue" ? "venue" : "local";
}

function setMode(mode: TzMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useTzMode(): TzMode {
  return useSyncExternalStore(subscribe, getMode, () => "local");
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// Server-side fallback so SSR/first paint shows company time, then the client
// corrects to the device timezone after hydration.
const SSR_TZ = "Europe/Berlin";

function fmt(
  iso: string,
  tz: string | undefined,
  kind: "time" | "day" | "daytime" | "short",
  withLabel: boolean
): string {
  const d = new Date(iso);
  const base: Intl.DateTimeFormatOptions = { timeZone: tz, hour12: false };
  let opts: Intl.DateTimeFormatOptions;
  if (kind === "time") {
    opts = { ...base, hour: "2-digit", minute: "2-digit" };
  } else if (kind === "day") {
    opts = { ...base, weekday: "short", day: "numeric", month: "short" };
  } else if (kind === "short") {
    opts = { ...base, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  } else {
    opts = { ...base, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  }
  if (withLabel) opts.timeZoneName = "short";
  try {
    return new Intl.DateTimeFormat("en-GB", opts).format(d).replace(",", " ·");
  } catch {
    // Unknown IANA zone string — fall back to UTC rather than crash.
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(d).replace(",", " ·");
  }
}

export function Kickoff({
  iso,
  venueTz,
  kind = "time",
  withLabel = false,
}: {
  iso: string;
  venueTz: string | null;
  kind?: "time" | "day" | "daytime" | "short";
  withLabel?: boolean;
}) {
  const mode = useTzMode();
  const mounted = useMounted();
  const tz =
    mode === "venue"
      ? venueTz ?? "UTC"
      : mounted
        ? undefined // device timezone
        : SSR_TZ;
  return (
    <span suppressHydrationWarning>
      {fmt(iso, tz, kind, withLabel || (mode === "venue" && kind !== "day"))}
    </span>
  );
}

export function TzToggle({ compact = false }: { compact?: boolean }) {
  const mode = useTzMode();
  return (
    <div className={`tztoggle${compact ? " compact" : ""}`} role="group" aria-label="Time zone display">
      <button className={mode === "local" ? "active" : ""} onClick={() => setMode("local")}>
        Your time
      </button>
      <button className={mode === "venue" ? "active" : ""} onClick={() => setMode("venue")}>
        Stadium
      </button>
    </div>
  );
}
