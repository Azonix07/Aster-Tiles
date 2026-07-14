import { NextResponse } from "next/server";
import { hashPassword, mutateDb, newId, type User } from "@/lib/db";
import { createAndSetSession } from "@/lib/auth";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();
  const password = String(body?.password ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = await mutateDb((db): User | null => {
    if (db.users.some((u) => u.email === email)) return null;
    const created: User = {
      id: newId(),
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      isAdmin: false,
      role: "customer",
      permissions: [],
      active: true,
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

  await createAndSetSession(user);

  const distinctId = request.headers.get("X-POSTHOG-DISTINCT-ID") || user.id;
  const sessionId = request.headers.get("X-POSTHOG-SESSION-ID") || undefined;
  const posthog = getPostHogClient();
  posthog.identify({ distinctId, properties: { name: user.name } });
  posthog.capture({
    distinctId,
    event: "user_registered",
    properties: { user_id: user.id, $session_id: sessionId },
  });
  await posthog.flush();

  return NextResponse.json({ ok: true });
}
