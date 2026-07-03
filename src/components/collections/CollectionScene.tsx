import Image from "next/image";
import Link from "next/link";
import Parallax from "@/components/scroll/Parallax";
import Reveal from "@/components/scroll/Reveal";
import type { CollectionInfo } from "@/lib/db";

/**
 * One category chapter — an alternating left/right split. Even indexes sit
 * on the light background with the image left; odd indexes flip to navy
 * with the image right. Anchored by collection id so the home-page rail
 * links (/collections#floor-tiles) land here.
 */
export default function CollectionScene({
  collection: c,
  index,
  total,
}: {
  collection: CollectionInfo;
  index: number;
  total: number;
}) {
  const dark = index % 2 === 1;

  return (
    <section
      id={c.id}
      className={`relative scroll-mt-24 overflow-hidden py-20 lg:py-28 ${
        dark ? "bg-navy" : "bg-off"
      }`}
    >
      {dark && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(45,184,124,0.1),transparent_55%)]" />
      )}

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        {/* image */}
        <Reveal className={dark ? "lg:order-2" : ""}>
          <div
            data-reveal
            className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${
              dark ? "border border-white/10" : "shadow-lift"
            }`}
          >
            <Parallax
              speed={-0.16}
              className="absolute inset-x-0 -top-[12%] -bottom-[12%]"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 1024px) 48vw, 92vw"
                className="object-cover"
              />
            </Parallax>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
          </div>
        </Reveal>

        {/* text */}
        <Reveal className={dark ? "lg:order-1" : ""}>
          <p
            data-reveal
            className={`font-display text-[0.7rem] font-bold tracking-[0.22em] ${
              dark ? "text-white/40" : "text-navy/40"
            }`}
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </p>
          <p data-reveal className="label mt-5 text-green">
            {c.blurb}
          </p>
          <h2
            data-reveal
            className={`display mt-3 text-4xl sm:text-5xl ${
              dark ? "text-white" : "text-navy"
            }`}
          >
            {c.name}
          </h2>
          <p
            data-reveal
            className={`mt-5 max-w-md ${dark ? "text-white/65" : "text-muted"}`}
          >
            {c.description}
          </p>
          <div data-reveal className="mt-8">
            <Link
              href="/visualizer"
              className={`btn ${dark ? "btn-green" : "btn-navy"}`}
            >
              Try in Visualizer
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
