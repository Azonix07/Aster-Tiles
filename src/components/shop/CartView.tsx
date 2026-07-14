"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { useCart, useCartDetails } from "@/components/CartProvider";
import { useSettings } from "@/components/StoreProvider";
import { SqmStepper } from "@/components/shop/AddToCart";
import { money } from "@/lib/format";

export default function CartView() {
  const { setSqm, remove } = useCart();
  const { lines, subtotal, deliveryFee, total } = useCartDetails();
  const settings = useSettings();

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-lift">
        <p className="display text-2xl text-navy">Your cart is empty</p>
        <p className="mt-3 text-sm text-muted">
          Browse the range and add your favourite tiles by the square metre.
        </p>
        <Link href="/collections" className="btn btn-green mt-7">
          Browse the collections
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
      {/* lines */}
      <ul className="space-y-4">
        {lines.map(({ tile, sqm, lineTotal }) => (
          <li
            key={tile.id}
            className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-4 shadow-lift sm:flex-nowrap"
          >
            <Link href={`/tiles/${tile.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-mist">
              <Image src={tile.texture} alt={tile.name} fill sizes="96px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/tiles/${tile.id}`} className="font-display text-lg font-bold text-navy hover:text-green">
                {tile.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted">
                {tile.material} · {money(tile.pricePerSqm, settings.currencySymbol)}/m²
              </p>
              {!tile.inStock && (
                <p className="mt-1 text-xs font-bold text-red-500">
                  Now out of stock — remove to continue.
                </p>
              )}
              <div className="mt-3">
                <SqmStepper compact sqm={sqm} onChange={(n) => setSqm(tile.id, n)} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="font-display text-lg font-bold text-navy">
                {money(lineTotal, settings.currencySymbol)}
              </p>
              <button
                type="button"
                onClick={() => {
                  posthog.capture("cart_item_removed", {
                    tile_id: tile.id,
                    tile_name: tile.name,
                    sqm,
                    line_total: lineTotal,
                  });
                  remove(tile.id);
                }}
                className="text-xs font-bold text-muted transition hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* summary */}
      <aside className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
        <h2 className="display text-xl text-navy">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-bold text-navy">{money(subtotal, settings.currencySymbol)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-bold text-navy">
              {deliveryFee === 0 ? (
                <span className="text-green">Free</span>
              ) : (
                money(deliveryFee, settings.currencySymbol)
              )}
            </dd>
          </div>
          {settings.freeDeliveryOver > 0 && deliveryFee > 0 && (
            <p className="rounded-lg bg-green/10 px-3 py-2 text-xs text-green-2">
              Spend {money(settings.freeDeliveryOver - subtotal, settings.currencySymbol)} more for
              free delivery.
            </p>
          )}
          <div className="flex justify-between border-t border-mist pt-3 text-base">
            <dt className="font-display font-bold text-navy">Total</dt>
            <dd className="font-display font-bold text-navy">
              {money(total, settings.currencySymbol)}
            </dd>
          </div>
        </dl>

        {settings.paymentsDown ? (
          <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-navy">
            <p className="font-bold">Ordering is temporarily paused.</p>
            <p className="mt-1 text-muted">{settings.maintenanceMessage}</p>
          </div>
        ) : (
          <Link
            href="/checkout"
            className="btn btn-green mt-6 w-full justify-center"
            onClick={() =>
              posthog.capture("checkout_started", {
                item_count: lines.length,
                subtotal,
                delivery_fee: deliveryFee,
                total,
              })
            }
          >
            Checkout →
          </Link>
        )}
        <Link
          href="/collections"
          className="mt-4 block text-center text-xs font-bold text-muted transition hover:text-green"
        >
          ← Keep browsing
        </Link>
      </aside>
    </div>
  );
}
