import type { Metadata } from "next";
import CartView from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="label text-green">Your selection</p>
        <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">Cart</h1>
        <div className="mt-10">
          <CartView />
        </div>
      </div>
    </section>
  );
}
