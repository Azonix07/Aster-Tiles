import { NextResponse } from "next/server";
import { getDb, mutateDb, newId, TICKET_STATUSES, type TicketStatus } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { sendTicketReply } from "@/lib/email";

/** GET /api/admin/tickets/:id */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!can(user, "tickets")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const { id } = await params;
  const ticket = (await getDb()).tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ticket });
}

/** PATCH /api/admin/tickets/:id — change status. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!can(user, "tickets")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: TicketStatus } | null;
  if (!body?.status || !TICKET_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await mutateDb((db) => {
    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return false;
    ticket.status = body.status!;
    ticket.updatedAt = new Date().toISOString();
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** POST /api/admin/tickets/:id — staff reply; stored and emailed to the customer. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!can(user, "tickets") || !user) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = String(body?.message ?? "").trim();
  if (message.length < 2) return NextResponse.json({ error: "Type a reply first." }, { status: 400 });

  // Look up the ticket first so we can email before recording the outcome.
  const existing = (await getDb()).tickets.find((t) => t.id === id);
  if (!existing) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

  const sent = await sendTicketReply({
    to: existing.customerEmail,
    customerName: existing.customerName,
    ticketNumber: existing.number,
    subject: existing.subject,
    body: message,
    agentName: user.name,
  });

  await mutateDb((db) => {
    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return;
    const now = new Date().toISOString();
    ticket.messages.push({
      id: newId(),
      author: "staff",
      authorName: user.name,
      body: message.slice(0, 4000),
      createdAt: now,
      emailed: sent.ok,
    });
    // Replying moves it to "pending" (waiting on the customer) unless already closed.
    if (ticket.status === "open") ticket.status = "pending";
    ticket.updatedAt = now;
  });

  return NextResponse.json({
    ok: true,
    emailed: sent.ok,
    emailSkipped: sent.skipped ?? false,
    emailError: sent.error,
  });
}
