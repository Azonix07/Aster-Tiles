import { NextResponse } from "next/server";
import { getDb, verifyPassword } from "@/lib/db";
import { createAndSetSession } from "@/lib/auth";

/** Loose phone comparison: digits only, ignore leading zeros and country
 *  prefixes ("+353 89 428 8016" matches "089 428 8016"). */
function phonesMatch(a: string | undefined, b: string): boolean {
  const da = (a ?? "").replace(/\D/g, "").replace(/^0+/, "");
  const db = b.replace(/\D/g, "").replace(/^0+/, "");
  if (da.length < 7 || db.length < 7) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // `identifier` may be an email address or a phone number; older clients send `email`.
  const identifier = String(body?.identifier ?? body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const isEmail = identifier.includes("@");
  const user = getDb().users.find((u) =>
    isEmail ? u.email === identifier : phonesMatch(u.phone, identifier),
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: isEmail ? "Wrong email or password." : "Wrong email/phone or password." },
      { status: 401 },
    );
  }

  await createAndSetSession(user);
  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
