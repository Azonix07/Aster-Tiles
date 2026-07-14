import { NextResponse } from "next/server";
import { getDb, mutateDb, newId } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/** GET /api/tickets/:id — one of the customer's own tickets. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { id } = await params;
  const ticket = (await getDb()).tickets.find((t) => t.id === id && t.userId === me.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ticket });
}

/** POST /api/tickets/:id — the customer adds a reply to their ticket. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = String(body?.message ?? "").trim();
  if (message.length < 2) return NextResponse.json({ error: "Type a message first." }, { status: 400 });

  const ok = await mutateDb((db) => {
    const ticket = db.tickets.find((t) => t.id === id && t.userId === me.id);
    if (!ticket) return false;
    const now = new Date().toISOString();
    ticket.messages.push({
      id: newId(),
      author: "customer",
      authorName: me.name,
      body: message.slice(0, 4000),
      createdAt: now,
    });
    // A customer reply re-opens the conversation for the team.
    if (ticket.status === "resolved" || ticket.status === "closed") ticket.status = "open";
    ticket.updatedAt = now;
    return true;
  });

  if (!ok) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
