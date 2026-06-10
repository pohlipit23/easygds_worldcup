// IANA timezones for the 16 host cities of the 2026 World Cup.
// Matched by substring against the venue/city string from football-data.org.
const VENUE_TZ: [string, string][] = [
  ["mexico city", "America/Mexico_City"],
  ["azteca", "America/Mexico_City"],
  ["guadalajara", "America/Mexico_City"],
  ["zapopan", "America/Mexico_City"],
  ["akron", "America/Mexico_City"],
  ["monterrey", "America/Monterrey"],
  ["toronto", "America/Toronto"],
  ["vancouver", "America/Vancouver"],
  ["seattle", "America/Los_Angeles"],
  ["san francisco", "America/Los_Angeles"],
  ["santa clara", "America/Los_Angeles"],
  ["levi", "America/Los_Angeles"],
  ["los angeles", "America/Los_Angeles"],
  ["inglewood", "America/Los_Angeles"],
  ["sofi", "America/Los_Angeles"],
  ["kansas city", "America/Chicago"],
  ["arrowhead", "America/Chicago"],
  ["dallas", "America/Chicago"],
  ["arlington", "America/Chicago"],
  ["at&t", "America/Chicago"],
  ["houston", "America/Chicago"],
  ["nrg", "America/Chicago"],
  ["atlanta", "America/New_York"],
  ["mercedes-benz", "America/New_York"],
  ["miami", "America/New_York"],
  ["hard rock", "America/New_York"],
  ["new york", "America/New_York"],
  ["new jersey", "America/New_York"],
  ["east rutherford", "America/New_York"],
  ["metlife", "America/New_York"],
  ["philadelphia", "America/New_York"],
  ["lincoln financial", "America/New_York"],
  ["boston", "America/New_York"],
  ["foxborough", "America/New_York"],
  ["gillette", "America/New_York"],
];

export function resolveVenueTz(venue: string | null | undefined): string | null {
  if (!venue) return null;
  const v = venue.toLowerCase();
  for (const [needle, tz] of VENUE_TZ) {
    if (v.includes(needle)) return tz;
  }
  return null;
}
