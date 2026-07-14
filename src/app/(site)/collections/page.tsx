import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal, { RevealLines } from "@/components/scroll/Reveal";
import Parallax from "@/components/scroll/Parallax";
import Rings from "@/components/decor/Rings";
import CollectionScene from "@/components/collections/CollectionScene";
import TileGrid from "@/components/collections/TileGrid";
import { getContent } from "@/lib/db";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Browse 500+ tile ranges at Aster Tiles, Lifford — floor tiles, feature walls, bathrooms, wooden floors, outdoor porcelain and kitchen splashbacks.",
};

/**
 * The Collections — six category chapters, the full tile range, and an
 * invitation to the showroom.
 */
export default function CollectionsPage() {
  const { site, staff, collections, media } = getContent();
  return (
    <>
      {/* ── Page header ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-mist bg-white">
        <Rings id="collections-rings" className="absolute -top-24 -right-24 h-80 w-80 opacity-15" />
        <Rings id="collections-rings-2" className="absolute -bottom-40 -left-32 h-96 w-96 opacity-10" />
        <Reveal className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-20 pb-16 text-center lg:pt-28">
          <p data-reveal className="label text-green-2">
            500+ ranges in stock
          </p>
          <RevealLines
            as="h1"
            text="The Collections"
            className="display mt-4 text-5xl text-navy sm:text-6xl lg:text-7xl"
          />
          <p data-reveal className="mt-6 max-w-xl text-muted">
            Floor tiles, feature walls, bathrooms, wooden floors, outdoor
            porcelain and kitchens — six rooms of inspiration under one
            Lifford roof.
          </p>
        </Reveal>
      </section>

      {/* ── Six category chapters ─────────────────────────── */}
      {collections.map((c, i) => (
        <CollectionScene key={c.id} collection={c} index={i} total={collections.length} />
      ))}

      {/* ── Shop the range ────────────────────────────────── */}
      <section className="bg-off py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p data-reveal className="label text-green">
              In Stock Now
            </p>
          </Reveal>
          <RevealLines
            as="h2"
            text="Shop the range"
            className="display mt-3 text-4xl text-navy sm:text-5xl"
          />
          <Reveal>
            <p data-reveal className="mt-5 max-w-xl text-muted">
              Twelve of our most-loved tiles, priced per square metre and ready
              to take home as samples. Every one of them works in the Room
              Visualizer.
            </p>
          </Reveal>
          <div className="mt-10">
            <TileGrid />
          </div>
        </div>
      </section>

      {/* ── Cinematic break ───────────────────────────────── */}
      <section className="relative h-[72vh] min-h-[460px] overflow-hidden">
        <Parallax
          speed={-0.22}
          className="absolute inset-x-0 -top-[14%] -bottom-[14%]"
        >
          <Image
            src={media.collectionsBreakImage}
            alt="Open-plan living space finished in marble-effect porcelain"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/45 to-navy" />

        <Reveal className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <blockquote data-reveal className="max-w-3xl">
            <p className="display not-italic text-3xl leading-snug text-white sm:text-4xl lg:text-5xl">
              “A room gets repainted every few years. A floor is chosen once —
              so choose it with your hands, in real light.”
            </p>
          </blockquote>
          <p data-reveal className="label mt-8 text-green">
            {staff[0].name} · {staff[0].role}
          </p>
        </Reveal>
      </section>

      {/* ── Closing CTA ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_130%,rgba(45,184,124,0.18),transparent_60%)]" />

        <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <p data-reveal className="label text-green">
            Visit the Showroom
          </p>
          <h2
            data-reveal
            className="display mt-4 text-4xl text-white sm:text-5xl lg:text-6xl"
          >
            Can&apos;t decide?
            <br />
            <em className="not-italic text-green">The kettle&apos;s on.</em>
          </h2>
          <p data-reveal className="mt-6 max-w-xl text-white/65">
            Bring a photo of your room to {site.address.line1} and leave with
            samples under your arm — or start online and we&apos;ll take it
            from there.
          </p>
          <div data-reveal className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn btn-green">
              Plan Your Visit
            </Link>
            <Link href="/visualizer" className="btn btn-outline">
              Open the Visualizer
            </Link>
          </div>
          <a
            data-reveal
            href={site.phoneHref}
            className="mt-8 text-sm text-white/50 transition-colors hover:text-green"
          >
            Or call us — {site.phone}
          </a>
        </Reveal>
      </section>
    </>
  );
}
