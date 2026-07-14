"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCart, useCartDetails } from "@/components/CartProvider";
import { useSettings, useUser } from "@/components/StoreProvider";
import { money } from "@/lib/format";
import type { Address } from "@/lib/db";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

type AddressFields = Omit<Address, "id">;

const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
};

export default function CheckoutForm({ savedAddresses }: { savedAddresses: Address[] }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const { lines, subtotal, deliveryFee, total } = useCartDetails();
  const settings = useSettings();
  const user = useUser();

  // A fresh address starts from the account profile so name/phone are one tap away.
  const newAddress: AddressFields = {
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
  };

  const [address, setAddress] = useState<AddressFields>(
    savedAddresses[0] ? { ...savedAddresses[0] } : newAddress,
  );
  const [selectedSaved, setSelectedSaved] = useState<string | "new">(
    savedAddresses[0]?.id ?? "new",
  );
  const [saveAddress, setSaveAddress] = useState(savedAddresses.length === 0);
  const [payment, setPayment] = useState<"cod" | "razorpay">(
    settings.codEnabled ? "cod" : "razorpay",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Stable across retries of this checkout attempt so a double-click or network
  // retry can't create two orders; a fresh mount (new checkout) gets a new key.
  const [idempotencyKey] = useState(() => {
    try {
      return crypto.randomUUID();
    } catch {
      return `co-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  });

  const set = (field: keyof AddressFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  const pickSaved = (id: string | "new") => {
    setSelectedSaved(id);
    if (id === "new") {
      setAddress(newAddress);
    } else {
      const found = savedAddresses.find((a) => a.id === id);
      if (found) setAddress({ ...found });
    }
  };

  const outOfStock = lines.some((l) => !l.tile.inStock);
  const razorpaySelected = payment === "razorpay";

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        address,
        paymentMethod: payment,
        customerNote: note,
        saveAddress: selectedSaved === "new" && saveAddress,
        idempotencyKey,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.orderId) {
      posthog.capture("order_placed", {
        order_id: data.orderId,
        order_number: data.number,
        item_count: lines.length,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: payment,
      });
      clear();
      router.push(`/account/orders/${data.orderId}?placed=1`);
    } else {
      posthog.captureException(new Error(data?.error ?? "Order placement failed"), {
        order_error: data?.error,
      });
      setError(data?.error ?? "Something went wrong — please try again.");
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-lift">
        <p className="display text-2xl text-navy">Nothing to check out</p>
        <p className="mt-3 text-sm text-muted">Your cart is empty.</p>
        <Link href="/collections" className="btn btn-green mt-7">
          Browse the collections
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
      <div className="space-y-8">
        {/* ── Delivery address ── */}
        <section className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
          <h2 className="display text-xl text-navy">Delivery address</h2>

          {savedAddresses.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickSaved(a.id)}
                  className={`rounded-xl border px-4 py-2.5 text-left text-xs transition ${
                    selectedSaved === a.id
                      ? "border-green bg-green/10 text-navy"
                      : "border-mist text-muted hover:border-green"
                  }`}
                >
                  <span className="block font-bold">{a.fullName}</span>
                  {a.line1}, {a.city}
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickSaved("new")}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  selectedSaved === "new"
                    ? "border-green bg-green/10 text-navy"
                    : "border-mist text-muted hover:border-green"
                }`}
              >
                + New address
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className={labelCls}>Full name</label>
              <input id="co-name" required value={address.fullName} onChange={set("fullName")} autoComplete="name" placeholder="Mary Doherty" className={inputCls} />
            </div>
            <div>
              <label htmlFor="co-phone" className={labelCls}>Phone</label>
              <input id="co-phone" required type="tel" value={address.phone} onChange={set("phone")} autoComplete="tel" placeholder="+353 89 000 0000" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-line1" className={labelCls}>Address line 1</label>
              <input id="co-line1" required value={address.line1} onChange={set("line1")} autoComplete="address-line1" placeholder="House name / number and street" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-line2" className={labelCls}>
                Address line 2 <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="co-line2" value={address.line2} onChange={set("line2")} autoComplete="address-line2" placeholder="Townland, area…" className={inputCls} />
            </div>
            <div>
              <label htmlFor="co-city" className={labelCls}>Town / City</label>
              <input id="co-city" required value={address.city} onChange={set("city")} autoComplete="address-level2" placeholder="Lifford" className={inputCls} />
            </div>
            <div>
              <label htmlFor="co-county" className={labelCls}>County / State</label>
              <input id="co-county" required value={address.county} onChange={set("county")} autoComplete="address-level1" placeholder="Co. Donegal" className={inputCls} />
            </div>
            <div>
              <label htmlFor="co-postcode" className={labelCls}>Postcode / PIN</label>
              <input id="co-postcode" required value={address.postcode} onChange={set("postcode")} autoComplete="postal-code" placeholder="F93 X522" className={inputCls} />
            </div>
          </div>

          {selectedSaved === "new" && (
            <label className="mt-5 flex items-center gap-2.5 text-sm text-muted">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 accent-green"
              />
              Save this address to my account for next time
            </label>
          )}
        </section>

        {/* ── Payment method ── */}
        <section className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
          <h2 className="display text-xl text-navy">Payment</h2>
          <div className="mt-5 space-y-3">
            {settings.codEnabled && (
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  payment === "cod" ? "border-green bg-green/5" : "border-mist hover:border-green/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                  className="mt-1 h-4 w-4 accent-green"
                />
                <span>
                  <span className="block font-display text-sm font-bold text-navy">
                    Cash on Delivery
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Pay the driver in cash or by card when your tiles arrive.
                  </span>
                </span>
              </label>
            )}

            {settings.razorpayEnabled && (
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  payment === "razorpay" ? "border-gold bg-gold/5" : "border-mist hover:border-gold/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "razorpay"}
                  onChange={() => setPayment("razorpay")}
                  className="mt-1 h-4 w-4 accent-green"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-navy">
                      Pay online with{" "}
                      <span className="rounded bg-[#0b2149] px-1.5 py-0.5 text-white">
                        Razor<span className="text-[#3395ff]">pay</span>
                      </span>
                    </span>
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-display text-[0.6rem] font-bold tracking-wide text-navy uppercase">
                      Coming soon
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    UPI · Cards · Netbanking · Wallets
                  </span>
                </span>
              </label>
            )}
          </div>

          {razorpaySelected && (
            <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-navy">
              Online payments aren&apos;t switched on just yet — please choose{" "}
              <strong>Cash on Delivery</strong> to place your order today.
            </p>
          )}

          <div className="mt-6">
            <label htmlFor="co-note" className={labelCls}>
              Order notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="co-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Delivery instructions, preferred dates…"
              className={`${inputCls} resize-y`}
            />
          </div>
        </section>
      </div>

      {/* ── Summary ── */}
      <aside className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
        <h2 className="display text-xl text-navy">Your order</h2>
        <ul className="mt-5 space-y-4">
          {lines.map(({ tile, sqm, lineTotal }) => (
            <li key={tile.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                <Image src={tile.texture} alt={tile.name} fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{tile.name}</p>
                <p className="text-xs text-muted">{sqm} m²</p>
              </div>
              <p className="text-sm font-bold text-navy">{money(lineTotal, settings.currencySymbol)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2.5 border-t border-mist pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-bold text-navy">{money(subtotal, settings.currencySymbol)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-bold text-navy">
              {deliveryFee === 0 ? <span className="text-green">Free</span> : money(deliveryFee, settings.currencySymbol)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-mist pt-3 text-base">
            <dt className="font-display font-bold text-navy">Total</dt>
            <dd className="font-display font-bold text-navy">{money(total, settings.currencySymbol)}</dd>
          </div>
        </dl>

        {outOfStock && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
            Something in your cart just went out of stock — head back to the cart to remove it.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy || razorpaySelected || outOfStock}
          className="btn btn-green mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-3 text-center text-[0.7rem] text-muted">
          Cash on delivery — nothing is charged online.
        </p>
      </aside>
    </form>
  );
}
