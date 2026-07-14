/**
 * Transactional email via Resend's REST API (no SDK dependency — just fetch).
 *
 * Everything degrades gracefully: if RESEND_API_KEY isn't set we return
 * { ok: false, skipped: true } so callers can still store the record and tell
 * the user the message wasn't emailed, rather than throwing.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "Aster Tiles <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aster-tiles.vercel.app";

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!RESEND_API_KEY) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Email failed." };
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Attribute-safe escaping for values placed inside an HTML attribute (e.g. href). */
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

function shell(title: string, inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0c2340">
    <div style="background:#0c2340;padding:20px 24px;border-radius:12px 12px 0 0">
      <span style="color:#fff;font-size:18px;font-weight:700">Aster <span style="color:#2db87c">Tiles</span></span>
    </div>
    <div style="border:1px solid #e6ebf1;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px">${esc(title)}</h1>
      ${inner}
    </div>
  </div>`;
}

export async function sendTeamInvite(opts: {
  to: string;
  name: string;
  role: string;
  tempPassword: string;
  invitedBy: string;
}): Promise<SendResult> {
  const inner = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6">${esc(opts.invitedBy)} added you to the Aster Tiles team as <strong>${esc(opts.role)}</strong>.</p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6">Sign in with:</p>
    <div style="background:#f4f7fa;border-radius:8px;padding:12px 16px;font-size:14px;margin-bottom:16px">
      <div>Email: <strong>${esc(opts.to)}</strong></div>
      <div>Temporary password: <strong>${esc(opts.tempPassword)}</strong></div>
    </div>
    <a href="${APP_URL}/login" style="display:inline-block;background:#2db87c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px">Sign in</a>
    <p style="margin:16px 0 0;font-size:12px;color:#4a5f78">Please change your password after your first sign-in.</p>`;
  return sendEmail({
    to: opts.to,
    subject: "You've been added to the Aster Tiles team",
    html: shell("Welcome to the team", inner),
    text: `${opts.invitedBy} added you to the Aster Tiles team as ${opts.role}. Sign in at ${APP_URL}/login with ${opts.to} and temporary password ${opts.tempPassword}.`,
  });
}

export async function sendTicketReply(opts: {
  to: string;
  customerName: string;
  ticketNumber: string;
  subject: string;
  body: string;
  agentName: string;
}): Promise<SendResult> {
  const bodyHtml = esc(opts.body).replace(/\n/g, "<br/>");
  const inner = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6">Hi ${esc(opts.customerName)}, here's an update on your enquiry <strong>${esc(opts.ticketNumber)}</strong> — “${esc(opts.subject)}”.</p>
    <div style="border-left:3px solid #2db87c;padding:4px 0 4px 14px;margin:16px 0;font-size:14px;line-height:1.6;color:#0c2340">${bodyHtml}</div>
    <p style="margin:16px 0 0;font-size:13px;color:#4a5f78">— ${esc(opts.agentName)}, Aster Tiles</p>
    <p style="margin:8px 0 0;font-size:12px;color:#4a5f78">Just reply to this email to continue the conversation.</p>`;
  return sendEmail({
    to: opts.to,
    subject: `Re: ${opts.subject} [${opts.ticketNumber}]`,
    html: shell(`Update on ${opts.ticketNumber}`, inner),
    text: `${opts.body}\n\n— ${opts.agentName}, Aster Tiles`,
  });
}

/* ── Orders ─────────────────────────────────────────── */

type OrderEmailItem = { name: string; sqm: number; pricePerSqm: number; lineTotal: number };

const money = (n: number, symbol: string) =>
  `${symbol}${n.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function itemsTable(items: OrderEmailItem[], symbol: string): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:#0c2340">${esc(i.name)}<br/><span style="color:#4a5f78">${i.sqm} m² × ${money(i.pricePerSqm, symbol)}/m²</span></td>
        <td style="padding:8px 0;font-size:13px;color:#0c2340;text-align:right;white-space:nowrap">${money(i.lineTotal, symbol)}</td>
      </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0">${rows}</table>`;
}

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currencySymbol: string;
  paymentMethod: "cod" | "razorpay";
  trackingUrl?: string;
}): Promise<SendResult> {
  const s = opts.currencySymbol;
  const inner = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6">Hi ${esc(opts.customerName)}, thanks for your order — we've received it and will be in touch to arrange delivery.</p>
    <p style="margin:0 0 4px;font-size:13px;color:#4a5f78">Order <strong style="color:#0c2340">${esc(opts.orderNumber)}</strong></p>
    ${itemsTable(opts.items, s)}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6ebf1;margin-top:8px">
      <tr><td style="padding:6px 0;font-size:13px;color:#4a5f78">Subtotal</td><td style="padding:6px 0;font-size:13px;text-align:right;color:#0c2340">${money(opts.subtotal, s)}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:#4a5f78">Delivery</td><td style="padding:6px 0;font-size:13px;text-align:right;color:#0c2340">${opts.deliveryFee === 0 ? "Free" : money(opts.deliveryFee, s)}</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;font-weight:700;color:#0c2340;border-top:1px solid #e6ebf1">Total</td><td style="padding:8px 0;font-size:15px;font-weight:700;text-align:right;color:#0c2340;border-top:1px solid #e6ebf1">${money(opts.total, s)}</td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:#4a5f78">Payment: ${opts.paymentMethod === "cod" ? "Cash on Delivery — pay the driver when your tiles arrive." : "Online (Razorpay)."}</p>
    ${opts.trackingUrl ? `<a href="${escAttr(opts.trackingUrl)}" style="display:inline-block;margin-top:16px;background:#2db87c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px">Track your order</a>` : ""}`;
  return sendEmail({
    to: opts.to,
    subject: `Order confirmed — ${opts.orderNumber}`,
    html: shell(`Order ${opts.orderNumber} confirmed`, inner),
    text: `Hi ${opts.customerName}, thanks for your order ${opts.orderNumber}. Total ${money(opts.total, s)}, ${opts.paymentMethod === "cod" ? "cash on delivery" : "paid online"}.${opts.trackingUrl ? ` Track it: ${opts.trackingUrl}` : ""}`,
  });
}

export async function sendOrderStatusUpdate(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  statusLabel: string;
  note?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
}): Promise<SendResult> {
  const inner = `
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6">Hi ${esc(opts.customerName)}, there's an update on your order <strong>${esc(opts.orderNumber)}</strong>.</p>
    <div style="border-left:3px solid #2db87c;padding:8px 0 8px 14px;margin:16px 0">
      <p style="margin:0;font-size:15px;font-weight:700;color:#0c2340">${esc(opts.statusLabel)}</p>
      ${opts.note ? `<p style="margin:4px 0 0;font-size:13px;color:#4a5f78">${esc(opts.note)}</p>` : ""}
      ${opts.carrier || opts.trackingNumber ? `<p style="margin:6px 0 0;font-size:13px;color:#4a5f78">${opts.carrier ? esc(opts.carrier) : "Tracking"}${opts.trackingNumber ? `: <strong style="color:#0c2340">${esc(opts.trackingNumber)}</strong>` : ""}</p>` : ""}
    </div>
    ${opts.trackingUrl ? `<a href="${escAttr(opts.trackingUrl)}" style="display:inline-block;background:#2db87c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px">View order status</a>` : ""}`;
  return sendEmail({
    to: opts.to,
    subject: `Order ${opts.orderNumber}: ${opts.statusLabel}`,
    html: shell(`Order ${opts.orderNumber} update`, inner),
    text: `Hi ${opts.customerName}, your order ${opts.orderNumber} is now: ${opts.statusLabel}.${opts.note ? ` ${opts.note}` : ""}${opts.trackingNumber ? ` Tracking: ${opts.trackingNumber}` : ""}${opts.trackingUrl ? ` ${opts.trackingUrl}` : ""}`,
  });
}
