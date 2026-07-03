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

  return (
    <section className="min-h-screen bg-off pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-green">My account</p>
            <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">
              Hello, <em className="accent-italic text-green">{user.name.split(" ")[0]}</em>
            </h1>
            <p className="mt-2 text-sm text-muted">
              {user.email} · member since {shortDate(user.createdAt)}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          {/* orders */}
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
                          {money(o.total, o.currencySymbol)}
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* addresses */}
          <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
            <h2 className="display text-xl text-navy">Delivery addresses</h2>
            <div className="mt-5">
              <AddressBook addresses={user.addresses} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
