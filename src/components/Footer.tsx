import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getContent } from "@/lib/db";

export default async function Footer() {
  const { site } = await getContent();
  return (
    <footer className="border-t border-white/10 bg-ink text-white/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{site.description}</p>
        </div>

        <div>
          <h3 className="label mb-4 text-white/90">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-green">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="label mb-4 text-white/90">Opening Hours</h3>
          <ul className="space-y-2.5 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-4">
                <span>{h.days}</span>
                <span className="text-white/85">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="label mb-4 text-white/90">Visit Us</h3>
          <address className="space-y-2.5 text-sm not-italic">
            <p>
              {site.address.line1}
              <br />
              {site.address.line2}
            </p>
            <p>
              <a href={site.phoneHref} className="text-green hover:text-white">
                {site.phone}
              </a>
            </p>
            <p>
              <a href={site.emailHref} className="transition-colors hover:text-green">
                {site.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>
            Tiles · Wooden Floors · Bathrooms — Lifford, Co. Donegal
          </p>
        </div>
      </div>
    </footer>
  );
}
