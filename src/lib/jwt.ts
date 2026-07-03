/**
 * Lightweight signed session token (HMAC-SHA256) that works
 * across Vercel serverless instances without shared storage.
 *
 * Payload: { userId, isAdmin, exp }
 * Secret:  SESSION_SECRET env var (falls back to a hard-coded dev secret)
 */

const DEV_SECRET = "aster-tiles-dev-secret-change-in-prod";

function getSecret(): string {
  return process.env.SESSION_SECRET ?? DEV_SECRET;
}

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export interface SessionPayload {
  userId: string;
  isAdmin: boolean;
  exp: number; // unix seconds
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await hmac(getSecret(), body);
  return `${body}.${sig}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = await hmac(getSecret(), body);
    if (expected !== sig) return null;
    const payload: SessionPayload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
