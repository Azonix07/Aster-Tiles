"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useSite, useUser } from "@/components/StoreProvider";
import { useCart } from "@/components/CartProvider";

export default function Nav() {
  const site = useSite();
  const user = useUser();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes (render-time reset — the
  // React-recommended alternative to a setState-in-effect cascade).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "My Account" : "Log in";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-mist bg-white/95 shadow-[0_4px_20px_rgba(12,35,64,0.06)] backdrop-blur-md"
            : "border-transparent bg-white"
        }`}
      >
        <div className="mx-auto flex h-17 max-w-7xl items-center gap-8 px-6">
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
            <Logo dark />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3.5 py-2 text-[0.85rem] font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-green/10 text-green-2"
                    : "text-body hover:bg-navy/5 hover:text-navy"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="rounded-md px-3 py-2 text-[0.8rem] font-bold text-gold transition-colors hover:bg-navy/5"
              >
                Admin
              </Link>
            )}
            <Link
              href="/account/support"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.85rem] font-medium text-body transition-colors hover:bg-navy/5 hover:text-navy"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m9.9 9.9a5 5 0 010-7.072m-7.072 0a5 5 0 010 7.072M12 12h.01" />
              </svg>
              Support
            </Link>
            <Link
              href={accountHref}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.85rem] font-medium text-body transition-colors hover:bg-navy/5 hover:text-navy"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {accountLabel}
            </Link>
            {user && (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.85rem] font-medium text-body transition-colors hover:bg-navy/5 hover:text-navy"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            )}
            <Link
              href="/cart"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative flex items-center gap-2 rounded-full bg-green px-4 py-2 text-[0.8rem] font-bold text-white transition-colors hover:bg-green-2"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1 text-[0.65rem] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="hidden" // replaced by the mobile bottom tab bar; desktop shows inline links
          >
            <span className={`block h-0.5 w-6 rounded bg-navy transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 rounded bg-navy transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 rounded bg-navy transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-off/98 px-10 backdrop-blur-lg transition-all duration-400 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-2" aria-label="Mobile">
          {site.nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              className={`display text-4xl text-navy transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-green ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/cart" className="flex items-center gap-2.5 text-lg font-bold text-green-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
          <Link href={accountHref} className="text-lg font-bold text-body">
            {accountLabel}
          </Link>
          <Link href="/account/support" className="text-lg font-bold text-body">
            Support
          </Link>
          {user?.isAdmin && (
            <Link href="/admin" className="text-lg font-bold text-gold">
              Admin panel
            </Link>
          )}
          {user && (
            <button type="button" onClick={logout} className="text-left text-lg font-bold text-muted">
              Log out
            </button>
          )}
        </div>
        <a href={site.phoneHref} className="mt-8 flex items-center gap-2.5 text-lg font-bold text-green-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {site.phone}
        </a>
      </div>
    </>
  );
}
