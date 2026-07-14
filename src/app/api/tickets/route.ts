import { NextResponse } from "next/server";
import { getDb, mutateDb, newId, nextTicketNumber, type Ticket } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const CATEGORIES = ["Order", "Delivery", "Product", "Payment", "Other"];

/** GET /api/tickets — the signed-in customer's own tickets, newest first. */
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const db = await getDb();
  const tickets = db.tickets
    .filter((t) => t.userId === me.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ tickets });
}

/** POST /api/tickets — open a new support ticket. */
export async function POST(request: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Please sign in to contact support." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    subject?: string;
    category?: string;
    message?: string;
    orderId?: string;
  } | null;

  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const category = CATEGORIES.includes(String(body?.category)) ? String(body?.category) : "Other";

  if (subject.length < 3) {
    return NextResponse.json({ error: "Give your enquiry a short subject." }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Please describe how we can help." }, { status: 400 });
  }

  const ticket = await mutateDb((db): Ticket => {
    const now = new Date().toISOString();
    const t: Ticket = {
      id: newId(),
      number: nextTicketNumber(db),
      subject: subject.slice(0, 140),
      category,
      customerName: me.name,
      customerEmail: me.email,
      userId: me.id,
      orderId: body?.orderId && db.orders.some((o) => o.id === body.orderId) ? body.orderId : undefined,
      status: "open",
      messages: [
        {
          id: newId(),
          author: "customer",
          authorName: me.name,
          body: message.slice(0, 4000),
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.tickets.push(t);
    return t;
  });

  return NextResponse.json({ ticket });
}
