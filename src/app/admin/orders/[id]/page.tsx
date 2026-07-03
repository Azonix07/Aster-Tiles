import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { StatusBadge, Timeline } from "@/components/shop/OrderBits";
import OrderControls from "@/components/admin/OrderControls";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getDb().orders.find((o) => o.id === id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/orders" className="text-xs font-bold text-muted hover:text-green">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-navy">Order {order.number}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed {dateTime(order.createdAt)} · last updated {dateTime(order.updatedAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <div className="space-y-8">
          {/* items */}
          <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
            <h2 className="display text-xl text-navy">Items</h2>
            <ul className="mt-4 divide-y divide-mist">
              {order.items.map((item) => (
                <li key={item.tileId} className="flex items-center gap-4 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-navy">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.sqm} m² × {money(item.pricePerSqm, order.currencySymbol)}/m²
                    </p>
                  </div>
                  <p className="font-display text-sm font-bold text-navy">
                    {money(item.lineTotal, order.currencySymbol)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-mist pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-bold text-navy">{money(order.subtotal, order.currencySymbol)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-bold text-navy">
                  {order.deliveryFee === 0 ? "Free" : money(order.deliveryFee, order.currencySymbol)}
                </dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-display font-bold text-navy">Total</dt>
                <dd className="font-display font-bold text-navy">{money(order.total, order.currencySymbol)}</dd>
              </div>
              <div className="flex justify-between border-t border-mist pt-2 text-xs">
                <dt className="text-muted">Payment</dt>
                <dd className="text-muted">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} ·{" "}
                  <span className={order.paymentStatus === "paid" ? "font-bold text-green" : "font-bold"}>
                    {order.paymentStatus}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* customer + delivery */}
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
              <h2 className="display text-lg text-navy">Customer</h2>
              <p className="mt-3 text-sm font-bold text-navy">{order.customerName}</p>
              <a href={`mailto:${order.customerEmail}`} className="text-sm text-green hover:text-green-2">
                {order.customerEmail}
              </a>
              <p className="mt-1 text-sm text-muted">{order.address.phone}</p>
              {order.customerNote && (
                <p className="mt-3 rounded-lg bg-off px-3 py-2 text-xs text-muted">
                  <span className="font-bold text-navy">Customer note:</span> {order.customerNote}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
              <h2 className="display text-lg text-navy">Deliver to</h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-muted">
                <span className="font-bold text-navy">{order.address.fullName}</span>
                <br />
                {order.address.line1}
                {order.address.line2 && (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                )}
                <br />
                {order.address.city}, {order.address.county}
                <br />
                {order.address.postcode}
              </address>
            </div>
          </div>

          {/* timeline */}
          <div className="rounded-2xl border border-mist bg-white p-6 shadow-sm">
            <h2 className="display text-xl text-navy">Timeline</h2>
            <div className="mt-4">
              <Timeline order={order} />
            </div>
            {order.adminNote && (
              <p className="mt-4 rounded-lg bg-gold/10 px-3 py-2 text-xs text-navy">
                <span className="font-bold">Admin note:</span> {order.adminNote}
              </p>
            )}
          </div>
        </div>

        <OrderControls order={order} />
      </div>
    </div>
  );
}
