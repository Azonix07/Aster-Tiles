import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateDb, type OrderStatus } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/** A customer may cancel only before the order has been dispatched. */
const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "processing"];

/** POST /api/orders/:id/cancel — the customer cancels their own order. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Please sign in to manage your order." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { reason?: string } | null;
  const reason = String(body?.reason ?? "").trim().slice(0, 300);

  const result = await mutateDb((db): { ok: boolean; error?: string; status?: number } => {
    const order = db.orders.find((o) => o.id === id && o.userId === me.id);
    if (!order) return { ok: false, error: "Order not found.", status: 404 };
    if (order.status === "cancelled") {
      return { ok: false, error: "This order is already cancelled.", status: 400 };
    }
    if (!CANCELLABLE.includes(order.status)) {
      return {
        ok: false,
        error:
          "This order has already been dispatched, so it can't be cancelled online — please contact support and we'll help.",
        status: 409,
      };
    }
    const now = new Date().toISOString();
    order.status = "cancelled";
    order.timeline.push({
      status: "cancelled",
      note: reason ? `Cancelled by customer — ${reason}` : "Cancelled by customer",
      at: now,
    });
    order.updatedAt = now;
    return { ok: true };
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });

  revalidatePath(`/account/orders/${id}`);
  revalidatePath("/account");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ ok: true });
}
