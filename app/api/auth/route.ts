import { NextResponse } from "next/server";
import { getDb, type UserRow } from "@/lib/db";
import { hashPin, verifyPin, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { mode?: string; name?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const pin = (body.pin ?? "").trim();

  if (name.length < 2 || name.length > 30) {
    return NextResponse.json({ error: "Name must be 2–30 characters." }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4–8 digits." }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM users WHERE name = ? COLLATE NOCASE")
    .get(name) as UserRow | undefined;

  if (body.mode === "signup") {
    if (existing) {
      return NextResponse.json(
        { error: "That name is already taken — log in instead." },
        { status: 409 }
      );
    }
    // Demo accounts from scripts/seed-demo.mjs don't count — the first real
    // person to sign up becomes the admin.
    const isFirst =
      (db.prepare("SELECT COUNT(*) AS c FROM users WHERE name NOT LIKE 'Demo %'").get() as {
        c: number;
      }).c === 0;
    const info = db
      .prepare("INSERT INTO users (name, pin_hash, is_admin) VALUES (?, ?, ?)")
      .run(name, hashPin(pin), isFirst ? 1 : 0);
    await setSessionCookie(Number(info.lastInsertRowid));
    return NextResponse.json({ ok: true, admin: isFirst });
  }

  // login
  if (!existing || !verifyPin(pin, existing.pin_hash)) {
    return NextResponse.json({ error: "Wrong name or PIN." }, { status: 401 });
  }
  await setSessionCookie(existing.id);
  return NextResponse.json({ ok: true });
}
