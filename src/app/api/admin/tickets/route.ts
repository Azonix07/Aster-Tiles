import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

/** GET /api/admin/tickets — all tickets for the support inbox, newest activity first. */
export async function GET() {
  const user = await currentUser();
  if (!can(user, "tickets")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const tickets = [...(await getDb()).tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ tickets });
}
