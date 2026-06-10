import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import path from "path";
import fs from "fs";
import { cookies } from "next/headers";
import { getDb, type UserRow } from "./db";

const COOKIE = "wc_session";
const SESSION_DAYS = 60;

function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, "session-secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const s = randomBytes(32).toString("hex");
  fs.writeFileSync(file, s, { mode: 0o600 });
  return s;
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 32);
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createToken(userId: number): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  const payload = `${uid}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  if (Number(exp) < Date.now()) return null;
  return Number(uid);
}

export async function setSessionCookie(userId: number) {
  const store = await cookies();
  store.set(COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 3600,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function currentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const uid = verifyToken(token);
  if (uid == null) return null;
  const user = getDb().prepare("SELECT * FROM users WHERE id = ?").get(uid) as UserRow | undefined;
  return user ?? null;
}
