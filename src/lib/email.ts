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
