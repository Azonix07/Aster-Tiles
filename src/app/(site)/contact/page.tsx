import type { Metadata } from "next";
import Reveal, { RevealLines } from "@/components/scroll/Reveal";
import Rings from "@/components/decor/Rings";
import ContactForm from "@/components/contact/ContactForm";
import { getContent } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Visit the Aster Tiles showroom in Lifford, Co. Donegal, or send us a message — same-day quotes and expert advice on tiles, wooden floors and bathrooms.",
};

/* ── Green icon chip ─────────────────────────────── */
function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green/12 text-green">
      {children}
    </div>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export default async function ContactPage() {
  const { site } = await getContent();
  return (
    <>
      {/* ── Header ─────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-mist bg-white pt-16 pb-16 lg:pt-24">
        <Rings id="contact-rings" className="absolute -top-24 -right-28 h-96 w-96 opacity-15" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p data-reveal className="label text-green-2">
              Get in touch
            </p>
          </Reveal>
          <RevealLines
            as="h1"
            text={"Visit us or\nsend a message"}
            className="display mt-5 text-5xl text-navy sm:text-6xl lg:text-7xl"
          />
          <Reveal>
            <p data-reveal className="mt-7 max-w-xl text-lg text-muted">
              Call into the showroom for a wander through 500+ collections, or
              drop us a line below — every enquiry gets a ring back within one
              working day.
            </p>
            <div data-reveal className="mt-9 flex flex-wrap gap-4">
              <a href={site.phoneHref} className="btn btn-green">
                <svg {...iconProps} width={15} height={15}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                {site.phone}
              </a>
              <a href={site.emailHref} className="btn btn-ghost-dark">
                Email the team
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Details + form split ───────────────────── */}
      <section className="bg-off py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* LEFT — contact detail cards */}
          <Reveal stagger={0.1} className="space-y-5">
            {/* Showroom */}
            <div data-reveal className="flex gap-5 rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(12,35,64,0.07)]">
              <IconChip>
                <svg {...iconProps}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </IconChip>
              <div>
                <h3 className="font-display text-base font-bold text-navy">Showroom</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </p>
                <a
                  href={site.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-block text-sm font-semibold text-green transition hover:text-green-2"
                >
                  Get directions →
                </a>
              </div>
            </div>

            {/* Phone */}
            <div data-reveal className="flex gap-5 rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(12,35,64,0.07)]">
              <IconChip>
                <svg {...iconProps}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </IconChip>
              <div>
                <h3 className="font-display text-base font-bold text-navy">Phone</h3>
                <a
                  href={site.phoneHref}
                  className="mt-1.5 inline-block text-sm font-semibold text-body transition hover:text-green"
                >
                  {site.phone}
                </a>
                <p className="mt-1 text-sm text-muted">
                  Quickest for quotes and stock checks.
                </p>
              </div>
            </div>

            {/* Email */}
            <div data-reveal className="flex gap-5 rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(12,35,64,0.07)]">
              <IconChip>
                <svg {...iconProps}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </IconChip>
              <div>
                <h3 className="font-display text-base font-bold text-navy">Email</h3>
                <a
                  href={site.emailHref}
                  className="mt-1.5 inline-block text-sm font-semibold break-all text-body transition hover:text-green"
                >
                  {site.email}
                </a>
                <p className="mt-1 text-sm text-muted">
                  Send room photos and measurements any time.
                </p>
              </div>
            </div>

            {/* Opening hours */}
            <div data-reveal className="flex gap-5 rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(12,35,64,0.07)]">
              <IconChip>
                <svg {...iconProps}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </IconChip>
              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-navy">Opening hours</h3>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {site.hours.map((h) => (
                      <tr key={h.days} className="border-b border-mist/50 last:border-0">
                        <td className="py-2 pr-4 text-muted">{h.days}</td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            h.time === "Closed" ? "text-muted/70" : "text-navy"
                          }`}
                        >
                          {h.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — enquiry form */}
          <Reveal>
            <div data-reveal>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Map ────────────────────────────────────── */}
      <section className="bg-off">
        <Reveal>
          <div data-reveal>
            <iframe
              src="https://www.google.com/maps?q=The+Haw,+Lifford,+Co.+Donegal&output=embed"
              title={`Map of the ${site.name} showroom — ${site.address.line1}, ${site.address.line2}`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[420px] w-full border-0 grayscale transition duration-700 hover:grayscale-0"
            />
          </div>
        </Reveal>
      </section>

      {/* ── Trust band ─────────────────────────────── */}
      <section className="bg-navy py-16">
        <Reveal className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-3">
          {[
            {
              title: "Same-day quotes",
              copy: "Ring with your room sizes before noon and we’ll have a full quote back to you by close of business.",
              icon: (
                <svg {...iconProps}>
                  <path d="M13 2L4.09 12.97a.6.6 0 00.46.98H11l-1 8 8.91-10.97a.6.6 0 00-.46-.98H13l1-8z" />
                </svg>
              ),
            },
            {
              title: "Free nationwide delivery",
              copy: "Full pallets delivered anywhere in Ireland at no cost — from Donegal to Cork, every tile checked before it leaves.",
              icon: (
                <svg {...iconProps}>
                  <path d="M1 5h13v11H1zM14 9h4l4 4v3h-8z" />
                  <circle cx="6" cy="18.5" r="2" />
                  <circle cx="18" cy="18.5" r="2" />
                </svg>
              ),
            },
            {
              title: "Expert advice",
              copy: "Fifteen-plus years of tiles, floors and bathrooms — bring a photo and we’ll match a look to your home.",
              icon: (
                <svg {...iconProps}>
                  <path d="M21 12a9 9 0 11-4.2-7.6" />
                  <path d="M9 11l3 3 8-8" />
                </svg>
              ),
            },
          ].map((f) => (
            <div key={f.title} data-reveal className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green/15 text-green">
                {f.icon}
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{f.copy}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>
    </>
  );
}
