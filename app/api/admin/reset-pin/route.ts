import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser, hashPin } from "@/lib/auth";

// Admins can set a new PIN for any player (the self-service "forgot my PIN" path
// for an internal game: ask an admin).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  let body: { userId?: number; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const pin = (body.pin ?? "").trim();
  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4–8 digits." }, { status: 400 });
  }
  const db = getDb();
  const target = db.prepare("SELECT id, name FROM users WHERE id = ?").get(Number(body.userId)) as
    | { id: number; name: string }
    | undefined;
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  db.prepare("UPDATE users SET pin_hash = ? WHERE id = ?").run(hashPin(pin), target.id);
  return NextResponse.json({ ok: true, name: target.name });
}
