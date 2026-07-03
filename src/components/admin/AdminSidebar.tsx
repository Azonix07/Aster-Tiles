"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/shop/AuthForms";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/tiles", label: "Tiles", icon: "🀫" },
  { href: "/admin/content", label: "Site content", icon: "✏️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-ink px-4 py-5 lg:min-h-screen lg:w-60 lg:border-r lg:border-b-0">
      <Link href="/admin" className="px-2 font-display text-lg font-bold text-white">
        Aster <span className="text-green">Admin</span>
      </Link>
      <p className="mt-1 px-2 text-xs text-white/40">Signed in as {adminName}</p>

      <nav className="mt-6 flex flex-row flex-wrap gap-1 lg:flex-col" aria-label="Admin">
        {LINKS.map((l) => {
          const active =
            l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-green text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 lg:mt-auto">
        <Link href="/" className="text-xs font-bold text-white/50 transition hover:text-green">
          ← View site
        </Link>
        <LogoutButton className="text-xs font-bold text-white/50 transition hover:text-red-400" />
      </div>
    </aside>
  );
}
