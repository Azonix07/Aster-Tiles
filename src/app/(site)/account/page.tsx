import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { StatusBadge } from "@/components/shop/OrderBits";
import AddressBook from "@/components/shop/AddressBook";
import { LogoutButton } from "@/components/shop/AuthForms";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");

  const orders = getDb()
    .orders.filter((o) => o.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const active = orders.filter((o) => o.status !== "cancelled");
  const currency = active[0]?.currencySymbol ?? orders[0]?.currencySymbol ?? "€";
  const totalSpent = active.reduce((s, o) => s + o.total, 0);
  const paid = active.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const outstanding = totalSpent - paid;

  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-green">My account</p>
            <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">
              Hello, <em className="not-italic text-green">{user.name.split(" ")[0]}</em>
            </h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <div className="space-y-8">
            {/* orders / sales */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Your orders</h2>
              {orders.length === 0 ? (
                <div className="mt-5">
                  <p className="text-sm text-muted">You haven&apos;t ordered anything yet.</p>
                  <Link href="/collections" className="btn btn-green mt-5">
                    Browse the collections
                  </Link>
                </div>
              ) : (
                <ul className="mt-5 divide-y divide-mist">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/account/orders/${o.id}`}
                        className="group flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <div>
                          <p className="font-display text-sm font-bold text-navy group-hover:text-green">
                            {o.number}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {shortDate(o.createdAt)} · {o.items.length} tile
                            {o.items.length === 1 ? "" : "s"} ·{" "}
                            {money(o.total, o.currencySymbol)} ·{" "}
                            {o.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} ·{" "}
                            <span
                              className={
                                o.paymentStatus === "paid" ? "font-bold text-green" : "font-bold"
                              }
                            >
                              {o.paymentStatus === "paid"
                                ? "Paid"
                                : o.paymentStatus === "refunded"
                                  ? "Refunded"
                                  : "To pay on delivery"}
                            </span>
                          </p>
                        </div>
                        <StatusBadge status={o.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* payments */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Payments</h2>
              {active.length === 0 ? (
                <p className="mt-5 text-sm text-muted">
                  No payments yet — they&apos;ll appear here once you place an order.
                </p>
              ) : (
                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-off px-4 py-3">
                    <dt className="text-xs font-bold text-muted">Total ordered</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-navy">
                      {money(totalSpent, currency)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-off px-4 py-3">
                    <dt className="text-xs font-bold text-muted">Paid</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-green">
                      {money(paid, currency)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-off px-4 py-3">
                    <dt className="text-xs font-bold text-muted">Due on delivery</dt>
                    <dd className="mt-1 font-display text-lg font-bold text-navy">
                      {money(outstanding, currency)}
                    </dd>
                  </div>
                </dl>
              )}
              <p className="mt-4 text-xs text-muted">
                Orders are cash on delivery — pay the driver when your tiles arrive. Online
                payment is coming soon.
              </p>
            </div>
          </div>

          <aside className="space-y-8">
            {/* profile */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Your details</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-muted">Name</dt>
                  <dd className="mt-0.5 font-bold text-navy">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted">Email</dt>
                  <dd className="mt-0.5 font-bold text-navy">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted">Phone</dt>
                  <dd className="mt-0.5 font-bold text-navy">
                    {user.phone || <span className="font-normal text-muted">Not provided</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted">Member since</dt>
                  <dd className="mt-0.5 font-bold text-navy">{shortDate(user.createdAt)}</dd>
                </div>
              </dl>
            </div>

            {/* addresses */}
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h2 className="display text-xl text-navy">Delivery addresses</h2>
              <div className="mt-5">
                <AddressBook addresses={user.addresses} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
