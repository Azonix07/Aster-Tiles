import Link from "next/link";
import { getDb } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { StatusBadge } from "@/components/shop/OrderBits";

export default function AdminDashboard() {
  const db = getDb();
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const customers = db.users.filter((u) => !u.isAdmin).length;
  const outOfStock = db.tiles.filter((t) => !t.inStock).length;
  const symbol = db.settings.currencySymbol;

  const cards = [
    { label: "Orders (all time)", value: String(orders.length), href: "/admin/orders" },
    { label: "Needs attention", value: String(active.length), href: "/admin/orders", accent: active.length > 0 },
    { label: "Revenue", value: money(revenue, symbol), href: "/admin/orders" },
    { label: "Customers", value: String(customers), href: "/admin/orders" },
    { label: "Tiles in catalogue", value: String(db.tiles.length), href: "/admin/tiles" },
    { label: "Out of stock", value: String(outOfStock), href: "/admin/tiles", accent: outOfStock > 0 },
  ];

  const m = db.settings.maintenance;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display text-3xl text-navy">Dashboard</h1>

      {(m.fullSite || m.payments) && (
        <div className="mt-6 rounded-xl border border-gold/50 bg-gold/10 px-5 py-4">
          <p className="font-display text-sm font-bold text-navy">
            {m.fullSite ? "⚠️ The whole site is in maintenance mode" : "⚠️ Ordering is paused (payments maintenance)"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Visitors {m.fullSite ? "see the maintenance page" : "can browse but not order"}.{" "}
            <Link href="/admin/settings" className="font-bold text-green">Change in Settings →</Link>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-lift ${
              c.accent ? "border-gold/60" : "border-mist"
            }`}
          >
            <p className="text-[0.68rem] font-bold tracking-wide text-muted uppercase">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-mist bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="display text-xl text-navy">Latest orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-green hover:text-green-2">
            View all →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-5 text-sm text-muted">
            No orders yet — they&apos;ll appear here the moment a customer checks out.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-130 text-left text-sm">
              <thead>
                <tr className="border-b border-mist text-[0.68rem] tracking-wide text-muted uppercase">
                  <th className="py-2.5 pr-4 font-bold">Order</th>
                  <th className="py-2.5 pr-4 font-bold">Customer</th>
                  <th className="py-2.5 pr-4 font-bold">Date</th>
                  <th className="py-2.5 pr-4 font-bold">Total</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-b border-mist/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy hover:text-green">
                        {o.number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted">{o.customerName}</td>
                    <td className="py-3 pr-4 text-muted">{shortDate(o.createdAt)}</td>
                    <td className="py-3 pr-4 font-bold text-navy">{money(o.total, o.currencySymbol)}</td>
                    <td className="py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
