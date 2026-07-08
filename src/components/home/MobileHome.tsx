"use client";

import Image from "next/image";
import Link from "next/link";
import { useSite, useStore } from "@/components/StoreProvider";
import { Accent } from "@/components/Accent";

/**
 * The phone-sized homepage — no pinned scenes, no scroll scrubbing, just
 * the essentials in one straight run: hero, collections, visualizer,
 * a review and how to find us. Rendered under lg; desktop keeps the
 * cinematic scroll story.
 */
export default function MobileHome() {
  const site = useSite();
  const { media, home, collections, testimonials } = useStore().content;
  const review = testimonials[0];

  return (
    <div className="bg-ink text-white">
      {/* ── Hero — static poster, no scrub ─────────────────────── */}
      <section className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden">
        <Image
          src={media.heroVideo.poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/35 to-ink" />
        <div className="relative px-5 pt-28 pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-green/40 bg-green/15 px-3.5 py-1.5 text-[0.66rem] font-bold tracking-[0.14em] text-green uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" aria-hidden="true" />
            {home.heroBadge}
          </span>
          <h1 className="display mt-4 text-4xl leading-[1.05]">
            <Accent text={home.heroHeadline} />
          </h1>
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-white/70">{home.heroSub}</p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/visualizer" className="btn btn-green justify-center">
              Try the Room Visualizer
            </Link>
            <Link href="/collections" className="btn btn-outline justify-center">
              View Collections
            </Link>
          </div>
        </div>
      </section>

      {/* ── The numbers ────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-navy-2/40">
        <div className="grid grid-cols-3 divide-x divide-white/10">
          {site.stats.map((s) => (
            <div key={s.label} className="px-2 py-5 text-center">
              <div className="display text-2xl text-white">
                {s.value}
                {s.suffix}
              </div>
              <div className="mt-1 text-[0.56rem] tracking-[0.14em] text-white/50 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Collections ────────────────────────────────────────── */}
      <section className="px-5 py-12">
        <p className="label text-green">The tile room</p>
        <h2 className="display mt-2 text-3xl">Walk the collections</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {collections.map((c, i) => (
            <Link
              key={c.id}
              href="/collections"
              className={`group relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-[4/5]"}`}
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 640px) 50vw, 92vw"
                className="object-cover transition-transform duration-500 group-active:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <p className="font-display text-base font-bold text-white">{c.name}</p>
                <p className="mt-0.5 text-[0.62rem] tracking-[0.08em] text-white/60 uppercase">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Visualizer ─────────────────────────────────────────── */}
      <section className="px-5 pb-12">
        <div className="relative overflow-hidden rounded-2xl border border-green/25 bg-gradient-to-br from-navy-2 to-ink p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_-10%,rgba(45,184,124,0.22),transparent_60%)]"
          />
          <p className="label text-green">AI-powered tool</p>
          <h2 className="display mt-2 text-3xl">
            See it <em className="accent-italic text-green">before</em> you buy it
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {["True-scale 3D design studio", "Tiles on a photo of your room", "Walk a furnished 360° room"].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/visualizer" className="btn btn-green mt-6 w-full justify-center">
            Open the Room Visualizer
          </Link>
        </div>
      </section>

      {/* ── One honest review ──────────────────────────────────── */}
      {review && (
        <section className="px-5 pb-12">
          <figure className="rounded-2xl border border-white/10 bg-navy-2/50 p-6">
            <div aria-label="5 star review" className="text-sm tracking-[0.2em] text-gold">
              ★★★★★
            </div>
            <blockquote className="mt-3 text-[0.95rem] leading-relaxed text-white/80">
              “{review.quote}”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green/15 font-display text-sm font-bold text-green">
                {review.name.charAt(0)}
              </span>
              <span>
                <span className="block font-display text-sm font-bold text-white">{review.name}</span>
                <span className="block text-xs text-white/50">{review.location}</span>
              </span>
            </figcaption>
          </figure>
        </section>
      )}

      {/* ── Visit us ───────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="rounded-2xl border border-white/10 bg-navy-2/50 p-6">
          <p className="label text-green">Visit the showroom</p>
          <p className="display mt-2 text-2xl text-white">
            {site.address.line1}
            <span className="block text-white/60">{site.address.line2}</span>
          </p>
          <dl className="mt-4 space-y-1.5 text-sm text-white/65">
            {site.hours.map((h) => (
              <div key={h.days} className="flex justify-between">
                <dt>{h.days}</dt>
                <dd className="font-medium text-white/85">{h.time}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <a href={site.phoneHref} className="btn btn-green justify-center">
              Call us
            </a>
            <a
              href={site.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline justify-center"
            >
              Directions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
