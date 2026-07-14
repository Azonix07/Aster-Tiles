import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import Rings from "@/components/decor/Rings";
import { getContent } from "@/lib/db";

/** Closing band: visit details on brand navy, leading into the footer. */
export default async function ContactCta() {
  const { site } = await getContent();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-2">
      {/* floating glass crystals — the black ground disappears via screen blend */}
      <Parallax speed={0.25} className="pointer-events-none absolute -top-24 -right-24 h-[26rem] w-[26rem] opacity-60 mix-blend-screen">
        <Image src="/media/floating_shape.png" alt="" fill sizes="26rem" className="object-contain" />
      </Parallax>
      <Rings id="cta-rings" className="absolute -bottom-32 -left-24 h-96 w-96 opacity-15" from="#2db87c" to="#f4f6f9" />
      <div className="noise-overlay" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.3fr_1fr] lg:py-28">
        <Reveal>
          <span data-reveal className="label text-green">
            Visit Us
          </span>
          <h2 data-reveal className="display mt-3 max-w-xl text-4xl text-white sm:text-5xl">
            The kettle&apos;s on at
            <br />
            <em className="not-italic text-green">The Haw, Lifford</em>
          </h2>
          <p data-reveal className="mt-5 max-w-md text-white/65">
            Drop in for samples and honest advice — or send us a photo of your
            room and we&apos;ll quote it the same day.
          </p>
          <div data-reveal className="mt-9 flex flex-wrap gap-4">
            <Link href="/contact" className="btn btn-green">
              Get a Quote
            </Link>
            <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Directions
            </a>
          </div>
        </Reveal>

        <Reveal className="flex flex-col justify-center gap-6" stagger={0.1}>
          <div data-reveal className="glass rounded-2xl p-6">
            <div className="label text-white/50">Showroom</div>
            <div className="mt-2 text-white">
              {site.address.line1}
              <br />
              {site.address.line2}
            </div>
            <dl className="mt-4 space-y-1.5 text-sm text-white/60">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt>{h.days}</dt>
                  <dd className="font-medium text-white/85">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div data-reveal className="glass rounded-2xl p-6">
            <div className="label text-white/50">Call or Email</div>
            <div className="mt-2 space-y-1">
              <a href={site.phoneHref} className="block font-bold text-green hover:text-white">
                {site.phone}
              </a>
              <a href={site.emailHref} className="block text-white/80 hover:text-green">
                {site.email}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
