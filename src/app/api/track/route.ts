import { NextResponse } from "next/server";
import { findOrderForTracking } from "@/lib/db";

/**
 * Public order tracking. POST { number, email } — email is the shared secret
 * because order numbers are sequential/guessable. Returns a reduced view
 * (status, progress, tracking) with no money or address details.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { number?: string; email?: string }
    | null;
  const number = String(body?.number ?? "").trim();
  const email = String(body?.email ?? "").trim();
  if (!number || !email) {
    return NextResponse.json({ error: "Enter your order number and email." }, { status: 400 });
  }

  const order = await findOrderForTracking(number, email);
  if (!order) {
    // Deliberately identical message for not-found vs mismatch — don't reveal which.
    return NextResponse.json(
      { error: "We couldn't find an order with that number and email." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    order: {
      number: order.number,
      customerName: order.customerName,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      timeline: order.timeline,
      items: order.items.map((i) => ({ name: i.name, sqm: i.sqm })),
      carrier: order.carrier ?? null,
      trackingNumber: order.trackingNumber ?? null,
      trackingUrl: order.trackingUrl ?? null,
      estimatedDelivery: order.estimatedDelivery ?? null,
    },
  });
}
