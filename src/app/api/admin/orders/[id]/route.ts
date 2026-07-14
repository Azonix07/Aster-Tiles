import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  mutateDb,
  ORDER_STATUSES,
  type Address,
  type OrderItem,
  type OrderStatus,
} from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { effectivePrice } from "@/lib/pricing";
import { STATUS_LABELS } from "@/lib/format";
import { sendOrderStatusUpdate } from "@/lib/email";

/** Statuses worth emailing the customer about (skip pending/confirmed/processing noise). */
const EMAILED_STATUSES = new Set<OrderStatus>([
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
]);

const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
const ADDRESS_KEYS: (keyof Omit<Address, "id">)[] = [
  "fullName",
  "phone",
  "line1",
  "line2",
  "city",
  "county",
  "postcode",
];

const round2 = (n: number) => Math.round(n * 100) / 100;
const cap = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Accept a tracking link only if it's a real http(s) URL — it ends up in a
 *  customer-facing href and email, so reject javascript:/data: and junk. */
function safeHttpUrl(v: unknown): string | undefined {
  const s = cap(v, 300);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
}

interface PatchBody {
  status?: OrderStatus;
  /** timeline note — customer-visible; appended even without a status change */
  note?: string;
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];
  adminNote?: string;
  deliveryFee?: number;
  address?: Partial<Omit<Address, "id">>;
  items?: { tileId: string; sqm: number }[];
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  /** set false to save without emailing the customer on a status change */
  notifyCustomer?: boolean;
}

interface EmailSnapshot {
  to: string;
  customerName: string;
  orderNumber: string;
  statusLabel: string;
  note?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!can(user, "orders")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const outcome = await mutateDb(
    (
      db,
    ): { ok: boolean; error?: string; statusChanged?: boolean; email?: EmailSnapshot } => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) return { ok: false, error: "Order not found." };

      const now = new Date().toISOString();
      const noteTrim = cap(body.note, 500);

      // ── Items ──
      // Preserve the price the customer agreed to: an existing line keeps its
      // stored pricePerSqm/name/image (even if the tile was later repriced or
      // deleted from the catalogue) and only its sqm changes. Only a genuinely
      // NEW tile is quoted at the current catalogue price. This keeps an
      // unrelated edit (address, delivery fee) from silently re-quoting the order.
      if (Array.isArray(body.items)) {
        if (body.items.length === 0) return { ok: false, error: "An order needs at least one item." };
        if (body.items.length > 50) return { ok: false, error: "Too many items." };
        const merged = new Map<string, number>();
        for (const raw of body.items) {
          if (!raw || typeof raw.tileId !== "string") return { ok: false, error: "Invalid item." };
          const sqm = Number(raw.sqm);
          if (!Number.isFinite(sqm) || sqm <= 0) return { ok: false, error: "Invalid quantity." };
          merged.set(raw.tileId, (merged.get(raw.tileId) ?? 0) + sqm);
        }
        const prior = new Map(order.items.map((i) => [i.tileId, i]));
        const items: OrderItem[] = [];
        for (const [tileId, rawSqm] of merged) {
          const sqm = Math.min(500, Math.max(0.5, Math.round(rawSqm * 2) / 2));
          const existing = prior.get(tileId);
          if (existing) {
            items.push({ ...existing, sqm, lineTotal: round2(existing.pricePerSqm * sqm) });
          } else {
            const tile = db.tiles.find((t) => t.id === tileId);
            if (!tile) return { ok: false, error: "A newly added tile no longer exists." };
            const unit = effectivePrice(tile);
            items.push({
              tileId: tile.id,
              name: tile.name,
              image: tile.texture,
              pricePerSqm: unit,
              sqm,
              lineTotal: round2(unit * sqm),
            });
          }
        }
        order.items = items;
        order.subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
      }

      // ── Delivery fee override ──
      if (typeof body.deliveryFee === "number" && Number.isFinite(body.deliveryFee)) {
        order.deliveryFee = round2(Math.max(0, body.deliveryFee));
      }
      // Total always follows subtotal + delivery.
      order.total = round2(order.subtotal + order.deliveryFee);

      // ── Address (partial merge, capped) ──
      if (body.address && typeof body.address === "object") {
        for (const k of ADDRESS_KEYS) {
          const v = body.address[k];
          if (v !== undefined) order.address[k] = cap(v, k === "line1" || k === "line2" ? 200 : 120);
        }
      }

      // ── Tracking fields ──
      if (body.carrier !== undefined) order.carrier = cap(body.carrier, 80) || undefined;
      if (body.trackingNumber !== undefined)
        order.trackingNumber = cap(body.trackingNumber, 80) || undefined;
      if (body.trackingUrl !== undefined) order.trackingUrl = safeHttpUrl(body.trackingUrl);
      if (body.estimatedDelivery !== undefined)
        order.estimatedDelivery = cap(body.estimatedDelivery, 40) || undefined;

      // ── Status + timeline (note appends even without a status change) ──
      let statusChanged = false;
      if (body.status && ORDER_STATUSES.includes(body.status) && body.status !== order.status) {
        order.status = body.status;
        statusChanged = true;
        order.timeline.push({ status: body.status, note: noteTrim || undefined, at: now });
        if (body.status === "delivered" && order.paymentMethod === "cod") {
          order.paymentStatus = "paid";
        }
      } else if (noteTrim) {
        // Decoupled update: record a customer-visible note at the current status.
        order.timeline.push({ status: order.status, note: noteTrim, at: now });
      }

      // ── Payment status ──
      if (body.paymentStatus && PAYMENT_STATUSES.includes(body.paymentStatus)) {
        order.paymentStatus = body.paymentStatus;
      }

      // ── Private admin note ──
      if (body.adminNote !== undefined) order.adminNote = cap(body.adminNote, 2000) || undefined;

      order.updatedAt = now;

      const email: EmailSnapshot | undefined =
        statusChanged && EMAILED_STATUSES.has(order.status) && body.notifyCustomer !== false
          ? {
              to: order.customerEmail,
              customerName: order.customerName,
              orderNumber: order.number,
              statusLabel: STATUS_LABELS[order.status] ?? order.status,
              note: noteTrim || undefined,
              carrier: order.carrier,
              trackingNumber: order.trackingNumber,
              trackingUrl: order.trackingUrl,
            }
          : undefined;

      return { ok: true, statusChanged, email };
    },
  );

  if (!outcome.ok) {
    const notFound = outcome.error === "Order not found.";
    return NextResponse.json({ error: outcome.error }, { status: notFound ? 404 : 400 });
  }

  // Refresh every view that renders this order.
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/account/orders/${id}`);

  // Customer status email — post-commit, never fails the save.
  let emailed = false;
  if (outcome.email) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const res = await sendOrderStatusUpdate({
        ...outcome.email,
        trackingUrl: outcome.email.trackingUrl || `${appUrl}/track`,
      });
      emailed = res.ok;
    } catch (err) {
      console.error("[admin/orders] status email failed (order still updated):", err);
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
