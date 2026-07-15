"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useSettings, useSite, useTiles, useUser } from "@/components/StoreProvider";

type Role = "user" | "assistant";

interface Turn {
  role: Role;
  body: string;
  tileIds?: string[];
  link?: { href: string; label: string } | null;
}

const KEY_NOTICE = "The showroom assistant needs an API key — add ANTHROPIC_API_KEY to .env.local";

/** How long a visitor browses before we offer a hand, once per session. */
const NUDGE_DELAY_MS = 60_000;
const NUDGE_KEY = "aster_chat_nudge_seen";

const THINKING_COPY = [
  "Checking the catalogue…",
  "Having a look…",
  "Measuring twice…",
];

const OPENERS = [
  "Which tiles suit a bathroom?",
  "How much is delivery?",
  "Where is the showroom?",
];

const icon = {
  chat: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  close: "M18 6L6 18M6 6l12 12",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  arrow: "M5 12h14M12 5l7 7-7 7",
} as const;

/** Remember we've made our one offer, so a reload doesn't start pestering again. */
function markNudgeSeen() {
  try {
    sessionStorage.setItem(NUDGE_KEY, "1");
  } catch {
    /* storage unavailable — the nudge just falls back to once per page load */
  }
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The floating showroom assistant. Answers from the live catalogue and site details
 * via /api/chat, and — once per session, after a minute of browsing — offers a hand
 * unprompted rather than waiting to be found.
 */
export default function ChatWidget() {
  const pathname = usePathname();
  const site = useSite();
  const tiles = useTiles();
  const user = useUser();
  const { paymentsDown } = useSettings();

  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copyIdx, setCopyIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      body: `Hello${user ? `, ${user.name.split(" ")[0]}` : ""} — I'm the Aster showroom assistant. Ask me about tiles, sizes, prices, or finding us in Lifford.`,
    },
  ]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Once someone engages, the nudge has done its job and must never fire.
  const engagedRef = useRef(false);

  // Close on navigation — the render-time reset React recommends over a
  // setState-in-effect cascade, as Nav and MobileTabBar both do. The nudge is left
  // alone: it costs the visitor their one offer per session, so navigating away from
  // the page it appeared on must not silently spend it.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Dwell timer. The widget mounts once in the site layout and survives every
  // navigation, so a single mount-time timer measures time on the *site*, not the page.
  useEffect(() => {
    if (paymentsDown) return;
    try {
      if (sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      /* storage unavailable (private mode) — just skip the once-per-session memory */
    }
    const t = window.setTimeout(() => {
      if (engagedRef.current) return;
      setNudge(true);
      posthog.capture("chat_nudge_shown", { dwell_seconds: NUDGE_DELAY_MS / 1000 });
      markNudgeSeen();
    }, NUDGE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [paymentsDown]);

  useEffect(() => {
    if (!sending) return;
    const t = window.setInterval(
      () => setCopyIdx((i) => (i + 1) % THINKING_COPY.length),
      1800,
    );
    return () => window.clearInterval(t);
  }, [sending]);

  useEffect(() => {
    if (!open) return;
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, sending, open]);

  const openChat = (source: string) => {
    engagedRef.current = true;
    markNudgeSeen();
    setNudge(false);
    setOpen(true);
    posthog.capture("chat_opened", { source, path: pathname });
    window.setTimeout(() => inputRef.current?.focus(), 320);
  };

  const dismissNudge = () => {
    engagedRef.current = true;
    markNudgeSeen();
    setNudge(false);
    posthog.capture("chat_nudge_dismissed", { path: pathname });
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    const history = turns.map((t) => ({ role: t.role, body: t.body }));
    setTurns((prev) => [...prev, { role: "user", body: message }]);
    setInput("");
    setSending(true);
    setError(null);
    setKeyNotice(null);
    setCopyIdx(0);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, path: pathname }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        tileIds?: string[];
        link?: { href: string; label: string } | null;
        error?: string;
      };
      if (res.status === 501) {
        setKeyNotice(json.error ?? KEY_NOTICE);
      } else if (!res.ok || !json.reply) {
        setError(json.error ?? "The assistant had a problem. Please try again in a moment.");
        posthog.captureException(new Error(json.error ?? "chat failed"), { path: pathname });
      } else {
        posthog.capture("chat_message_sent", {
          message_length: message.length,
          path: pathname,
          has_tile_suggestions: (json.tileIds?.length ?? 0) > 0,
        });
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            body: json.reply!,
            tileIds: json.tileIds ?? [],
            link: json.link ?? null,
          },
        ]);
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      // Clears the mobile tab bar, and steps up again over the payments banner —
      // the one other thing that claims this corner.
      className={`fixed right-4 z-[70] lg:right-6 ${
        paymentsDown
          ? "bottom-[calc(9rem+env(safe-area-inset-bottom))] lg:bottom-16"
          : "bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-6"
      }`}
      data-chat-widget
    >
      {/* ── Panel ────────────────────────────────── */}
      {/* `inert` (not aria-hidden) while closed: the panel stays mounted so it can
          animate, and inert is what actually takes its input and buttons out of the
          tab order and off the accessibility tree. */}
      <div
        role="dialog"
        aria-label="Chat with the Aster showroom assistant"
        inert={!open}
        className={`absolute right-0 bottom-[calc(100%+0.75rem)] flex h-[min(70vh,34rem)] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-mist bg-white/95 shadow-[0_18px_50px_rgba(12,35,64,0.22)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:w-[24rem] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-[0.4] opacity-0"
        }`}
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-mist bg-navy px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green/20 text-green">
            <Icon d={icon.chat} size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-white">Showroom Assistant</p>
            <p className="truncate text-[0.68rem] text-mist/70">
              Tiles, floors &amp; bathrooms · Lifford
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon d={icon.close} size={16} />
          </button>
        </div>

        {/* transcript */}
        <div
          ref={transcriptRef}
          data-lenis-prevent
          className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-off px-4 py-4"
        >
          {turns.map((turn, i) => (
            <div key={i}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  turn.role === "user"
                    ? "ml-auto bg-green text-white"
                    : "border border-mist bg-white text-body"
                }`}
              >
                {turn.body}
              </div>

              {/* tiles the assistant picked, as real cards */}
              {turn.tileIds && turn.tileIds.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {turn.tileIds.map((id) => {
                    const tile = tiles.find((t) => t.id === id);
                    if (!tile) return null;
                    return (
                      <Link
                        key={id}
                        href={`/tiles/${tile.id}`}
                        className="group rounded-xl border border-mist bg-white p-1.5 transition-colors hover:border-green/50"
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                          <Image
                            src={tile.texture}
                            alt={tile.name}
                            fill
                            sizes="110px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-1.5 truncate text-[0.62rem] font-semibold text-navy">
                          {tile.name}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* the one page it offered */}
              {turn.link && (
                <Link
                  href={turn.link.href}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-3 py-1.5 font-display text-[0.68rem] font-bold text-navy transition-colors hover:border-green hover:text-green"
                >
                  {turn.link.label}
                  <Icon d={icon.arrow} size={12} />
                </Link>
              )}
            </div>
          ))}

          {sending && (
            <p className="text-xs text-muted" aria-live="polite">
              {THINKING_COPY[copyIdx]}
            </p>
          )}

          {keyNotice && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-3">
              <p className="text-xs font-semibold text-gold">
                The assistant is not configured yet
              </p>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">{keyNotice}</p>
              <p className="mt-1 text-[0.68rem] text-muted/70">
                In the meantime, ring the showroom on {site.phone}.
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* openers, only before the visitor has said anything */}
          {turns.length === 1 && !sending && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {OPENERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-mist bg-white px-3 py-1.5 text-[0.68rem] text-muted transition-colors hover:border-green hover:text-green"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-mist bg-white px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            placeholder="Ask about tiles, sizes or delivery…"
            aria-label="Your message"
            className="w-full rounded-xl border border-mist bg-off px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/50 focus:border-green focus:ring-2 focus:ring-green/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green text-white transition-colors hover:bg-green-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon d={icon.send} size={16} />
          </button>
        </form>
      </div>

      {/* ── Nudge ────────────────────────────────── */}
      {/* The bubble stays mounted so it can animate, but its contents are only rendered
          once it is actually offered — that is what makes the live region announce, and
          it keeps two buttons out of the tab order the rest of the time. */}
      <div
        role="status"
        aria-live="polite"
        className={`absolute right-0 bottom-[calc(100%+0.75rem)] w-60 origin-bottom-right rounded-2xl border border-mist bg-white/95 p-3.5 shadow-[0_18px_50px_rgba(12,35,64,0.22)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          nudge && !open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible translate-y-4 scale-[0.4] opacity-0"
        }`}
      >
        {nudge && !open && (
          <>
            <button
              type="button"
              onClick={dismissNudge}
              aria-label="Dismiss"
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-navy"
            >
              <Icon d={icon.close} size={12} />
            </button>
            <p className="pr-5 text-sm leading-relaxed text-body">
              Can I give you a hand? I can help you narrow down a tile, or check anything
              about the showroom.
            </p>
            <button
              type="button"
              onClick={() => {
                posthog.capture("chat_nudge_accepted", { path: pathname });
                openChat("nudge");
              }}
              className="mt-2.5 font-display text-[0.68rem] font-bold text-green transition-colors hover:text-green-2"
            >
              Yes please →
            </button>
            {/* tail, pointing at the launcher */}
            <span
              className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 rounded-[3px] border-r border-b border-mist bg-white/95"
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {/* ── Launcher ─────────────────────────────── */}
      {/* Green, like every other primary action here: navy read as part of the artwork
          on the dark hero photos and disappeared. The ring keeps it separated from
          whatever image happens to be behind it. */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat("launcher"))}
        aria-label={open ? "Close chat" : "Chat with the showroom assistant"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green text-white ring-2 ring-white/70 shadow-green transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-green-2 hover:shadow-lift motion-reduce:transition-none"
      >
        <span className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
          <Icon d={open ? icon.close : icon.chat} size={22} />
        </span>
      </button>
    </div>
  );
}
