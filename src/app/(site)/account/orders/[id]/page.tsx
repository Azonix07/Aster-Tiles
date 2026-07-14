import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { OrderProgress, StatusBadge, Timeline } from "@/components/shop/OrderBits";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await currentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/orders/${id}`)}`);

  const order = getDb().orders.find((o) => o.id === id);
  if (!order || (order.userId !== user.id && !user.isAdmin)) notFound();

  const justPlaced = (await searchParams).placed === "1";

  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        {justPlaced && (
          <div className="mb-8 flex items-start gap-4 rounded-2xl border border-green/40 bg-green/10 p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green text-white">
              ✓
            </span>
            <div>
              <p className="display text-xl text-navy">Thanks — your order is in!</p>
              <p className="mt-1 text-sm text-muted">
                We&apos;ll ring you to confirm delivery. Pay the driver when your tiles arrive.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/account" className="text-xs font-bold text-muted hover:text-green">
              ← Back to my account
            </Link>
            <h1 className="display mt-2 text-3xl text-navy sm:text-4xl">Order {order.number}</h1>
            <p className="mt-1 text-sm text-muted">Placed {dateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-lift sm:p-8">
          <OrderProgress order={order} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <div className="space-y-8">
            {/* items */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Items</h2>
              <ul className="mt-5 divide-y divide-mist">
                {order.items.map((item) => (
                  <li key={item.tileId} className="flex items-center gap-4 py-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/tiles/${item.tileId}`} className="font-display text-sm font-bold text-navy hover:text-green">
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.sqm} m² × {money(item.pricePerSqm, order.currencySymbol)}/m²
                      </p>
                    </div>
                    <p className="font-display text-sm font-bold text-navy">
                      {money(item.lineTotal, order.currencySymbol)}
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-2 border-t border-mist pt-4 text-sm">
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
              </dl>
            </div>

            {/* timeline */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Order history</h2>
              <div className="mt-5">
                <Timeline order={order} />
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Delivery</h2>
              <address className="mt-4 text-sm not-italic leading-relaxed text-muted">
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
                <br />
                {order.address.phone}
              </address>
              {order.customerNote && (
                <p className="mt-4 rounded-lg bg-off px-3 py-2 text-xs text-muted">
                  <span className="font-bold text-navy">Your note:</span> {order.customerNote}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Payment</h2>
              <p className="mt-3 text-sm text-muted">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (online)"} ·{" "}
                <span className={order.paymentStatus === "paid" ? "font-bold text-green" : "font-bold text-navy"}>
                  {order.paymentStatus === "paid"
                    ? "Paid"
                    : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : "To pay on delivery"}
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
