"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/shopTypes";
import { STATUS_LABELS } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";

export default function OrderControls({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note, paymentStatus, adminNote }),
    });
    if (res.ok) {
      setNote("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not update the order.");
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-gold/40 bg-white p-6 shadow-sm">
      <h2 className="display text-xl text-navy">Update this order</h2>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="oc-status" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Status
          </label>
          <select
            id="oc-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className={inputCls}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="oc-note" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Timeline note <span className="font-normal text-muted">(shown to the customer)</span>
          </label>
          <input
            id="oc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Courier picked up — tracking #12345"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="oc-payment" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Payment status
          </label>
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
          <label htmlFor="oc-admin-note" className="mb-1.5 block font-display text-xs font-bold text-navy">
            Private admin note <span className="font-normal text-muted">(only you see this)</span>
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

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="btn btn-green w-full justify-center disabled:opacity-60"
        >
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
