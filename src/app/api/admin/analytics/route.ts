import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getAnalytics, posthogConfigured } from "@/lib/posthog";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics?days=30 — PostHog snapshot for the admin panel.
 * Admin-only. Returns { configured: false } (200) when the server-side Personal
 * API key / Project ID aren't set, so the UI can render a setup card.
 */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  if (!posthogConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const days = Number(new URL(request.url).searchParams.get("days")) || 30;

  try {
    const data = await getAnalytics(days);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load analytics.";
    return NextResponse.json({ configured: true, error: message }, { status: 502 });
  }
}
