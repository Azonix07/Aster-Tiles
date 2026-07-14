import { NextResponse } from "next/server";
import { mutateDb, hashPassword, verifyPassword, type User } from "@/lib/db";
import { currentUser, createAndSetSession } from "@/lib/auth";

/**
 * PATCH /api/account/profile — the signed-in user edits their own name, phone,
 * email and (optionally) password. Used by the admin profile page and works for
 * any account.
 */
export async function PATCH(request: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    phone?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const phone = body.phone !== undefined ? String(body.phone).trim() : undefined;
  const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
  const wantsPassword = Boolean(body.newPassword);

  if (name !== undefined && name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (phone !== undefined && phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (wantsPassword && String(body.newPassword).length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const result = await mutateDb((db): { user?: User; error?: string; status?: number } => {
    const u = db.users.find((x) => x.id === me.id);
    if (!u) return { error: "Account not found.", status: 404 };

    if (email !== undefined && email !== u.email) {
      if (db.users.some((x) => x.id !== u.id && x.email === email)) {
        return { error: "That email is already in use.", status: 409 };
      }
      u.email = email;
    }
    if (name !== undefined) u.name = name;
    if (phone !== undefined) u.phone = phone;

    if (wantsPassword) {
      if (!u.passwordHash || !verifyPassword(String(body.currentPassword ?? ""), u.passwordHash)) {
        return { error: "Your current password is incorrect.", status: 403 };
      }
      u.passwordHash = hashPassword(String(body.newPassword));
    }
    return { user: u };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  // Refresh the session cookie so the token carries the new name/email.
  if (result.user) await createAndSetSession(result.user);

  return NextResponse.json({ ok: true });
}
