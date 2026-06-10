import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { syncMatches } from "@/lib/fd";

export async function POST() {
  const user = await currentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const result = await syncMatches();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
