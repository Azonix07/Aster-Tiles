"use client";

import { useState } from "react";
import Link from "next/link";
import { type Ticket } from "@/lib/shopTypes";
import { shortDate } from "@/lib/format";
import { TicketStatusBadge, TicketThread } from "@/components/support/TicketBits";

const CATEGORIES = ["Order", "Delivery", "Product", "Payment", "Other"];

const inputCls =
  "w-full rounded-xl border border-mist bg-off px-4 py-2.5 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20";
const labelCls = "mb-1.5 block font-display text-xs font-bold text-navy";

export default function SupportCenter({
  initialTickets,
  orders,
}: {
  initialTickets: Ticket[];
  orders: { id: string; number: string }[];
}) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  /* new enquiry */
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  /* reply */
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  async function refresh(keepId?: string) {
    const res = await fetch("/api/tickets", { cache: "no-store" });
    if (res.ok) {
      setTickets((await res.json()).tickets ?? []);
      if (keepId) setOpenId(keepId);
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice(null);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, message, orderId: orderId || undefined }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setSubject("");
      setCategory("Order");
      setOrderId("");
      setMessage("");
      setNotice({ kind: "ok", text: "Thanks — we've got your enquiry and will be in touch by email." });
      await refresh(data?.ticket?.id);
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not send your enquiry." });
    }
    setCreating(false);
  }

  async function sendReply(e: React.FormEvent, id: string) {
    e.preventDefault();
    setReplying(true);
    setNotice(null);
    const res = await fetch(`/api/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setReply("");
      await refresh(id);
    } else {
      setNotice({ kind: "err", text: data?.error ?? "Could not send your message." });
    }
    setReplying(false);
  }

  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-green">Support</p>
            <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">How can we help?</h1>
          </div>
          <Link href="/account" className="text-sm font-semibold text-green hover:underline">
            ← Back to account
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Open an enquiry and our team will reply by email. You can follow the whole conversation
          right here.
        </p>

        {notice && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              notice.kind === "ok"
                ? "border-green/30 bg-green/5 text-navy"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* New enquiry */}
        <form onSubmit={createTicket} className="mt-8 rounded-2xl bg-white p-6 shadow-lift sm:p-8">
          <h2 className="display text-xl text-navy">Open a new enquiry</h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sc-subject" className={labelCls}>Subject</label>
                <input
                  id="sc-subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's it about?"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="sc-category" className={labelCls}>Category</label>
                <select
                  id="sc-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {orders.length > 0 && (
              <div>
                <label htmlFor="sc-order" className={labelCls}>
                  Related order <span className="font-normal text-muted">(optional)</span>
                </label>
                <select
                  id="sc-order"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Not about a specific order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.number}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="sc-message" className={labelCls}>Message</label>
              <textarea
                id="sc-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help…"
                className="w-full resize-y rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20"
              />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn btn-green mt-5 disabled:opacity-60">
            {creating ? "Sending…" : "Send enquiry"}
          </button>
        </form>

        {/* Existing enquiries */}
        <div className="mt-10">
          <h2 className="display text-xl text-navy">Your enquiries</h2>
          {tickets.length === 0 ? (
            <p className="mt-4 text-sm text-muted">You haven&apos;t opened any enquiries yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.map((t) => {
                const open = openId === t.id;
                return (
                  <div key={t.id} className="overflow-hidden rounded-2xl bg-white shadow-lift">
                    <button
                      onClick={() => {
                        setOpenId(open ? null : t.id);
                        setReply("");
                        setNotice(null);
                      }}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[0.7rem] font-bold text-muted">{t.number}</span>
                          <TicketStatusBadge status={t.status} />
                        </div>
                        <p className="mt-1 truncate font-display text-sm font-bold text-navy">{t.subject}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {t.category} · updated {shortDate(t.updatedAt)}
                        </p>
                      </div>
                      <span className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>

                    {open && (
                      <div className="border-t border-mist px-5 py-5 sm:px-6">
                        <TicketThread messages={t.messages} />
                        {t.status === "closed" ? (
                          <p className="mt-5 rounded-xl border border-mist bg-off px-4 py-3 text-sm text-muted">
                            This enquiry is closed. Open a new one if you still need a hand.
                          </p>
                        ) : (
                          <form onSubmit={(e) => sendReply(e, t.id)} className="mt-5">
                            <label htmlFor={`reply-${t.id}`} className={labelCls}>Add a reply</label>
                            <textarea
                              id={`reply-${t.id}`}
                              rows={3}
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              placeholder="Type your message…"
                              className="w-full resize-y rounded-xl border border-mist bg-off px-4 py-3 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20"
                            />
                            <button type="submit" disabled={replying} className="btn btn-green mt-3 disabled:opacity-60">
                              {replying ? "Sending…" : "Send message"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
