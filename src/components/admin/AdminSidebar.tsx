"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/shop/AuthForms";

/* ── SVG icon components ──────────────────────── */

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z" />
      <path d="M3.3 7l8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

function TilesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function SiteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", Icon: OrdersIcon },
  { href: "/admin/tiles", label: "Tiles", Icon: TilesIcon },
  { href: "/admin/content", label: "Site Content", Icon: ContentIcon },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-ink px-4 py-5 lg:min-h-screen lg:w-60 lg:border-r lg:border-b-0">
      {/* Brand */}
      <Link href="/admin" className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green font-display text-sm font-bold text-white">A</span>
        <span className="font-display text-lg font-bold text-white">
          Aster <span className="text-green">Admin</span>
        </span>
      </Link>

      {/* User badge */}
      <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green/20 text-[0.65rem] font-bold text-green">
          {adminName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white/90">{adminName}</p>
          <p className="text-[0.6rem] text-white/40">Administrator</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex flex-row flex-wrap gap-0.5 lg:flex-col" aria-label="Admin">
        <p className="mb-1 hidden px-3 text-[0.6rem] font-bold tracking-[0.12em] text-white/30 uppercase lg:block">
          Manage
        </p>
        {LINKS.map((l) => {
          const active =
            l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-green/15 text-green shadow-sm"
                  : "text-white/55 hover:bg-white/6 hover:text-white/90"
              }`}
            >
              <l.Icon />
              {l.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-2 border-t border-white/8 pt-5 lg:mt-auto">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/45 transition hover:bg-white/5 hover:text-green"
        >
          <SiteIcon />
          View storefront
        </Link>
        <LogoutButton className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-white/45 transition hover:bg-red-500/10 hover:text-red-400" />
      </div>
    </aside>
  );
}
