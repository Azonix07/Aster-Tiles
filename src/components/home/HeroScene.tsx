"use client";

import Link from "next/link";
import ScrubVideo from "@/components/scroll/ScrubVideo";
import { useSite } from "@/components/StoreProvider";

/**
 * Act I — Arrival. The camera pushes toward the showroom door as the
 * visitor scrolls; headline hands over to an invitation to step inside.
 */
export default function HeroScene() {
  const site = useSite();
  return (
    <ScrubVideo
      src="/media/video/exterior-arrival-scrub.mp4"
      poster="/media/video/exterior-arrival-poster.jpg"
      pinHeight={280}
    >
      {/* readability gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-ink/70 via-ink/25 to-ink/60" />

      {/* Chapter 1 — headline */}
      <div
        data-window="0,0.3"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      >
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-green/40 bg-green/15 px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.14em] text-green uppercase">
          <span className="text-[0.5rem]">●</span> Donegal&apos;s Premier Tile Showroom
        </span>
        <h1 className="display max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl">
          Transform your <em className="accent-italic text-green">space</em>
          <br />
          with premium tiles
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/75">
          Exquisite tiles, wooden floors and bathroom solutions — serving all
          of Ireland from our Lifford showroom.
        </p>
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
        <p className="label text-green">The Haw · Lifford · Co. Donegal</p>
        <h2 className="display mt-4 max-w-3xl text-4xl text-white sm:text-5xl">
          Fifteen years on the same street,
          <br />
          <em className="accent-italic text-white/80">five thousand</em> happy homes
        </h2>
      </div>

      {/* Chapter 3 — hand over to the door */}
      <div
        data-window="0.74,1"
        className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 px-6 text-center"
      >
        <h2 className="display text-4xl text-white sm:text-5xl">
          Step <em className="accent-italic text-green">inside</em>
        </h2>
        <p className="mt-3 text-white/70">Keep scrolling — the doors are open.</p>
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
