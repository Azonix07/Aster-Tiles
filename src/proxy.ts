import fs from "fs";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

interface MinimalDb {
  settings?: { maintenance?: { fullSite?: boolean } };
  sessions?: { token: string; userId: string; expiresAt: string }[];
  users?: { id: string; isAdmin: boolean }[];
}

/**
 * Full-site maintenance gate. When switched on in the admin panel every
 * visitor is shown /maintenance — except admins, who browse normally.
 * (Payments-only maintenance is handled inside the checkout/order flow.)
 */
export function proxy(request: NextRequest) {
  try {
    if (!fs.existsSync(DB_FILE)) return NextResponse.next();
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as MinimalDb;
    if (!db.settings?.maintenance?.fullSite) return NextResponse.next();

    const token = request.cookies.get("aster_session")?.value;
    if (token) {
      const session = db.sessions?.find(
        (s) => s.token === token && Date.parse(s.expiresAt) > Date.now(),
      );
      const user = session ? db.users?.find((u) => u.id === session.userId) : undefined;
      if (user?.isAdmin) return NextResponse.next();
    }

    return NextResponse.rewrite(new URL("/maintenance", request.url));
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  // Pages only — skip APIs, the admin panel, the login page (so the admin can
  // get in), the maintenance page itself, and all static assets/files.
  matcher: ["/((?!api|_next|admin|login|maintenance|favicon\\.ico|icon\\.svg|.*\\..*).*)"],
};
