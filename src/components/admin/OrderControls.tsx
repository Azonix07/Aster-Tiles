"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/shopTypes";
import { STATUS_LABELS } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

const EMAILED_STATUSES: OrderStatus[] = ["shipped", "out-for-delivery", "delivered", "cancelled"];

export default function OrderControls({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimatedDelivery ?? "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The customer gets an email only when moving into a shipping/final status.
  const willEmail = notifyCustomer && status !== order.status && EMAILED_STATUSES.includes(status);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note,
        paymentStatus,
        adminNote,
        carrier,
        trackingNumber,
        trackingUrl,
        estimatedDelivery,
        notifyCustomer,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setNote("");
      setSaved(data?.emailed ? "Saved & emailed the customer ✓" : "Saved ✓");
      setTimeout(() => setSaved(null), 3000);
      router.refresh();
    } else {
      setError(data?.error ?? "Could not update the order.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-gold/40 bg-white p-6 shadow-sm">
        <h2 className="display text-xl text-navy">Update this order</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="oc-status" className={labelCls}>Status</label>
            <select
              id="oc-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className={inputCls}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="oc-note" className={labelCls}>
              Timeline note <span className="font-normal text-muted">(shown to the customer)</span>
            </label>
            <input
              id="oc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Courier picked up your tiles"
              className={inputCls}
            />
          </div>

          {/* Tracking */}
          <div className="rounded-xl border border-mist bg-off/50 p-4">
            <p className="font-display text-xs font-bold text-navy">Tracking</p>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  aria-label="Carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Carrier (e.g. DPD)"
                  className={inputCls}
                />
                <input
                  aria-label="Tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking #"
                  className={inputCls}
                />
              </div>
              <input
                aria-label="Tracking URL"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="Tracking link (optional)"
                className={inputCls}
              />
              <input
                aria-label="Estimated delivery"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                placeholder="Estimated delivery (e.g. Fri 18 Jul)"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="oc-payment" className={labelCls}>Payment status</label>
            <select
              id="oc-payment"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as Order["paymentStatus"])}
              className={inputCls}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label htmlFor="oc-admin-note" className={labelCls}>
              Private admin note <span className="font-normal text-muted">(only staff see this)</span>
            </label>
            <textarea
              id="oc-admin-note"
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal notes…"
              className={`${inputCls} resize-y`}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-navy">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="h-4 w-4 accent-green"
            />
            Email the customer on status changes
          </label>
          {willEmail && (
            <p className="text-[0.7rem] text-green">
              The customer will be emailed that this order is “{STATUS_LABELS[status]}”.
            </p>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="btn btn-green w-full justify-center disabled:opacity-60"
          >
            {busy ? "Saving…" : saved ? saved : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
