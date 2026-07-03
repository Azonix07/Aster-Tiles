import { NextResponse } from "next/server";
import {
  mutateDb,
  newId,
  nextOrderNumber,
  type Address,
  type Order,
  type OrderItem,
} from "@/lib/db";
import { currentUser } from "@/lib/auth";

interface OrderRequest {
  items: { tileId: string; sqm: number }[];
  address: Omit<Address, "id">;
  paymentMethod: "cod" | "razorpay";
  customerNote?: string;
  saveAddress?: boolean;
}

const ADDRESS_FIELDS: (keyof Omit<Address, "id" | "line2">)[] = [
  "fullName",
  "phone",
  "line1",
  "city",
  "county",
  "postcode",
];

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to place an order." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as OrderRequest | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: "Too many items in one order." }, { status: 400 });
  }

  for (const field of ADDRESS_FIELDS) {
    if (!String(body.address?.[field] ?? "").trim()) {
      return NextResponse.json(
        { error: "Please fill in every delivery address field." },
        { status: 400 },
      );
    }
  }

  const result = mutateDb((db): { order?: Order; error?: string; status?: number } => {
    const { settings } = db;

    if (settings.maintenance.fullSite || settings.maintenance.payments) {
      return {
        error: "Ordering is temporarily paused for maintenance — please try again soon.",
        status: 503,
      };
    }

    if (body.paymentMethod === "razorpay") {
      return {
        error:
          "Online payment (Razorpay) isn't live yet — please choose Cash on Delivery for now.",
        status: 400,
      };
    }
    if (body.paymentMethod !== "cod" || !settings.codEnabled) {
      return { error: "That payment method isn't available.", status: 400 };
    }

    const items: OrderItem[] = [];
    for (const raw of body.items) {
      const tile = db.tiles.find((t) => t.id === raw.tileId);
      if (!tile) return { error: "One of the tiles in your cart no longer exists.", status: 409 };
      if (!tile.inStock) {
        return { error: `${tile.name} is out of stock — please remove it from your cart.`, status: 409 };
      }
      const sqm = Math.min(500, Math.max(0.5, Math.round(Number(raw.sqm) * 2) / 2));
      if (!Number.isFinite(sqm)) return { error: "Invalid quantity.", status: 400 };
      items.push({
        tileId: tile.id,
        name: tile.name,
        image: tile.texture,
        pricePerSqm: tile.pricePerSqm,
        sqm,
        lineTotal: Math.round(tile.pricePerSqm * sqm * 100) / 100,
      });
    }

    const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    const deliveryFee =
      settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver
        ? 0
        : settings.deliveryFee;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const now = new Date().toISOString();
    const address: Omit<Address, "id"> = {
      fullName: String(body.address.fullName).trim(),
      phone: String(body.address.phone).trim(),
      line1: String(body.address.line1).trim(),
      line2: String(body.address.line2 ?? "").trim(),
      city: String(body.address.city).trim(),
      county: String(body.address.county).trim(),
      postcode: String(body.address.postcode).trim(),
    };

    const order: Order = {
      id: newId(),
      number: nextOrderNumber(db),
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      address,
      items,
      subtotal,
      deliveryFee,
      total,
      currencySymbol: settings.currencySymbol,
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "pending",
      timeline: [{ status: "pending", note: "Order placed — cash on delivery", at: now }],
      customerNote: String(body.customerNote ?? "").trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.orders.push(order);

    if (body.saveAddress) {
      const dbUser = db.users.find((u) => u.id === user.id);
      if (dbUser) {
        const exists = dbUser.addresses.some(
          (a) =>
            a.line1.toLowerCase() === address.line1.toLowerCase() &&
            a.postcode.toLowerCase() === address.postcode.toLowerCase(),
        );
        if (!exists) dbUser.addresses.push({ id: newId(), ...address });
      }
    }

    return { order };
  });

  if (result.error || !result.order) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ ok: true, orderId: result.order.id, number: result.order.number });
}
