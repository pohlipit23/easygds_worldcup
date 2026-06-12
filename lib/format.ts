// All times are rendered in the company timezone so everyone sees the same
// kickoff times regardless of device settings. Override with APP_TZ.
const TZ = process.env.APP_TZ || "Europe/Berlin";

export function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Short timezone label for the display timezone, e.g. "CEST". */
export function tzShort(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? TZ;
}

/** Calendar day in `tz` as YYYY-MM-DD. Omit `tz` for the runtime default (device local). */
export function dayKeyInTz(iso: string, tz?: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso));
  }
}

export function dayKey(iso: string): string {
  return dayKeyInTz(iso, TZ);
}
