import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/scroll/Reveal";
import { getContent } from "@/lib/db";

export default function ContactCta() {
  const { site } = getContent();
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0 opacity-25">
        <Image
          src="/media/stills/showroom-wide.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <span data-reveal className="label text-green">
            Visit Us
          </span>
          <h2 data-reveal className="display mt-3 max-w-xl text-4xl text-white sm:text-5xl">
            The kettle&apos;s on at
            <br />
            <em className="accent-italic text-green">The Haw, Lifford</em>
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
          <div data-reveal className="rounded-2xl border border-white/12 bg-white/5 p-6 backdrop-blur">
            <div className="label text-white/50">Showroom</div>
            <div className="mt-2 text-white">
              {site.address.line1}
              <br />
              {site.address.line2}
            </div>
          </div>
          <div data-reveal className="rounded-2xl border border-white/12 bg-white/5 p-6 backdrop-blur">
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
