import { cookies } from "next/headers";
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
  return getDb().users.find((u) => u.id === payload.userId) ?? null;
}

/** Shape safe to hand to client components. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export function toPublicUser(user: User | null): PublicUser | null {
  if (!user) return null;
  const { id, name, email, isAdmin } = user;
  return { id, name, email, isAdmin };
}

export async function createAndSetSession(user: User): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 3600;
  const token = await signSession({ userId: user.id, isAdmin: user.isAdmin, exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(exp * 1000),
    path: "/",
  });
}

/** @deprecated use createAndSetSession instead */
export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
