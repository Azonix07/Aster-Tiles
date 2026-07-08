"use client";

import Link from "next/link";
import ScrubVideo from "@/components/scroll/ScrubVideo";
import { useSite, useStore } from "@/components/StoreProvider";
import { Accent } from "@/components/Accent";

/**
 * Act I — Arrival. The camera pushes toward the showroom door as the
 * visitor scrolls; headline hands over to an invitation to step inside.
 */
export default function HeroScene() {
  const site = useSite();
  const { media, home } = useStore().content;
  return (
    <ScrubVideo
      src={media.heroVideo.src}
      poster={media.heroVideo.poster}
      pinHeight={280}
    >
      {/* readability gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-ink/70 via-ink/35 to-ink/60" />

      {/* Chapter 1 — headline */}
      <div
        data-window="0,0.3"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      >
        {/* scrim keeps the headline readable over bright video frames */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_62%_48%_at_50%_50%,rgba(7,23,42,0.62),transparent_74%)]"
        />
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-green/40 bg-green/15 px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.14em] text-green uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" aria-hidden="true" />
          {home.heroBadge}
        </span>
        <h1 className="display max-w-4xl text-5xl text-white drop-shadow-[0_2px_18px_rgba(7,23,42,0.7)] sm:text-6xl lg:text-7xl">
          <Accent text={home.heroHeadline} />
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/85 drop-shadow-[0_1px_10px_rgba(7,23,42,0.8)]">{home.heroSub}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/visualizer" className="btn btn-green">
            Try the Room Visualizer
          </Link>
          <Link href="/collections" className="btn btn-outline">
            View Collections
          </Link>
        </div>
      </div>

      {/* Chapter 2 — the address line */}
      <div
        data-window="0.42,0.66"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_62%_48%_at_50%_50%,rgba(7,23,42,0.62),transparent_74%)]"
        />
        <p className="label text-green">{home.heroAddressLabel}</p>
        <h2 className="display mt-4 max-w-3xl text-4xl text-white drop-shadow-[0_2px_18px_rgba(7,23,42,0.7)] sm:text-5xl">
          <Accent text={home.heroAddressHeadline} accentClass="accent-italic text-white/80" />
        </h2>
      </div>

      {/* Chapter 3 — hand over to the door */}
      <div
        data-window="0.74,1"
        className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 px-6 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_88%,rgba(7,23,42,0.66),transparent_76%)]"
        />
        <h2 className="display text-4xl text-white drop-shadow-[0_2px_18px_rgba(7,23,42,0.7)] sm:text-5xl">
          <Accent text={home.heroClosingHeadline} />
        </h2>
        <p className="mt-3 text-white/80 drop-shadow-[0_1px_10px_rgba(7,23,42,0.8)]">{home.heroClosingSub}</p>
      </div>

      {/* scroll cue */}
      <div
        data-window="0,0.12"
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <div className="flex h-12 w-7 items-start justify-center rounded-full border-2 border-white/40 p-1.5">
          <div className="h-2.5 w-1 animate-bounce rounded-full bg-green" />
        </div>
      </div>

      <span className="sr-only">{site.description}</span>
    </ScrubVideo>
  );
}
