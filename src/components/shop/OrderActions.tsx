"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useTiles } from "@/components/StoreProvider";

/** Customer-side order controls: reorder, get help, and cancel (pre-dispatch). */
export default function OrderActions({
  orderId,
  cancellable,
  items,
}: {
  orderId: string;
  cancellable: boolean;
  items: { tileId: string; sqm: number }[];
}) {
  const router = useRouter();
  const { add } = useCart();
  const tiles = useTiles();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reorder = () => {
    setError(null);
    // Only re-add tiles that still exist — a since-deleted tile would otherwise
    // become an invisible, un-removable phantom line in the cart.
    const available = items.filter((i) => tiles.some((t) => t.id === i.tileId));
    if (available.length === 0) {
      setError("Sorry, these items are no longer available to reorder.");
      return;
    }
    available.forEach((i) => add(i.tileId, i.sqm));
    router.push("/cart");
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(data?.error ?? "Could not cancel the order.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8">
      <h2 className="display text-xl text-navy">Manage order</h2>
      <div className="mt-5 flex flex-col gap-3">
        <button type="button" onClick={reorder} className="btn btn-ghost-dark justify-center">
          Reorder these items
        </button>
        <Link href="/account/support" className="btn btn-ghost-dark justify-center">
          Need help with this order?
        </Link>
        {cancellable && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50"
          >
            Cancel this order
          </button>
        )}
      </div>

      {cancellable && confirming && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-4">
          <p className="font-display text-sm font-bold text-navy">Cancel this order?</p>
          <p className="mt-1 text-xs text-muted">
            It hasn&apos;t been dispatched yet, so you can still cancel. This can&apos;t be undone.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason (optional)"
            className="mt-3 w-full resize-y rounded-lg border border-mist bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-red-400"
          />
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "Cancelling…" : "Yes, cancel order"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md border border-mist px-4 py-2 text-sm font-bold text-navy transition hover:border-navy"
            >
              Keep order
            </button>
          </div>
        </div>
      )}

      {error && !confirming && (
        <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
