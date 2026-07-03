import { cookies, headers } from "next/headers";
import { getDb, type User } from "@/lib/db";
import { signSession, verifySession } from "@/lib/jwt";

export const SESSION_COOKIE = "aster_session";

const SESSION_DAYS = 30;

/** The signed-in user for the current request, or null. */
export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  // Fetch the live user record so name / isAdmin changes propagate.
  // If not found (e.g. Vercel ephemeral /tmp wiped), reconstruct from JWT payload.
  const dbUser = getDb().users.find((u) => u.id === payload.userId);
  if (dbUser) return dbUser;

  return {
    id: payload.userId,
    name: payload.name || "User",
    email: payload.email || "",
    phone: payload.phone || "",
    passwordHash: "",
    isAdmin: payload.isAdmin,
    addresses: [],
    createdAt: payload.createdAt || new Date().toISOString(),
  };
}

/** Shape safe to hand to client components. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
}

export function toPublicUser(user: User | null): PublicUser | null {
  if (!user) return null;
  const { id, name, email, phone, isAdmin } = user;
  return { id, name, email, phone: phone ?? "", isAdmin };
}

/**
 * Only mark the cookie Secure when the request actually arrived over https.
 * A NODE_ENV check breaks `next start` reached via a LAN IP (http://192.168…):
 * the browser silently drops the Secure cookie and login appears to do nothing.
 */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return false;
}

export async function createAndSetSession(user: User): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 3600;
  const token = await signSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
    exp,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    expires: new Date(exp * 1000),
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
