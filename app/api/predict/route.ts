import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getMatch, jokersLeft } from "@/lib/queries";
import { isLocked, predictionValid } from "@/lib/rules";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { matchId?: number; home?: number; away?: number; joker?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const match = getMatch(Number(body.matchId));
  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  if (isLocked(match)) {
    return NextResponse.json({ error: "Betting closed — this match has kicked off." }, { status: 403 });
  }

  const home = Number(body.home);
  const away = Number(body.away);
  const validationError = predictionValid(match, home, away);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const joker = body.joker === true;
  const db = getDb();

  try {
    const result = db.transaction(() => {
      const existing = db
        .prepare("SELECT 1 FROM predictions WHERE user_id = ? AND match_id = ?")
        .get(user.id, match.id);
      if (existing) return { error: "You already placed a bet on this match — bets are final." };
      if (joker && jokersLeft(user.id, match.stage) <= 0) {
        return { error: "No joker left for this phase of the tournament." };
      }
      db.prepare(
        "INSERT INTO predictions (user_id, match_id, home_score, away_score, joker) VALUES (?, ?, ?, ?, ?)"
      ).run(user.id, match.id, home, away, joker ? 1 : 0);
      return { ok: true };
    })();
    if ("error" in result) return NextResponse.json(result, { status: 409 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not save the bet — try again." }, { status: 500 });
  }
}
