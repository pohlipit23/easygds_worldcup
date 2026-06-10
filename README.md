# altovo · World Cup 2026 prediction game

Internal Tippspiel for the FIFA World Cup 2026. Mobile-first, altovo-branded,
light/dark theme, Next.js + SQLite — one self-contained deployment.

## The rules

- **3 points** for the exact score, **1 point** for the correct outcome, **0** otherwise.
- **Knockouts:** you must pick a winner (no draw bets). The scoreline settles on the
  result after 90/120 minutes; the outcome point goes to whoever picked the team
  that advances — **penalties count**.
- **Jokers double a match's points.** Budget: **3 in the group stage**, then **1 per
  knockout round** (the third-place play-off and the final share one). Unused
  jokers don't carry over.
- **Bets are final.** You confirm once and can't change. Betting closes at kick-off.
- **No peeking:** others' bets for a match stay hidden until you've placed your own
  bet (or the match kicks off).
- **Tiebreaker:** points → exact scores → correct outcomes → joker points.
- The first (non-demo) account created becomes the admin. Admins can reset
  forgotten PINs from the admin page.

## Setup

```bash
npm install
cp .env.example .env.local        # add your football-data.org API key
npm run dev                       # http://localhost:3000
```

Get a free API key at [football-data.org](https://www.football-data.org/client/register)
(the free tier includes the World Cup). The schedule and results sync automatically
every ~3 minutes around kick-offs; admins can also sync manually and enter or
override results by hand (e.g. to set the penalty winner if the feed is late).

No API key? Try it with demo data:

```bash
node scripts/seed-demo.mjs
```

Demo fixtures disappear automatically on the first real sync.

## Deploy (VPS / Fly / Render)

```bash
npm run build
npm start                          # serves on PORT (default 3000)
```

- Persist the `data/` directory (SQLite DB + auto-generated session secret) —
  on Fly/Render mount a volume and set `DATA_DIR` to it.
- Set `FOOTBALL_DATA_API_KEY` in the environment.
- Optional: `APP_TZ` (default `Europe/Berlin`) controls displayed kickoff times,
  `SESSION_SECRET` pins the cookie secret across machines.
- Back up by copying `data/worldcup.db`.

## Stack

Next.js 16 (App Router) · React 19 · better-sqlite3 · no other runtime deps.
Brand: altovo brand sheet v1.0 (Sora / JetBrains Mono, navy scale on Paper/Abyss).
