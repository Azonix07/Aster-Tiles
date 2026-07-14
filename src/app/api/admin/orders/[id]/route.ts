import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateDb, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!can(user, "orders")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: OrderStatus;
    note?: string;
    paymentStatus?: "pending" | "paid" | "refunded";
    adminNote?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const ok = await mutateDb((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return false;

    const now = new Date().toISOString();

    if (body.status && ORDER_STATUSES.includes(body.status) && body.status !== order.status) {
      order.status = body.status;
      order.timeline.push({
        status: body.status,
        note: String(body.note ?? "").trim() || undefined,
        at: now,
      });
      if (body.status === "delivered" && order.paymentMethod === "cod") {
        order.paymentStatus = "paid";
      }
    }
    if (body.paymentStatus && ["pending", "paid", "refunded"].includes(body.paymentStatus)) {
      order.paymentStatus = body.paymentStatus;
    }
    if (body.adminNote !== undefined) {
      order.adminNote = String(body.adminNote).trim() || undefined;
    }
    order.updatedAt = now;
    return true;
  });

  if (!ok) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  revalidatePath("/admin/orders");
  return NextResponse.json({ ok: true });
}
