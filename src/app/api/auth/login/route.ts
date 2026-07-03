import { NextResponse } from "next/server";
import { createSession, getDb, verifyPassword } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const user = getDb().users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  const session = createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
