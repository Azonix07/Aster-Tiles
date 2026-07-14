import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import SupportCenter from "@/components/support/SupportCenter";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false },
};

export default async function AccountSupportPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/support");

  const db = await getDb();
  const tickets = db.tickets
    .filter((t) => t.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const orders = db.orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => ({ id: o.id, number: o.number }));

  return <SupportCenter initialTickets={tickets} orders={orders} />;
}
