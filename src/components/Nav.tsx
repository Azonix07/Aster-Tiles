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
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    // Flip to the solid nav once we've scrolled past most of the hero.
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8);
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

  // The homepage hero is the only dark-at-top surface, so the nav is only
  // transparent (white text over video) at the top of "/". Everywhere else it's
  // the solid light bar with dark text.
  const overHero = pathname === "/" && !pastHero;
  const shadow = overHero ? "[text-shadow:0_1px_12px_rgba(0,0,0,0.4)]" : "";

  // A nav link with an underline that wipes in on hover (persistent when active).
  const navLink = (active: boolean) =>
    `relative px-3.5 py-2 text-[0.85rem] font-medium transition-colors after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-300 ${shadow} ${
      active
        ? `${overHero ? "text-white" : "text-green-2"} after:scale-x-100`
        : `${overHero ? "text-white/75 hover:text-white" : "text-body hover:text-navy"} after:scale-x-0 hover:after:scale-x-100`
    }`;

  const utilLink = `flex items-center gap-2 px-3 py-2 text-[0.85rem] font-medium transition-colors ${shadow} ${
    overHero ? "text-white/75 hover:text-white" : "text-body hover:text-navy"
  }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          overHero
            ? "border-transparent bg-transparent"
            : "border-mist bg-white/95 shadow-[0_4px_20px_rgba(16,18,24,0.06)] backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-17 max-w-7xl items-center gap-8 px-6">
          <Link href="/" aria-label={`${site.name} home`} className={`shrink-0 ${shadow}`}>
            <Logo dark={!overHero} />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} className={navLink(pathname === item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {user?.isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 text-[0.8rem] font-bold transition-colors ${shadow} ${
                  overHero ? "text-white/80 hover:text-white" : "text-gold hover:text-navy"
                }`}
              >
                Admin
              </Link>
            )}
            <Link href={accountHref} className={utilLink}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {accountLabel}
            </Link>
            {user && (
              <button type="button" onClick={logout} className={utilLink}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            )}
            <Link
              href="/cart"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative ml-1 flex items-center gap-2 rounded-md bg-green px-4 py-2 text-[0.8rem] font-bold text-white transition-colors hover:bg-green-2"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.65rem] font-bold text-white">
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
