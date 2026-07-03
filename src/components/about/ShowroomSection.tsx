import Image from "next/image";
import Link from "next/link";
import Parallax from "@/components/scroll/Parallax";
import Reveal from "@/components/scroll/Reveal";
import { getContent } from "@/lib/db";

/** Closing scene — the showroom entrance, opening hours and directions. */
export default function ShowroomSection() {
  const { site, media } = getContent();
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(45,184,124,0.1),transparent_55%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl border border-white/10"
          >
            <div className="relative aspect-[4/3]">
              <Parallax speed={-0.12} className="absolute inset-0">
                <Image
                  src={media.aboutShowroomImage}
                  alt="The entrance to the Aster Tiles showroom"
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="scale-110 object-cover"
                />
              </Parallax>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
              <div className="absolute bottom-5 left-6">
                <div className="label text-green">Find Us</div>
                <div className="mt-1.5 font-display text-lg font-bold text-white">
                  {site.address.line1}
                </div>
                <div className="text-sm text-white/65">{site.address.line2}</div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <span data-reveal className="label text-green">
            Visit the Showroom
          </span>
          <h2 data-reveal className="display mt-3 text-4xl text-white sm:text-5xl">
            Come see it{" "}
            <em className="accent-italic text-green">in person</em>
          </h2>
          <p data-reveal className="mt-5 max-w-md text-white/65">
            Photos only get you so far. Stand on the tile, feel the finish and
            see the colour in natural light — the kettle is always on at{" "}
            {site.address.line1}.
          </p>

          <div data-reveal className="mt-8 max-w-md">
            <div className="label text-white/45">Opening Hours</div>
            <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
              {site.hours.map((h) => (
                <li
                  key={h.days}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-white/75">{h.days}</span>
                  <span
                    className={`font-display font-bold ${
                      h.time === "Closed" ? "text-white/40" : "text-white"
                    }`}
                  >
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal className="mt-9 flex flex-wrap gap-4">
            <a
              href={site.address.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-green"
            >
              Get Directions
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
            <Link href="/contact" className="btn btn-outline">
              Contact Us
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
