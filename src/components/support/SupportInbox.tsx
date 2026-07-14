"use client";

import { useState } from "react";
import Link from "next/link";
import { TICKET_STATUSES, type Ticket, type TicketStatus } from "@/lib/shopTypes";
import { dateTime, shortDate } from "@/lib/format";
import { TicketStatusBadge, TicketThread } from "@/components/support/TicketBits";

const STATUS_TABS: { key: TicketStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "pending", label: "Awaiting reply" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const STATUS_ACTION: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Awaiting reply",
  resolved: "Resolved",
  closed: "Closed",
};

export default function SupportInbox({
  initialTickets,
  emailReady,
}: {
  initialTickets: Ticket[];
  emailReady: boolean;
}) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialTickets[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const visible = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const countFor = (key: TicketStatus | "all") =>
    key === "all" ? tickets.length : tickets.filter((t) => t.status === key).length;

  async function refresh(keepId?: string) {
    const res = await fetch("/api/admin/tickets", { cache: "no-store" });
    if (!res.ok) return;
    const next: Ticket[] = (await res.json()).tickets ?? [];
    setTickets(next);
    if (keepId && next.some((t) => t.id === keepId)) setSelectedId(keepId);
  }

  async function changeStatus(id: string, status: TicketStatus) {
    setBusyStatus(true);
    setNotice(null);
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await refresh(id);
    else {
      const data = await res.json().catch(() => null);
      setNotice({ kind: "err", text: data?.error ?? "Could not update status." });
    }
    setBusyStatus(false);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setNotice(null);
    const res = await fetch(`/api/admin/tickets/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setReply("");
      if (data?.emailed) {
        setNotice({ kind: "ok", text: `Reply sent and emailed to ${selected.customerEmail}.` });
      } else if (data?.emailSkipped) {
        setNotice({
          kind: "ok",
          text: "Reply saved. Email isn't set up yet, so it wasn't sent — add RESEND_API_KEY to email customers.",
        });
      } else {
        setNotice({
          kind: "err",
          text: `Reply saved, but the email didn't go through: ${data?.emailError ?? "unknown error"}.`,
        });
      }
      await refresh(selected.id);
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not send reply." });
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm text-muted">Customer support</p>
        <h1 className="display mt-1 text-3xl text-navy">Support inbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Enquiries opened by customers. Reply here and they&apos;ll get an email — they can respond
          and keep the thread going.
        </p>
      </div>

      {!emailReady && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Email isn&apos;t configured yet, so replies are saved but not sent. Add a{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-[0.8em]">RESEND_API_KEY</code>{" "}
          to email customers automatically.
        </div>
      )}

      {notice && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            notice.kind === "ok"
              ? "border-green/30 bg-green/5 text-navy"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-mist bg-white/60 px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-navy">No support tickets yet</p>
          <p className="mt-1 text-sm text-muted">
            When a customer opens an enquiry from their account, it&apos;ll land here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,21rem)_1fr] lg:items-start">
          {/* List */}
          <div className="lg:sticky lg:top-6">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`rounded-lg border px-2.5 py-1 font-display text-[0.7rem] font-bold transition ${
                    filter === t.key
                      ? "border-green bg-green/10 text-green"
                      : "border-mist text-muted hover:border-green/40"
                  }`}
                >
                  {t.label}
                  <span className="ml-1 opacity-60">{countFor(t.key)}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {visible.length === 0 ? (
                <p className="rounded-xl border border-mist bg-white px-4 py-6 text-center text-sm text-muted">
                  Nothing in this view.
                </p>
              ) : (
                visible.map((t) => {
                  const active = t.id === selectedId;
                  const last = t.messages[t.messages.length - 1];
                  const awaitingUs = last?.author === "customer";
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedId(t.id);
                        setNotice(null);
                        setReply("");
                      }}
                      className={`w-full rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-green bg-green/5 shadow-sm"
                          : "border-mist bg-white hover:border-green/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-[0.7rem] font-bold text-muted">
                          {t.number}
                        </span>
                        <TicketStatusBadge status={t.status} />
                      </div>
                      <p className="mt-1 truncate font-display text-sm font-bold text-navy">
                        {t.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {t.customerName} · {shortDate(t.updatedAt)}
                      </p>
                      {awaitingUs && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] font-bold text-green">
                          <span className="h-1.5 w-1.5 rounded-full bg-green" />
                          Needs a reply
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail */}
          {selected ? (
            <div className="rounded-2xl border border-mist bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-mist pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[0.7rem] font-bold text-muted">
                      {selected.number}
                    </span>
                    <span className="rounded bg-off px-1.5 py-0.5 text-[0.6rem] font-bold text-muted">
                      {selected.category}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-lg font-bold text-navy">{selected.subject}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {selected.customerName} ·{" "}
                    <a href={`mailto:${selected.customerEmail}`} className="text-green hover:underline">
                      {selected.customerEmail}
                    </a>{" "}
                    · opened {dateTime(selected.createdAt)}
                    {selected.orderId && (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/orders/${selected.orderId}`}
                          className="font-semibold text-green hover:underline"
                        >
                          View order
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Status control */}
              <div className="mt-4">
                <p className="mb-1.5 font-display text-xs font-bold text-navy">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {TICKET_STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={busyStatus || s === selected.status}
                      onClick={() => changeStatus(selected.id, s)}
                      className={`rounded-lg border px-3 py-1.5 font-display text-xs font-bold transition disabled:cursor-default ${
                        s === selected.status
                          ? "border-navy bg-navy text-white"
                          : "border-mist text-muted hover:border-green/40 disabled:opacity-60"
                      }`}
                    >
                      {STATUS_ACTION[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread */}
              <div className="mt-6">
                <TicketThread messages={selected.messages} />
              </div>

              {/* Reply */}
              {selected.status === "closed" ? (
                <p className="mt-6 rounded-xl border border-mist bg-off px-4 py-3 text-sm text-muted">
                  This ticket is closed. Set it back to Open to reply.
                </p>
              ) : (
                <form onSubmit={sendReply} className="mt-6 border-t border-mist pt-5">
                  <label htmlFor="reply" className="mb-1.5 block font-display text-xs font-bold text-navy">
                    Reply to {selected.customerName.split(" ")[0]}
                  </label>
                  <textarea
                    id="reply"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="w-full resize-y rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button type="submit" disabled={sending} className="btn btn-green disabled:opacity-60">
                      {sending ? "Sending…" : emailReady ? "Send reply & email" : "Save reply"}
                    </button>
                    <span className="text-[0.7rem] text-muted">
                      {emailReady
                        ? "The customer gets an email they can reply to."
                        : "Stored on the ticket; email isn't set up yet."}
                    </span>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-mist bg-white/60 px-6 py-16 text-center">
              <p className="text-sm text-muted">Select a ticket to read and reply.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
