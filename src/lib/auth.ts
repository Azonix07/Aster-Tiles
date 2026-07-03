import { cookies } from "next/headers";
import { getUserByToken, type User } from "@/lib/db";

export const SESSION_COOKIE = "aster_session";

/** The signed-in user for the current request, or null. */
export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  return getUserByToken(store.get(SESSION_COOKIE)?.value);
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
