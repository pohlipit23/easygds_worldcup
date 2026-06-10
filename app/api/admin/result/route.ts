import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getMatch } from "@/lib/queries";
import { isKnockout } from "@/lib/rules";

// Manual result entry / override. For knockout matches that finish level after
// 120 minutes, `winner` must say who advanced on penalties.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  let body: { matchId?: number; home?: number; away?: number; winner?: string; clearOverride?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const match = getMatch(Number(body.matchId));
  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const db = getDb();

  if (body.clearOverride) {
    db.prepare("UPDATE matches SET manual_override = 0 WHERE id = ?").run(match.id);
    return NextResponse.json({ ok: true });
  }

  const home = Number(body.home);
  const away = Number(body.away);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return NextResponse.json({ error: "Scores must be non-negative integers." }, { status: 400 });
  }

  let winner: string;
  if (home > away) winner = "HOME_TEAM";
  else if (away > home) winner = "AWAY_TEAM";
  else if (!isKnockout(match.stage)) winner = "DRAW";
  else {
    if (body.winner !== "HOME_TEAM" && body.winner !== "AWAY_TEAM") {
      return NextResponse.json(
        { error: "Level knockout score: specify who advanced on penalties." },
        { status: 400 }
      );
    }
    winner = body.winner;
  }

  db.prepare(
    `UPDATE matches SET home_score = ?, away_score = ?, winner = ?, status = 'FINISHED',
     manual_override = 1 WHERE id = ?`
  ).run(home, away, winner, match.id);
  return NextResponse.json({ ok: true });
}
