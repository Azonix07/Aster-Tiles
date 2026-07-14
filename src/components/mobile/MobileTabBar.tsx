"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite, useUser } from "@/components/StoreProvider";
import { useCart } from "@/components/CartProvider";

/* ── Icons (stroke inherits currentColor) ──────────────────────────── */

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9 } as const;

function HomeIcon() {
  return (
    <svg {...icon} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg {...icon} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h3.5l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...icon} aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}
function SmallIcon({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* menu-row icon paths */
const D = {
  collections: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  visualizer: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  about: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v.01M12 11v6",
  contact: "M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  cart: "M3 4h2l2.5 12.5A2 2 0 0 0 9.5 18H18a2 2 0 0 0 2-1.6L21.5 8H6M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8a7.5 7.5 0 0 1 15 0",
  admin: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Zm-2.5 9 2 2 3.5-4",
};

/**
 * Mobile bottom navigation — Home, Call, Email and a Menu that pops an
 * animated panel out of the icon with the remaining pages. Hidden on lg+.
 */
export default function MobileTabBar() {
  const site = useSite();
  const user = useUser();
  const { items } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the popup when the route changes (render-time reset).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Hide on admin screens — they have their own chrome.
  if (pathname.startsWith("/admin")) return null;

  const menuLinks = [
    ...site.nav.filter((l) => l.href !== "/").map((l) => ({
      ...l,
      d: l.href.includes("visualizer")
        ? D.visualizer
        : l.href.includes("collections")
          ? D.collections
          : l.href.includes("about")
            ? D.about
            : D.contact,
      badge: 0,
    })),
    { href: "/cart", label: "Cart", d: D.cart, badge: items.length },
    user
      ? { href: "/account", label: "My Account", d: D.account, badge: 0 }
      : { href: "/login", label: "Log in", d: D.account, badge: 0 },
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin Panel", d: D.admin, badge: 0 }] : []),
  ];

  const tabCls =
    "flex flex-col items-center justify-center gap-1 py-2.5 font-display text-[0.58rem] font-bold tracking-[0.08em] uppercase transition-colors";

  return (
    <nav aria-label="Quick navigation" className="lg:hidden">
      {/* dimmer behind the popup */}
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[80] cursor-default bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))]">
        <div className="relative mx-auto max-w-md">
          {/* ── popup — grows out of the menu icon ─────────────── */}
          <div
            id="mobile-menu-popup"
            className={`absolute right-0 bottom-[calc(100%+0.7rem)] w-60 origin-bottom-right rounded-2xl border border-mist bg-white/95 p-2 shadow-[0_18px_50px_rgba(12,35,64,0.22)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              open
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-[0.4] opacity-0"
            }`}
          >
            {menuLinks.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300 hover:bg-navy/5 ${
                  open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                } ${pathname === l.href ? "text-green-2" : "text-body"}`}
                style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${pathname === l.href ? "bg-green/15 text-green-2" : "bg-navy/6 text-muted"}`}>
                  <SmallIcon d={l.d} />
                </span>
                <span className="font-display text-sm font-bold">{l.label}</span>
                {l.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-1.5 font-display text-[0.65rem] font-bold text-white">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
            {/* little tail pointing at the menu icon */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 rounded-[3px] border-r border-b border-mist bg-white/95"
            />
          </div>

          {/* ── the bar ─────────────────────────────────────────── */}
          <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-mist bg-white/92 shadow-[0_10px_36px_rgba(12,35,64,0.18)] backdrop-blur-xl">
            <Link
              href="/"
              className={`${tabCls} ${pathname === "/" ? "text-green-2" : "text-muted hover:text-navy"}`}
            >
              <HomeIcon />
              Home
            </Link>
            <a href={site.phoneHref} className={`${tabCls} text-muted hover:text-navy`}>
              <PhoneIcon />
              Call us
            </a>
            <a href={site.emailHref} className={`${tabCls} text-muted hover:text-navy`}>
              <MailIcon />
              Email us
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu-popup"
              className={`${tabCls} cursor-pointer ${open ? "text-green-2" : "text-muted hover:text-navy"}`}
            >
              {/* hamburger that folds into an X */}
              <span className="flex h-[22px] w-[22px] flex-col items-center justify-center gap-[4.5px]" aria-hidden="true">
                <span className={`block h-[2px] w-[18px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
                <span className={`block h-[2px] w-[18px] rounded-full bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
                <span className={`block h-[2px] w-[18px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
              </span>
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
