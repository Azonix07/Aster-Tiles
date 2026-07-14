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
import { effectivePrice } from "@/lib/pricing";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendOrderConfirmation } from "@/lib/email";

interface OrderRequest {
  items: { tileId: string; sqm: number }[];
  address: Omit<Address, "id">;
  paymentMethod: "cod" | "razorpay";
  customerNote?: string;
  saveAddress?: boolean;
  /** client-generated key so a retried / double-submitted checkout is de-duped */
  idempotencyKey?: string;
}

const ADDRESS_FIELDS: (keyof Omit<Address, "id" | "line2">)[] = [
  "fullName",
  "phone",
  "line1",
  "city",
  "county",
  "postcode",
];

// Length caps so a malicious client can't bloat the single DB document.
const FIELD_MAX: Record<keyof Omit<Address, "id">, number> = {
  fullName: 120,
  phone: 40,
  line1: 200,
  line2: 200,
  city: 120,
  county: 120,
  postcode: 20,
};
const NOTE_MAX = 1000;

const cap = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

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

  // Merge duplicate tile lines so a repeated tileId becomes one order line.
  const mergedSqm = new Map<string, number>();
  for (const raw of body.items) {
    if (!raw || typeof raw.tileId !== "string") {
      return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    }
    const sqm = Number(raw.sqm);
    if (!Number.isFinite(sqm) || sqm <= 0) {
      return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
    }
    mergedSqm.set(raw.tileId, (mergedSqm.get(raw.tileId) ?? 0) + sqm);
  }

  for (const field of ADDRESS_FIELDS) {
    if (!String(body.address?.[field] ?? "").trim()) {
      return NextResponse.json(
        { error: "Please fill in every delivery address field." },
        { status: 400 },
      );
    }
  }
  // Phone sanity: at least 7 digits, so orders aren't undeliverable.
  if ((String(body.address.phone).match(/\d/g)?.length ?? 0) < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const idempotencyKey =
    typeof body.idempotencyKey === "string" && body.idempotencyKey.length <= 100
      ? body.idempotencyKey
      : undefined;

  const result = await mutateDb(
    (db): { order?: Order; error?: string; status?: number; reused?: boolean } => {
      // Idempotency: a retried / double-submitted checkout returns the first order
      // rather than creating a duplicate.
      if (idempotencyKey) {
        const existing = db.orders.find(
          (o) => o.idempotencyKey === idempotencyKey && o.userId === user.id,
        );
        if (existing) return { order: existing, reused: true };
      }

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
      for (const [tileId, rawSqm] of mergedSqm) {
        const tile = db.tiles.find((t) => t.id === tileId);
        if (!tile) return { error: "One of the tiles in your cart no longer exists.", status: 409 };
        if (!tile.inStock) {
          return {
            error: `${tile.name} is out of stock — please remove it from your cart.`,
            status: 409,
          };
        }
        const sqm = Math.min(500, Math.max(0.5, Math.round(rawSqm * 2) / 2));
        // Charge the discounted price — the same one shown across the storefront.
        const unit = effectivePrice(tile);
        items.push({
          tileId: tile.id,
          name: tile.name,
          image: tile.texture,
          pricePerSqm: unit,
          sqm,
          lineTotal: Math.round(unit * sqm * 100) / 100,
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
        fullName: cap(body.address.fullName, FIELD_MAX.fullName),
        phone: cap(body.address.phone, FIELD_MAX.phone),
        line1: cap(body.address.line1, FIELD_MAX.line1),
        line2: cap(body.address.line2, FIELD_MAX.line2),
        city: cap(body.address.city, FIELD_MAX.city),
        county: cap(body.address.county, FIELD_MAX.county),
        postcode: cap(body.address.postcode, FIELD_MAX.postcode),
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
        customerNote: cap(body.customerNote, NOTE_MAX) || undefined,
        idempotencyKey,
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
    },
  );

  if (result.error || !result.order) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  const order = result.order;

  // Everything below is post-commit: it must never turn a saved order into an error.
  if (!result.reused) {
    try {
      const distinctId = request.headers.get("X-POSTHOG-DISTINCT-ID") || user.id;
      const sessionId = request.headers.get("X-POSTHOG-SESSION-ID") || undefined;
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId,
        event: "order_placed",
        properties: {
          order_id: order.id,
          order_number: order.number,
          item_count: order.items.length,
          subtotal: order.subtotal,
          delivery_fee: order.deliveryFee,
          total: order.total,
          payment_method: order.paymentMethod,
          $session_id: sessionId,
        },
      });
      await posthog.flush();
    } catch (err) {
      console.error("[orders] analytics capture failed (order still placed):", err);
    }

    // Confirmation email — sendEmail() already no-ops gracefully when Resend is
    // unconfigured; the try/catch guards against any unexpected throw.
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      await sendOrderConfirmation({
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.number,
        items: order.items.map((i) => ({
          name: i.name,
          sqm: i.sqm,
          pricePerSqm: i.pricePerSqm,
          lineTotal: i.lineTotal,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        currencySymbol: order.currencySymbol,
        paymentMethod: order.paymentMethod,
        trackingUrl: `${appUrl}/track`,
      });
    } catch (err) {
      console.error("[orders] confirmation email failed (order still placed):", err);
    }
  }

  return NextResponse.json({ ok: true, orderId: order.id, number: order.number });
}
