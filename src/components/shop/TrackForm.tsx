"use client";

import { useState } from "react";
import { shortDate } from "@/lib/format";
import { OrderProgress, StatusBadge, Timeline } from "@/components/shop/OrderBits";
import type { Order, OrderStatus } from "@/lib/shopTypes";

type TrackedOrder = {
  number: string;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: Order["timeline"];
  items: { name: string; sqm: number }[];
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
};

const inputCls =
  "w-full rounded-xl border border-mist bg-white px-4 py-3 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

export default function TrackForm({ initialNumber = "" }: { initialNumber?: string }) {
  const [number, setNumber] = useState(initialNumber);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, email }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.order) {
      setOrder(data.order as TrackedOrder);
    } else {
      setError(data?.error ?? "Something went wrong — please try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="tk-number" className={labelCls}>Order number</label>
            <input
              id="tk-number"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="AT-2026-0042"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="tk-email" className={labelCls}>Email on the order</label>
            <input
              id="tk-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.ie"
              className={inputCls}
            />
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
        )}
        <button type="submit" disabled={busy} className="btn btn-green mt-5 disabled:opacity-60">
          {busy ? "Looking…" : "Track order"}
        </button>
      </form>

      {order && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display text-2xl text-navy">Order {order.number}</h2>
              <p className="mt-1 text-sm text-muted">
                Placed {shortDate(order.createdAt)} · updated {shortDate(order.updatedAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-lift sm:p-8">
            <OrderProgress status={order.status} />
          </div>

          {(order.carrier || order.trackingNumber || order.estimatedDelivery) && (
            <div className="mt-6 rounded-2xl border border-green/30 bg-green/5 p-6">
              <h3 className="font-display text-sm font-bold text-navy">Delivery tracking</h3>
              <dl className="mt-3 space-y-1.5 text-sm">
                {order.carrier && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Carrier</dt>
                    <dd className="font-bold text-navy">{order.carrier}</dd>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Tracking number</dt>
                    <dd className="font-bold text-navy">{order.trackingNumber}</dd>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Estimated delivery</dt>
                    <dd className="font-bold text-navy">{order.estimatedDelivery}</dd>
                  </div>
                )}
              </dl>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-green mt-4"
                >
                  Track with carrier
                </a>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h3 className="display text-lg text-navy">Items</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {order.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between border-b border-mist/60 pb-2 last:border-0">
                    <span className="text-navy">{i.name}</span>
                    <span className="text-muted">{i.sqm} m²</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
              <h3 className="display text-lg text-navy">History</h3>
              <div className="mt-4">
                <Timeline events={order.timeline} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
