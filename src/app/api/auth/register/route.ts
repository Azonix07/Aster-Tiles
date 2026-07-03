import { NextResponse } from "next/server";
import { createSession, hashPassword, mutateDb, newId, type User } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = mutateDb((db): User | null => {
    if (db.users.some((u) => u.email === email)) return null;
    const created: User = {
      id: newId(),
      name,
      email,
      passwordHash: hashPassword(password),
      isAdmin: false,
      addresses: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });

  if (!user) {
    return NextResponse.json(
      { error: "An account with that email already exists — try logging in." },
      { status: 409 },
    );
  }

  const session = createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ ok: true });
}
