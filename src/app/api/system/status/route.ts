import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Internal, unauthenticated read of the current maintenance flags. Used by the Edge
 * proxy in local dev (where it can't touch the file store directly). Exposes nothing
 * sensitive — just whether the site / payments are paused.
 */
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ maintenance: settings.maintenance });
}
