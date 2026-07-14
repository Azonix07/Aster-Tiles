import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/jwt";

// NOTE: this runs on the Edge runtime, so it cannot import "@/lib/db" (it pulls in
// node:fs). We read the durable store directly: Redis over REST in production, and a
// tiny Node API route as a fallback in local dev where only the file store exists.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_DB_KEY = "aster:db";

/** Is full-site maintenance switched on? Reads whichever store is active. */
async function fullSiteMaintenanceOn(request: NextRequest): Promise<boolean> {
  try {
    if (KV_URL && KV_TOKEN) {
      const res = await fetch(KV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(["GET", KV_DB_KEY]),
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { result: string | null };
      if (!data.result) return false;
      const db = JSON.parse(data.result) as {
        settings?: { maintenance?: { fullSite?: boolean } };
      };
      return Boolean(db.settings?.maintenance?.fullSite);
    }
    // Local dev: ask a Node route that can read the file store.
    const res = await fetch(new URL("/api/system/status", request.url), { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { maintenance?: { fullSite?: boolean } };
    return Boolean(data.maintenance?.fullSite);
  } catch {
    return false;
  }
}

/**
 * Full-site maintenance gate. When switched on in the admin panel every visitor is
 * shown /maintenance — except admins/team, who browse normally. (Payments-only
 * maintenance is handled inside the checkout/order flow.)
 */
export async function proxy(request: NextRequest) {
  if (!(await fullSiteMaintenanceOn(request))) return NextResponse.next();

  const token = request.cookies.get("aster_session")?.value;
  if (token) {
    const payload = await verifySession(token);
    // Anyone with back-office access (admin/manager/staff) bypasses the gate.
    if (payload?.isAdmin || (payload?.role && payload.role !== "customer")) {
      return NextResponse.next();
    }
  }

  return NextResponse.rewrite(new URL("/maintenance", request.url));
}

export const config = {
  // Pages only — skip APIs, the admin panel, the login page (so the admin can
  // get in), the maintenance page itself, and all static assets/files.
  matcher: ["/((?!api|_next|admin|login|maintenance|favicon\\.ico|icon\\.svg|.*\\..*).*)"],
};
