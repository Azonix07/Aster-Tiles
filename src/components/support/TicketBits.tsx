import type { TicketMessage, TicketStatus } from "@/lib/shopTypes";
import { dateTime } from "@/lib/format";

const STATUS_STYLE: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  pending: { label: "Awaiting reply", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  closed: { label: "Closed", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

/** Threaded conversation. Customer messages sit left; staff replies sit right in green. */
export function TicketThread({ messages }: { messages: TicketMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => {
        const staff = m.author === "staff";
        return (
          <div key={m.id} className={`flex ${staff ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
              staff ? "border-green/30 bg-green/5" : "border-mist bg-white"
            }`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-display text-xs font-bold text-navy">{m.authorName}</span>
                <span className={`rounded px-1.5 py-0.5 text-[0.55rem] font-bold uppercase ${
                  staff ? "bg-green/15 text-green" : "bg-slate-100 text-slate-500"
                }`}>
                  {staff ? "Team" : "Customer"}
                </span>
                <span className="text-[0.65rem] text-muted">{dateTime(m.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-navy/90">{m.body}</p>
              {staff && m.emailed === false && (
                <p className="mt-1.5 text-[0.65rem] font-semibold text-amber-600">Not emailed — email isn&apos;t configured.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
