import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/shop/CheckoutForm";
import { currentUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/checkout");

  const settings = await getSettings();

  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="label text-green">Nearly there</p>
        <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">Checkout</h1>

        <div className="mt-10">
          {settings.maintenance.payments ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lift">
              <p className="display text-2xl text-navy">Ordering is paused for a moment</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                {settings.maintenance.message}
              </p>
              <Link href="/collections" className="btn btn-green mt-7">
                Keep browsing the tiles
              </Link>
            </div>
          ) : (
            <CheckoutForm savedAddresses={user.addresses} />
          )}
        </div>
      </div>
    </section>
  );
}
