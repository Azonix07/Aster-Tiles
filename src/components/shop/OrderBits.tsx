import { STATUS_LABELS } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/db";

const BADGE_STYLES: Record<OrderStatus, string> = {
  pending: "bg-gold/15 text-[#8a6d1f] border-gold/40",
  confirmed: "bg-navy/10 text-navy border-navy/20",
  processing: "bg-navy/10 text-navy border-navy/20",
  shipped: "bg-green/10 text-green-2 border-green/30",
  "out-for-delivery": "bg-green/10 text-green-2 border-green/30",
  delivered: "bg-green text-white border-green",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-display text-[0.65rem] font-bold tracking-[0.06em] uppercase ${BADGE_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const PROGRESS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out-for-delivery",
  "delivered",
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <p className="font-display text-sm font-bold text-red-600">This order was cancelled.</p>
      </div>
    );
  }
  const currentIdx = PROGRESS.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {PROGRESS.map((step, i) => {
        const reached = i <= currentIdx;
        return (
          <li key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[0.65rem] font-bold ${
                  reached
                    ? "border-green bg-green text-white"
                    : "border-mist bg-white text-muted"
                }`}
              >
                {reached ? "✓" : i + 1}
              </span>
              <span
                className={`mt-1.5 max-w-20 text-center text-[0.6rem] leading-tight font-bold ${
                  reached ? "text-navy" : "text-muted/60"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < PROGRESS.length - 1 && (
              <span
                aria-hidden
                className={`mx-1 mb-5 h-0.5 w-6 sm:w-10 ${i < currentIdx ? "bg-green" : "bg-mist"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline({ events: input }: { events: Order["timeline"] }) {
  const events = [...input].reverse();
  return (
    <ol className="space-y-4">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="flex gap-3">
          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-green" : "bg-mist"}`}
          />
          <div>
            <p className="text-sm font-bold text-navy">{STATUS_LABELS[e.status]}</p>
            {e.note && <p className="mt-0.5 text-xs text-muted">{e.note}</p>}
            <p className="mt-0.5 text-[0.7rem] text-muted/70">
              {new Date(e.at).toLocaleString("en-IE", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
