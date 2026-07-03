import Link from "next/link";
import { getDb, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { money, shortDate, STATUS_LABELS } from "@/lib/format";
import { StatusBadge } from "@/components/shop/OrderBits";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const all = [...getDb().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = filter ? all.filter((o) => o.status === filter) : all;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display text-3xl text-navy">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-4 py-1.5 font-display text-xs font-bold transition ${
            !filter ? "border-green bg-green text-white" : "border-mist bg-white text-muted hover:border-green"
          }`}
        >
          All ({all.length})
        </Link>
        {ORDER_STATUSES.map((s) => {
          const count = all.filter((o) => o.status === s).length;
          return (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`rounded-full border px-4 py-1.5 font-display text-xs font-bold transition ${
                filter === s
                  ? "border-green bg-green text-white"
                  : "border-mist bg-white text-muted hover:border-green"
              }`}
            >
              {STATUS_LABELS[s]} ({count})
            </Link>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-mist bg-white p-6 shadow-sm">
        {orders.length === 0 ? (
          <p className="text-sm text-muted">No orders here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-mist text-[0.68rem] tracking-wide text-muted uppercase">
                  <th className="py-2.5 pr-4 font-bold">Order</th>
                  <th className="py-2.5 pr-4 font-bold">Customer</th>
                  <th className="py-2.5 pr-4 font-bold">Deliver to</th>
                  <th className="py-2.5 pr-4 font-bold">Date</th>
                  <th className="py-2.5 pr-4 font-bold">Payment</th>
                  <th className="py-2.5 pr-4 font-bold">Total</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-mist/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy hover:text-green">
                        {o.number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-navy">{o.customerName}</p>
                      <p className="text-xs text-muted">{o.customerEmail}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {o.address.city}, {o.address.county}
                    </td>
                    <td className="py-3 pr-4 text-muted">{shortDate(o.createdAt)}</td>
                    <td className="py-3 pr-4 text-muted">
                      {o.paymentMethod === "cod" ? "COD" : "Razorpay"} ·{" "}
                      <span className={o.paymentStatus === "paid" ? "font-bold text-green" : ""}>
                        {o.paymentStatus}
                      </span>
                    </td>
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
