<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Self-contained Next.js 16 (App Router) + React 19 app backed by `better-sqlite3`. The SQLite DB lives in `data/worldcup.db` (gitignored) and is created lazily — no external services needed.

- Run dev: `npm run dev` → http://localhost:3000. Build: `npm run build` (also runs the TypeScript type-check). Scripts are in `package.json`; there is no test or lint script configured.
- No `FOOTBALL_DATA_API_KEY` is required for local dev — run with demo data instead (see README "demo data" section).
- DB-creation gotcha: pages requiring auth redirect to `/login` before touching the DB, so the DB file is only created on the first `POST /api/auth` (e.g. any signup/login attempt calls `getDb()`).
- Seeding gotcha: `node scripts/seed-demo.mjs` fails on a brand-new DB with `table matches has no column named venue`, because `scripts/schema-check.sql` omits the `venue`/`venue_tz` columns that `lib/db.ts` adds via its runtime migration. Workaround without code changes: let the app create the schema first (e.g. `curl -X POST localhost:3000/api/auth -H 'Content-Type: application/json' -d '{"mode":"login","name":"zz","pin":"0000"}'`, which creates no user but builds the full schema), then run the seed script.
- Demo logins after seeding: `Demo Anna`/`1111`, `Demo Ben`/`2222`, `Demo Carla`/`3333`. The first non-demo account to sign up becomes the admin. Demo matches use negative ids and vanish on the first real API sync.
