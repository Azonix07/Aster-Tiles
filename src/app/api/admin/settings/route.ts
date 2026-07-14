import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!can(user, "settings")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  await mutateDb((db) => {
    const s = db.settings;
    if (typeof raw.currencySymbol === "string" && raw.currencySymbol.trim()) {
      s.currencySymbol = raw.currencySymbol.trim().slice(0, 4);
    }
    if (Number.isFinite(Number(raw.deliveryFee)) && Number(raw.deliveryFee) >= 0) {
      s.deliveryFee = Number(raw.deliveryFee);
    }
    if (Number.isFinite(Number(raw.freeDeliveryOver)) && Number(raw.freeDeliveryOver) >= 0) {
      s.freeDeliveryOver = Number(raw.freeDeliveryOver);
    }
    if (typeof raw.codEnabled === "boolean") s.codEnabled = raw.codEnabled;
    if (typeof raw.razorpayEnabled === "boolean") s.razorpayEnabled = raw.razorpayEnabled;

    const m = raw.maintenance as Record<string, unknown> | undefined;
    if (m) {
      if (typeof m.fullSite === "boolean") s.maintenance.fullSite = m.fullSite;
      if (typeof m.payments === "boolean") s.maintenance.payments = m.payments;
      if (typeof m.message === "string" && m.message.trim()) {
        s.maintenance.message = m.message.trim();
      }
    }
  });

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
